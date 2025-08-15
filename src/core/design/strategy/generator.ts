import {
  ComponentDesignRequest,
  DesignBlock,
  DesignStrategy,
} from '@/types/mcp-types.js';
import {
  analyzeRequirementsSmartly,
  SmartComponentAnalysis,
} from './analyzer.js';

/**
 * Generate smart design strategy
 */
export async function generateSmartDesignStrategy(
  request: ComponentDesignRequest
): Promise<DesignStrategy & { smartAnalysis: SmartComponentAnalysis }> {
  const analysis = await analyzeRequirementsSmartly(request);

  const blocks: DesignBlock[] = analysis.recommendedBlocks.map((block) => ({
    blockId: block.blockId,
    blockType: 'component',
    title: block.title,
    description: block.description,
    components: block.components,
    dependencies: block.dependencies,
    estimatedTokens: block.estimatedTokens,
    priority: block.priority,
  }));

  const implementationSteps = generateImplementationSteps(analysis);

  return {
    requirementSummary: `智能分析：包含 ${analysis.businessDomains.join('、')} 等业务领域`,
    complexityLevel: analysis.complexity,
    designStrategy: analysis.reasoning,
    blocks,
    implementationSteps,
    smartAnalysis: analysis,
  };
}

/**
 * Generate implementation steps based on smart analysis
 */
function generateImplementationSteps(analysis: SmartComponentAnalysis) {
  const steps = [];
  let stepNumber = 1;

  const sortedBlocks = [...analysis.recommendedBlocks].sort((a, b) => {
    if (a.priority === 'high' && b.priority !== 'high') return -1;
    if (a.priority !== 'high' && b.priority === 'high') return 1;
    return a.dependencies.length - b.dependencies.length;
  });

  for (const block of sortedBlocks) {
    steps.push({
      stepNumber: stepNumber++,
      blockId: block.blockId,
      action: `设计${block.title}`,
      toolCall: 'design_block',
    });
  }

  return steps;
}
