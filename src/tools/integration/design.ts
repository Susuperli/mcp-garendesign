import { integrateDesign } from '@/core/design/index.js';
import type {
  IntegratedDesign,
  DesignStrategy,
  ComponentDesign,
} from '@/types/mcp-types.js';

/**
 * Standalone integration tool:
 * Input the overall DesignStrategy and the completed blockDesigns ([{ blockId, component }...]),
 * and return the aggregated IntegratedDesign (including props summary, used private component names, and composition recommendations).
 */
export async function integrateDesignTool(
  args: any
): Promise<{ content: any[] }> {
  const startTime = Date.now();
  try {
    if (!args || !args.strategy || !Array.isArray(args.blockDesigns)) {
      throw new Error(
        'Missing required parameters: strategy and blockDesigns are required'
      );
    }

    const strategy: DesignStrategy = args.strategy as DesignStrategy;
    const blockDesigns: Array<{ blockId: string; component: ComponentDesign }> =
      args.blockDesigns as Array<{
        blockId: string;
        component: ComponentDesign;
      }>;

    const integrated: IntegratedDesign = integrateDesign(
      strategy,
      blockDesigns
    );

    // Human-readable summary
    const summaryLines: string[] = [];
    summaryLines.push('## 🔗 Design Integration Summary');
    summaryLines.push('');
    summaryLines.push(`- Number of blocks: ${integrated.blockDesigns.length}`);
    summaryLines.push(
      `- Private components used: ${integrated.aggregated.privateComponentsUsed.join(', ') || 'None'}`
    );
    summaryLines.push('');
    summaryLines.push('### 📦 Props overview per block');
    for (const b of strategy.blocks) {
      const props = integrated.aggregated.propsByBlock[b.blockId] || [];
      summaryLines.push(`- ${b.blockId} (${b.title}): ${props.length} props`);
    }
    summaryLines.push('');
    summaryLines.push('### 🧩 Composition recommendations');
    summaryLines.push(integrated.compositionPlan || 'None');

    return {
      content: [
        { type: 'text', text: summaryLines.join('\n') },
        {
          type: 'text',
          text: JSON.stringify({ integratedDesign: integrated }),
        },
      ],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [
        { type: 'text', text: `❌ Integration design failed: ${message}` },
      ],
    };
  }
}
