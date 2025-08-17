import {
  ComponentDesignRequest,
  DesignToolResult,
  ComponentDesign,
} from '@/types/mcp-types.js';
import {
  processSmartBlockDesign,
  integrateDesign,
} from '@/core/design/index.js';
import { formatBlockDesignResult } from '@/utils/index.js';
import { getRecommendedModel } from '@/config/model-manager.js';
import { ModelPurpose } from '@/config/types.js';

/**
 * Smart block design tool implementation
 * Handles detailed design for a specific design block using smart strategy
 * This is the second-stage tool in the smart design strategy
 */
export async function designBlockTool(args: any): Promise<{ content: any[] }> {
  const startTime = Date.now();

  try {
    // Validate input parameters
    if (!args || typeof args.blockId !== 'string' || !args.blockId.trim()) {
      throw new Error('Missing required parameter: blockId is required');
    }
    if (!Array.isArray(args.prompt)) {
      throw new Error('Missing required parameter: prompt is required');
    }

    // Build request object
    const request: ComponentDesignRequest = {
      prompt: args.prompt,
      rules: Array.isArray(args.rules) ? args.rules : [],
      aiModel: getRecommendedModel(ModelPurpose.DESIGN), // 使用内置的推荐模型
      component: args.component,
    };

    // Process smart block design
    const blockDesign: ComponentDesign = await processSmartBlockDesign(
      request,
      args.blockId,
      args.blockInfo,
      args.integratedContext
    );

    // 构建完整的返回结果
    const result: DesignToolResult = {
      success: true,
      data: blockDesign,
      metadata: {
        processingTime: Date.now() - startTime,
        model: request.aiModel,
        timestamp: new Date().toISOString(),
        blockId: args.blockId,
      },
    };

    // 如果有集成上下文，尝试集成设计
    let integrated = null;
    if (
      args.integratedContext?.strategy &&
      args.integratedContext?.blockDesigns
    ) {
      try {
        integrated = integrateDesign(args.integratedContext.strategy, [
          ...args.integratedContext.blockDesigns,
          blockDesign,
        ]);
      } catch (e) {
        console.warn('[BlockTool] integrateDesign error:', e);
      }
    }

    return {
      content: [
        {
          type: 'text',
          text: formatBlockDesignResult(blockDesign, args.blockId),
        },
        {
          type: 'text',
          text: JSON.stringify({
            result,
            integrated,
            nextAction: integrated
              ? {
                  tool: 'integrate_design',
                  arguments: {
                    strategy: args.integratedContext?.strategy,
                    blockDesigns: [
                      ...(args.integratedContext?.blockDesigns || []),
                      blockDesign,
                    ],
                  },
                  reason: 'Block design completed, ready for integration',
                }
              : null,
          }),
        },
      ],
    };
  } catch (error) {
    console.error('Design block tool error:', error);

    const message =
      error instanceof Error ? error.message : 'Unknown error occurred';
    return {
      content: [
        {
          type: 'text',
          text: `❌ Block design failed: ${message}`,
        },
      ],
    };
  }
}
