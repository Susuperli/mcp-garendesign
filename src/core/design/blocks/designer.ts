import { streamText } from 'ai';
import {
  CodegenRule,
  ComponentDesign,
  ComponentDesignRequest,
  DesignBlock,
} from '@/types/mcp-types.js';
import { getAIClientByModelName } from '@/config/ai-client-adapter.js';
import { getRecommendedModel } from '@/config/model-manager.js';
import { ModelPurpose } from '@/config/types.js';
import {
  getPrivateComponentDocs,
  getPrivateDocsDescription,
} from '@/config/rule-processors.js';
import { loadPrivateComponentCodegen } from '../config-loader.js';

/**
 * Smart block design processor
 * Handles detailed design for a specific design block using smart strategy
 * This implements phase two of the smart design strategy
 */

/**
 * Build smart block design prompt
 */
export function buildSmartBlockDesignPrompt(
  rules: CodegenRule[],
  blockInfo: DesignBlock,
  integratedContext?: any
): string {
  const componentsDescription = getPrivateDocsDescription(rules);

  const goal = `Design a specific component for the "${blockInfo.title}" block based on the smart design strategy.`;

  const context = integratedContext
    ? `
## Design Context
- Overall Strategy: ${integratedContext.strategy?.designStrategy || 'N/A'}
- Current Block: ${blockInfo.title} (${blockInfo.blockType})
- Block Description: ${blockInfo.description}
- Block Priority: ${blockInfo.priority}
- Dependencies: ${blockInfo.dependencies?.join(', ') || 'None'}
`
    : '';

  const constraints = `
## Available Resources
### Component Library
${componentsDescription || 'No specific component library available'}

## Design Requirements
1. **优先使用私有组件库**：仔细分析可用的私有组件，优先使用现有组件完成功能
2. **充分了解组件能力**：学习每个私有组件的用途、使用场景和API，确保正确使用
3. **优先使用复合组件**：如果一个私有组件已经包含多个相关功能，应该作为一个整体使用，避免不必要的拆分
4. **组件组合设计**：通过组合多个私有组件来实现复杂功能，而不是重新造轮子
5. **考虑业务场景**：根据业务需求选择最合适的私有组件

## 私有组件学习指南
请仔细阅读上述组件库描述，了解每个组件的：
- **用途**：组件的主要功能和适用场景
- **使用方式**：如何正确使用该组件
- **API接口**：组件提供的属性和事件
- **限制条件**：组件的使用限制和注意事项

## 设计策略
1. **分析需求**：首先分析当前块的具体功能需求
2. **匹配组件**：在私有组件库中寻找最匹配的组件，优先考虑复合组件
3. **组合设计**：如果单个组件无法满足需求，考虑组合多个组件
4. **验证可行性**：确保选择的组件能够实现所需功能
5. **优化方案**：选择最优的组件组合方案

## Output Format

请返回JSON格式的组件设计结果：

\`\`\`json
{
  "componentName": "组件名称",
  "componentDescription": "组件的详细描述和功能说明",
  "props": [
    {
      "name": "属性名",
      "type": "属性类型",
      "required": true,
      "default": "默认值",
      "description": "属性描述"
    }
  ],
  "library": [
    {
      "name": "组件库名称",
      "components": [
        {
          "name": "组件名称",
          "purpose": "组件用途",
          "usage": "使用场景",
          "isPrivate": true
        }
      ],
      "description": "组件组合使用说明"
    }
  ],
  "implementationNotes": [
    "关键实现考虑",
    "集成要点",
    "性能考虑"
  ]
}
\`\`\`

**重要说明**：
- 只推荐私有组件库中实际存在的组件
- 详细说明选择的组件如何协同工作以满足块的需求
- 如果需要多个组件，说明它们的角色和交互关系
- 考虑组件的API和使用模式进行推荐
`;

  const workflowSteps = `
## Design Workflow
1. **深入学习私有组件库**：仔细阅读并理解每个私有组件的功能、API和使用场景
2. **分析块的具体需求**：明确当前块需要实现的具体功能和交互要求
3. **匹配最佳组件**：在私有组件库中寻找最匹配的组件，优先考虑复合组件
4. **设计组件组合**：如果单个组件无法满足需求，设计多个组件的组合方案
5. **验证设计可行性**：确保选择的组件组合能够实现所有需求
6. **考虑集成和扩展**：设计时要考虑与其他块的集成和数据流
7. **优化和简化**：选择最简单、最有效的组件组合方案
`;

  return `
# Smart Component Design

## Goal
${goal}

${context}

## Constraints
${constraints}

## Workflow
${workflowSteps}

Please provide a comprehensive component design that follows the smart design strategy.
`;
}

/**
 * Build user message for smart block design
 */
export function buildSmartBlockUserMessage(
  prompt: ComponentDesignRequest['prompt']
): Array<{ role: 'user'; content: string }> {
  return [
    {
      role: 'user',
      content: prompt.map(p => p.text).join('\n'),
    },
  ];
}

/**
 * Process smart block design
 */
export async function processSmartBlockDesign(
  request: ComponentDesignRequest,
  blockId: string,
  blockInfo?: DesignBlock,
  integratedContext?: any
): Promise<ComponentDesign> {
  try {
    const { rules, aiModel } = request;

    // 自动加载项目配置，如果用户没有提供 rules 或 rules 为空
    let effectiveRules = rules;
    if (!rules || rules.length === 0) {
      try {
        const { rules: projectRules } = loadPrivateComponentCodegen();
        effectiveRules = projectRules;
      } catch (error) {
        effectiveRules = [];
      }
    }

    const modelName = aiModel || getRecommendedModel(ModelPurpose.DESIGN);
    const model = getAIClientByModelName(modelName);

    // Build smart prompt
    const systemPrompt = buildSmartBlockDesignPrompt(
      effectiveRules, // 使用有效的规则
      blockInfo || {
        blockId,
        title: 'Component Design',
        description: 'Design a component based on requirements',
        blockType: 'component',
        priority: 'medium',
        estimatedTokens: 1000,
        dependencies: [],
        components: [],
      },
      integratedContext
    );

    const messages = buildSmartBlockUserMessage(request.prompt);

    // Get AI response
    const stream = await streamText({
      system: systemPrompt,
      model: model as any,
      messages,
    });

    let response = '';
    for await (const part of stream.textStream) {
      response += part;
    }

    // Get private components for validation
    const privateComponents = getPrivateComponentDocs(effectiveRules); // 使用有效的规则

    // Parse smart response into ComponentDesign
    const componentDesign = parseSmartBlockResponse(
      response,
      blockId,
      privateComponents
    );

        return componentDesign;
  } catch (error) {
    throw error;
  }

/**
 * Parse smart block response into ComponentDesign
 */
function parseSmartBlockResponse(
  response: string,
  blockId: string,
  privateComponents?: Record<string, any>
): ComponentDesign {
  // Try to extract JSON from the response
  const jsonMatch = response.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      const result = JSON.parse(jsonMatch[0]);

      // Validate and enrich components with private component info
      const enrichedLibraries = (result.library || []).map((lib: any) => {
        const enrichedComponents = (lib.components || []).map((comp: any) => {
          // Check if component exists in private component library
          if (privateComponents && privateComponents[comp.name]) {
            const componentInfo = privateComponents[comp.name];
            return {
              name: comp.name,
              info: componentInfo,
              isPrivate: true,
            };
          }
          // If not in private library, return as external component
          return {
            name: comp.name,
            info: comp,
            isPrivate: false,
          };
        });

        return {
          name: lib.name || 'Component Library',
          components: enrichedComponents,
          description: lib.description || '',
        };
      });

      return {
        componentName: result.componentName || `${blockId}-component`,
        componentDescription:
          result.componentDescription || 'Component description',
        library: enrichedLibraries,
        props: result.props || [],
      };
    } catch (error) {
      // JSON parsing failed, continue to fallback
    }
  }

  // Fallback to default structure if JSON parsing fails
  return {
    componentName: `${blockId}-component`,
    componentDescription: 'Component description',
    library: [],
    props: [],
  };
}
