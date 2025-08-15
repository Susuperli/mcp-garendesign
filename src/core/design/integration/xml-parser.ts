import { DesignStrategy, DesignBlock } from '@/types/mcp-types.js';

/**
 * XML parser module
 * Handles parsing of design analysis XML responses
 */

/**
 * Parse design analysis XML
 */
export function parseDesignAnalysisXml(xml: string): DesignStrategy {
  // Simple XML parsing implementation
  const requirementSummary =
    xml.match(/<RequirementSummary>(.*?)<\/RequirementSummary>/)?.[1] ||
    'Requirement analysis';
  const complexityLevel =
    xml.match(/<ComplexityLevel>(.*?)<\/ComplexityLevel>/)?.[1] || 'medium';

  const designStrategy =
    xml.match(/<DesignStrategy>(.*?)<\/DesignStrategy>/)?.[1] ||
    'Block-based design strategy';

  // Parse block information
  const blocks: DesignBlock[] = [];
  const blockMatches = xml.match(/<Block>[\s\S]*?<\/Block>/g) || [];

  blockMatches.forEach((blockXml, index) => {
    const blockId =
      blockXml.match(/<BlockId>(.*?)<\/BlockId>/)?.[1] || `block-${index + 1}`;
    const blockType =
      blockXml.match(/<BlockType>(.*?)<\/BlockType>/)?.[1] || 'component';
    const title =
      blockXml.match(/<Title>(.*?)<\/Title>/)?.[1] || `Block ${index + 1}`;
    const description =
      blockXml.match(/<Description>(.*?)<\/Description>/)?.[1] ||
      'Design block description';
    const priority =
      blockXml.match(/<Priority>(.*?)<\/Priority>/)?.[1] || 'medium';
    const estimatedTokens = parseInt(
      blockXml.match(/<EstimatedTokens>(.*?)<\/EstimatedTokens>/)?.[1] || '1000'
    );
    const dependencies =
      blockXml.match(/<Dependencies>(.*?)<\/Dependencies>/)?.[1] || '';

    blocks.push({
      blockId,
      blockType: blockType as any,
      title,
      description,
      components: [],
      dependencies: dependencies
        ? dependencies.split(',').map((d) => d.trim())
        : [],
      estimatedTokens,
      priority: priority as any,
    });
  });

  // Parse implementation steps
  const implementationSteps: any[] = [];
  const stepMatches = xml.match(/<Step>[\s\S]*?<\/Step>/g) || [];

  stepMatches.forEach((stepXml, index) => {
    const stepNumber = parseInt(
      stepXml.match(/<StepNumber>(.*?)<\/StepNumber>/)?.[1] || String(index + 1)
    );
    const blockId =
      stepXml.match(/<BlockId>(.*?)<\/BlockId>/)?.[1] || `block-${index + 1}`;
    const action =
      stepXml.match(/<Action>(.*?)<\/Action>/)?.[1] || 'Execute design step';
    const toolCall =
      stepXml.match(/<ToolCall>(.*?)<\/ToolCall>/)?.[1] || 'design_block';

    implementationSteps.push({
      stepNumber,
      blockId,
      action,
      toolCall,
    });
  });

  return {
    requirementSummary,
    complexityLevel: complexityLevel as any,
    designStrategy,
    blocks,
    implementationSteps,
  };
}
