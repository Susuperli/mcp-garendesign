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
  const privateComponents = getPrivateComponentDocs(rules);

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
${componentsDescription || 'No specific component library available, but you can use any appropriate components from your knowledge.'}

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
Respond with a structured component design in the following format:

### Component Name
[Component name]

### Component Description
[Detailed description of the component's purpose and functionality]

### Props Interface
\`\`\`typescript
interface ComponentProps {
  // Define props here
}
\`\`\`

### Component Library Recommendations
- **Library Name**: [Library name]
  - **Components**: [Component names from private library, separated by commas]
  - **Usage**: [Detailed explanation of how these components work together to achieve the required functionality]

**Important**: 
- Only recommend components that are actually available in the private component library
- Explain how the selected components work together to fulfill the block's requirements
- If multiple components are needed, explain their roles and interactions
- Consider the component's API and usage patterns when making recommendations

### Implementation Notes
- [Key implementation considerations]
- [Integration points]
- [Performance considerations]
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
      content: prompt.map((p) => p.text).join('\n'),
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
    const modelName = aiModel || getRecommendedModel(ModelPurpose.DESIGN);
    const model = getAIClientByModelName(modelName);

    // Build smart prompt
    const systemPrompt = buildSmartBlockDesignPrompt(
      rules,
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
    const privateComponents = getPrivateComponentDocs(rules);

    // Parse smart response into ComponentDesign
    const componentDesign = parseSmartBlockResponse(
      response,
      blockId,
      privateComponents
    );

    return componentDesign;
  } catch (error) {
    console.error('Smart block design error:', error);
    throw error;
  }
}

/**
 * Parse smart block response into ComponentDesign
 */
function parseSmartBlockResponse(
  response: string,
  blockId: string,
  privateComponents?: Record<string, any>
): ComponentDesign {
  // Extract component name
  const nameMatch = response.match(/### Component Name\s*\n([^\n]+)/);
  const componentName = nameMatch
    ? nameMatch[1].trim()
    : `${blockId}-component`;

  // Extract component description
  const descMatch = response.match(
    /### Component Description\s*\n([\s\S]*?)(?=###|$)/
  );
  const componentDescription = descMatch
    ? descMatch[1].trim()
    : 'Component description';

  // Extract props interface
  const propsMatch = response.match(/```typescript\s*\n([\s\S]*?)\s*\n```/);
  const propsInterface = propsMatch ? propsMatch[1].trim() : '';

  // Extract library recommendations
  const libraryMatch = response.match(
    /### Component Library Recommendations\s*\n([\s\S]*?)(?=###|$)/
  );
  const librarySection = libraryMatch ? libraryMatch[1].trim() : '';

  // Parse libraries
  const libraries: Array<{
    name: string;
    components: Array<{
      name: string;
      info: any;
      isPrivate: boolean;
    }>;
    description: string;
  }> = [];
  if (librarySection) {
    const libMatches = librarySection.match(
      /\*\*([^*]+)\*\*: ([^\n]+)\s*\n\s*\*\*Components\*\*: ([^\n]+)\s*\n\s*\*\*Usage\*\*: ([^\n]+)/g
    );
    if (libMatches) {
      libMatches.forEach((match) => {
        const [, name, description, components, usage] =
          match.match(
            /\*\*([^*]+)\*\*: ([^\n]+)\s*\n\s*\*\*Components\*\*: ([^\n]+)\s*\n\s*\*\*Usage\*\*: ([^\n]+)/
          ) || [];
        if (name && components) {
          const componentNames = components.split(',').map((c) => c.trim());

          // 获取私有组件的详细信息
          const enrichedComponents = componentNames
            .map((compName) => {
              // 检查私有组件库中是否存在该组件
              if (privateComponents && privateComponents[compName]) {
                // 获取组件的详细信息
                const componentInfo = privateComponents[compName];
                return {
                  name: compName,
                  info: componentInfo,
                  isPrivate: true,
                };
              }
              // 如果不在私有组件库中，直接跳过
              return null;
            })
            .filter((comp) => comp !== null); // 过滤掉 null 值

          libraries.push({
            name: name.trim(),
            components: enrichedComponents,
            description: `${description || ''} ${usage || ''}`.trim(),
          });
        }
      });
    }
  }

  return {
    componentName,
    componentDescription,
    library: libraries,
  };
}
