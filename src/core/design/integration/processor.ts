import { streamText, CoreMessage } from 'ai';
import {
  CodegenRule,
  ComponentDesign,
  ComponentDesignRequest,
  DesignBlock,
  DesignStrategy,
} from '@/types/mcp-types.js';
import type { IntegratedDesign } from '@/types/mcp-types.js';
import { getAIClientByModelName } from '@/config/ai-client-adapter.js';
import { getRecommendedModel } from '@/config/model-manager.js';
import { ModelPurpose } from '@/config/types.js';
import { getPrivateDocsDescription } from '@/config/rule-processors.js';
import { analyzeRequirementComplexity } from '../complexity-analyzer.js';
import { generateBlockStrategy } from '../blocks/generator.js';
import { parseDesignAnalysisXml } from './xml-parser.js';
import { loadPrivateComponentCodegen } from '../config-loader.js';

/**
 * Design integration module
 * Main functions:
 * 1. Requirement analysis - understand user requirements and analyze complexity
 * 2. Block strategy - decompose complex requirements into manageable design blocks
 * 3. Design summary - provide overall design strategy and step-by-step guidance
 */

// ============ 系统提示词构建 ============

export function buildAnalysisPrompt(rules: CodegenRule[]) {
  console.log(
    '[DEBUG] buildAnalysisPrompt - Starting to build analysis prompt'
  );

  const componentsDescription = getPrivateDocsDescription(rules);
  console.log(
    '[DEBUG] buildAnalysisPrompt - componentsDescription length:',
    componentsDescription.length
  );

  const goal =
    'Analyze user requirements and create a design strategy with block-based approach for complex requirements.';

  const constraints = `Available component library:
    ${componentsDescription || 'No specific component library available, but you can use any appropriate components from your knowledge.'}
    Please note: You should not provide example code, only provide XML response.
    Block granularity rule: Prefer 3-5 blocks for complex pages/components, and never exceed 5 total blocks. Merge minor UI areas into major ones when necessary.`;

  const responseFormat = `<DesignAnalysis>
  <RequirementSummary>Brief summary of user requirements</RequirementSummary>
  <ComplexityLevel>simple|medium|complex</ComplexityLevel>
  <DesignStrategy>Overall design approach and strategy</DesignStrategy>
  <Blocks>
    <Block>
      <BlockId>block-id</BlockId>
      <BlockType>layout|component|logic</BlockType>
      <Title>Block title</Title>
      <Description>Block description</Description>
      <Priority>high|medium|low</Priority>
      <EstimatedTokens>estimated token count</EstimatedTokens>
      <Dependencies>comma-separated block ids</Dependencies>
    </Block>
    <!-- More blocks as needed -->
  </Blocks>
  <ImplementationSteps>
    <Step>
      <StepNumber>1</StepNumber>
      <BlockId>block-id</BlockId>
      <Action>Action description</Action>
      <ToolCall>design_block</ToolCall>
    </Step>
    <!-- More steps as needed -->
  </ImplementationSteps>
</DesignAnalysis>`;

  const workflowSteps = `1. Analyze user requirements for complexity
    2. Determine if block-based approach is needed
    3. Create design strategy and block breakdown
    4. Generate implementation steps for IDE`;

  const finalPrompt = `
    # You are a senior frontend architect who excels at analyzing requirements and creating design strategies.
    
    ## Goal
    ${goal}
    
    ## Constraints
    ${constraints}
    
    ## Response Format
    You must respond with an XML structure in the following format:
    ${responseFormat}
    
    ## Workflow
    ${workflowSteps}
  `;

  console.log(
    '[DEBUG] buildAnalysisPrompt - Final prompt length:',
    finalPrompt.length
  );

  return finalPrompt;
}

/**
 * Build user message for analysis
 */
export function buildUserMessage(
  prompt: ComponentDesignRequest['prompt']
): Array<CoreMessage> {
  return [
    {
      role: 'user',
      content: prompt
        .filter((p) => p.type === 'text')
        .map((p) => p.text)
        .join('\n'),
    },
  ];
}

/**
 * Main component design processor
 */
export async function processComponentDesign(
  request: ComponentDesignRequest,
  streamHandler?: (chunk: string) => void
): Promise<DesignStrategy> {
  try {
    // Automatically load project configuration
    const { rules: projectRules, defaultModel } = loadPrivateComponentCodegen();

    console.log(
      '[DEBUG] processComponentDesign - projectRules length:',
      projectRules.length
    );

    // Use project configuration or user-provided configuration
    const rules = projectRules.length > 0 ? projectRules : request.rules;

    // Determine the model to use
    const modelName =
      request.aiModel || getRecommendedModel(ModelPurpose.INTEGRATION);

    // Use the project's AI client adapter
    let model;
    try {
      model = getAIClientByModelName(modelName);
    } catch (error) {
      console.error(`[MCP] Failed to create AI client:`, error);
      throw new Error(
        `Failed to create AI client for model ${modelName}: ${error}`
      );
    }

    // Analyze requirement complexity - use the unified complexity analysis interface
    console.log('[DEBUG] Starting complexity analysis...');
    const complexityAnalysis = await analyzeRequirementComplexity(
      request.prompt,
      {
        useAI: true,
        aiModel: modelName,
        maxRetries: 3,
      }
    );

    // If complexity is simple, return simple design strategy
    if (complexityAnalysis.complexity === 'simple') {
      return {
        requirementSummary: complexityAnalysis.reasoning,
        complexityLevel: 'simple',
        designStrategy: 'Design single component directly',
        blocks: generateBlockStrategy(request.prompt, 'simple'),
        implementationSteps: [
          {
            stepNumber: 1,
            blockId: 'main-component',
            action: 'Design main component',
            toolCall: 'design_block',
          },
        ],
      };
    }

    // For complex requirements, use AI for analysis
    const systemPrompt = buildAnalysisPrompt(rules);
    const messages = buildUserMessage(request.prompt);

    // Use the configured AI model
    const stream = await streamText({
      system: systemPrompt,
      model: model as any,
      messages,
    });

    let accumulatedXml = '';

    for await (const part of stream.textStream) {
      if (streamHandler) {
        streamHandler(part);
      }
      accumulatedXml += part;
    }

    // Try to extract XML from the response
    const xmlMatch = accumulatedXml.match(
      /<DesignAnalysis>[\s\S]*<\/DesignAnalysis>/
    );
    if (!xmlMatch) {
      console.error('[MCP] AI Response without valid XML:', accumulatedXml);
      throw new Error('No valid XML found in the response');
    }

    // Parse XML (here we need to implement XML parsing logic)
    const designStrategy = parseDesignAnalysisXml(xmlMatch[0]);

    return designStrategy;
  } catch (err: unknown) {
    console.error('[MCP] Component design processing error:', err);
    if (err instanceof Error) {
      throw err;
    }
    throw new Error(String(err));
  }
}

// ============ 设计集成功能 ============

/**
 * Integrate design blocks into a complete design
 */
export function integrateDesign(
  strategy: DesignStrategy,
  blockDesigns: Array<{ blockId: string; component: ComponentDesign }>
): IntegratedDesign {
  // Aggregate props by block
  const propsByBlock: Record<
    string,
    Array<{
      name: string;
      type: string;
      required?: boolean;
      default?: string;
      description?: string;
    }>
  > = {};

  // Collect all used private components
  const privateComponentsUsed = new Set<string>();

  blockDesigns.forEach(({ blockId, component }) => {
    // Collect props for this block
    if (component.props) {
      propsByBlock[blockId] = component.props;
    }

    // Collect private components used
    component.library.forEach((lib) => {
      lib.components.forEach((comp) => {
        if (comp.startsWith('das-')) {
          privateComponentsUsed.add(comp);
        }
      });
    });
  });

  // Generate composition plan
  const compositionPlan = generateCompositionPlan(strategy, blockDesigns);

  return {
    strategy,
    blockDesigns,
    aggregated: {
      propsByBlock,
      privateComponentsUsed: Array.from(privateComponentsUsed),
    },
    compositionPlan,
  };
}

/**
 * Generate composition plan for the integrated design
 */
function generateCompositionPlan(
  strategy: DesignStrategy,
  blockDesigns: Array<{ blockId: string; component: ComponentDesign }>
): string {
  const sections = [
    '# 组件集成方案',
    '',
    '## 整体策略',
    strategy.designStrategy,
    '',
    '## 区块组成',
  ];

  strategy.blocks.forEach((block) => {
    const blockDesign = blockDesigns.find((bd) => bd.blockId === block.blockId);
    sections.push(`### ${block.title}`);
    sections.push(`- **类型**: ${block.blockType}`);
    sections.push(`- **描述**: ${block.description}`);
    sections.push(`- **优先级**: ${block.priority}`);

    if (blockDesign) {
      sections.push(`- **组件名**: ${blockDesign.component.componentName}`);
      sections.push(
        `- **描述**: ${blockDesign.component.componentDescription}`
      );

      if (blockDesign.component.library.length > 0) {
        sections.push('- **使用的组件库**:');
        blockDesign.component.library.forEach((lib) => {
          sections.push(`  - ${lib.name}: ${lib.components.join(', ')}`);
        });
      }
    }
    sections.push('');
  });

  sections.push('## 集成建议');
  sections.push('1. 按照区块优先级顺序进行开发');
  sections.push('2. 注意区块间的依赖关系');
  sections.push('3. 统一使用私有组件库保持一致性');
  sections.push('4. 确保组件间的数据流清晰');

  return sections.join('\n');
}
