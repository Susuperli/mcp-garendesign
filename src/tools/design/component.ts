import {
  ComponentDesignRequest,
  DesignStrategy,
  Prompt,
} from '@/types/mcp-types.js';
import {
  generateSmartDesignStrategy,
  SmartComponentAnalysis,
} from '@/core/design/index.js';
import {
  formatSmartDesignStrategyResult,
  formatInteractionDiagram,
  formatDependencyGraph,
} from '@/utils/index.js';
import { getRecommendedModel } from '@/config/model-manager.js';
import { ModelPurpose } from '@/config/types.js';

// Constants
const DEFAULT_AI_MODEL = getRecommendedModel(ModelPurpose.DESIGN);
const MAIN_COMPONENT_BLOCK_ID = 'main-component';
const DESIGN_BLOCK_TOOL = 'design_block';

// Types
interface DesignComponentArgs {
  prompt: Prompt[];
  rules?: any[];
  component?: {
    id: string;
    name: string;
    code: string;
  };
}

interface NextAction {
  tool: string;
  arguments: {
    blockId: string;
    prompt: Prompt[];
    blockInfo?: any;
    integratedContext: {
      strategy: DesignStrategy;
      blockDesigns: any[];
    };
  };
  reason: string;
}

interface ToolResponse {
  content: Array<{
    type: 'text';
    text: string;
  }>;
}

/**
 * Component Design Tool Implementation
 * Uses smart business-logic-based design strategy for optimal component division
 */
export async function designComponentTool(args: any): Promise<ToolResponse> {
  try {
    const validatedArgs = validateAndNormalizeArgs(args);
    const request = buildDesignRequest(validatedArgs);

    // Use smart design strategy
    const designStrategy = await generateSmartDesignStrategy(request);

    const nextAction = generateNextAction(designStrategy, validatedArgs);
    const content = buildResponseContent(designStrategy, nextAction);

    return { content };
  } catch (error) {
    return buildErrorResponse(error);
  }
}

/**
 * Validate and normalize input arguments
 */
function validateAndNormalizeArgs(args: any): DesignComponentArgs {
  if (!args || !Array.isArray(args.prompt)) {
    throw new Error('Missing required parameter: prompt is required');
  }

  return {
    prompt: args.prompt,
    rules: Array.isArray(args.rules) ? args.rules : [],
    component: args.component,
  };
}

/**
 * Build design request object
 */
function buildDesignRequest(args: DesignComponentArgs): ComponentDesignRequest {
  return {
    prompt: args.prompt,
    rules: args.rules || [],
    aiModel: DEFAULT_AI_MODEL, // 使用内置的默认模型
    component: args.component,
  };
}

/**
 * Generate next action based on design strategy complexity
 */
function generateNextAction(
  designStrategy: DesignStrategy,
  args: DesignComponentArgs
): NextAction | null {
  const { complexityLevel, implementationSteps, blocks } = designStrategy;

  if (complexityLevel === 'simple') {
    return createSimpleComponentAction(designStrategy, args);
  }

  const firstStep = implementationSteps?.[0];
  if (firstStep) {
    return createComplexComponentAction(
      designStrategy,
      args,
      firstStep,
      blocks
    );
  }

  return null;
}

/**
 * Create action for simple component design
 */
function createSimpleComponentAction(
  designStrategy: DesignStrategy,
  args: DesignComponentArgs
): NextAction {
  return {
    tool: DESIGN_BLOCK_TOOL,
    arguments: {
      blockId: MAIN_COMPONENT_BLOCK_ID,
      prompt: args.prompt,
      blockInfo: {
        blockId: MAIN_COMPONENT_BLOCK_ID,
        blockType: 'component',
        title: 'Main Component Design',
        description: 'Design main component',
        priority: 'high',
      },
      integratedContext: {
        strategy: designStrategy,
        blockDesigns: [],
      },
    },
    reason: 'Simple component generates code directly',
  };
}

/**
 * Create action for complex component design
 */
function createComplexComponentAction(
  designStrategy: DesignStrategy,
  args: DesignComponentArgs,
  firstStep: any,
  blocks: any[]
): NextAction {
  const firstBlock = blocks.find(b => b.blockId === firstStep.blockId);

  return {
    tool: DESIGN_BLOCK_TOOL,
    arguments: {
      blockId: firstStep.blockId,
      prompt: args.prompt,
      blockInfo: firstBlock || undefined,
      integratedContext: {
        strategy: designStrategy,
        blockDesigns: [],
      },
    },
    reason:
      'Start designing the first component block, create sub-components step by step according to implementation steps',
  };
}

/**
 * Build response content with enhanced analysis
 */
function buildResponseContent(
  designStrategy: DesignStrategy & { smartAnalysis?: SmartComponentAnalysis },
  nextAction: NextAction | null
): Array<{ type: 'text'; text: string }> {
  const content: Array<{ type: 'text'; text: string }> = [];

  // Main strategy result
  content.push({
    type: 'text' as const,
    text: formatSmartDesignStrategyResult(
      designStrategy,
      designStrategy.smartAnalysis
    ),
  });

  // Add interaction diagram if available
  if (
    designStrategy.smartAnalysis?.interactionPatterns &&
    designStrategy.smartAnalysis.interactionPatterns.length > 0
  ) {
    content.push({
      type: 'text' as const,
      text: formatInteractionDiagram(
        designStrategy.smartAnalysis.interactionPatterns
      ),
    });
  }

  // Add dependency graph if available
  if (designStrategy.blocks?.length > 0) {
    content.push({
      type: 'text' as const,
      text: formatDependencyGraph(designStrategy.blocks),
    });
  }

  // Add next action if available
  if (nextAction) {
    content.push({
      type: 'text' as const,
      text: JSON.stringify({ nextAction }),
    });
  }

  return content;
}

/**
 * Build error response
 */
function buildErrorResponse(error: unknown): ToolResponse {
  const message =
    error instanceof Error ? error.message : 'Unknown error occurred';

  return {
    content: [
      {
        type: 'text',
        text: `❌ Design strategy analysis failed: ${message}`,
      },
    ],
  };
}
