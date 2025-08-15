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
1. Focus on the specific functionality of this block
2. Consider the block's business domain and interaction patterns
3. Leverage existing component capabilities when possible
4. Ensure consistency with the overall design strategy
5. Design for reusability and maintainability

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
  - **Components**: [Component names]
  - **Usage**: [How to use these components]

### Implementation Notes
- [Key implementation considerations]
- [Integration points]
- [Performance considerations]
`;

  const workflowSteps = `
## Design Workflow
1. Analyze the block's specific requirements and context
2. Identify the most suitable components from available libraries
3. Design the component interface and structure
4. Consider integration with other blocks and data flow
5. Ensure the design aligns with the overall strategy
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

    // Parse smart response into ComponentDesign
    const componentDesign = parseSmartBlockResponse(response, blockId);

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
  blockId: string
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
    components: string[];
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
          libraries.push({
            name: name.trim(),
            components: components.split(',').map((c) => c.trim()),
            description: `${description || ''} ${usage || ''}`.trim(),
          });
        }
      });
    }
  }

  // Extract implementation notes
  const notesMatch = response.match(
    /### Implementation Notes\s*\n([\s\S]*?)(?=###|$)/
  );
  const implementationNotes = notesMatch ? notesMatch[1].trim() : '';

  return {
    componentName,
    componentDescription,
    library: libraries,
  };
}
