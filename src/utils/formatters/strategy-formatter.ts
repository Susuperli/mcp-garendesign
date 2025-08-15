import { DesignStrategy } from '@/types/mcp-types.js';
import { SmartComponentAnalysis } from '@/core/design/index.js';

/**
 * Strategy formatter module
 * Handles formatting of design strategy results
 */

/**
 * Format smart design strategy result for display
 */
export function formatSmartDesignStrategyResult(
  strategy: DesignStrategy,
  smartAnalysis?: SmartComponentAnalysis
): string {
  const sections = [
    `## 🎯 智能设计策略分析结果`,
    ``,
    `**需求摘要:** ${strategy.requirementSummary}`,
    ``,
    `**复杂度等级:** \`${strategy.complexityLevel}\``,
    ``,
    `**设计策略:** ${strategy.designStrategy}`,
    ``,
  ];

  if (
    smartAnalysis &&
    smartAnalysis.businessDomains &&
    smartAnalysis.businessDomains.length > 0
  ) {
    sections.push(`**🏢 业务领域识别:**`);
    smartAnalysis.businessDomains.forEach((domain, index) => {
      sections.push(`${index + 1}. **${domain}**`);
    });
    sections.push(``);
  }

  if (
    smartAnalysis &&
    smartAnalysis.interactionPatterns &&
    smartAnalysis.interactionPatterns.length > 0
  ) {
    sections.push(`**🔄 交互模式分析:**`);
    smartAnalysis.interactionPatterns.forEach((pattern, index) => {
      sections.push(
        `${index + 1}. **${pattern.type}** - ${pattern.description}`
      );
      sections.push(`   - 涉及组件: \`${pattern.components.join('`, `')}\``);
      if (pattern.dataFlow) {
        sections.push(`   - 数据流: ${pattern.dataFlow}`);
      }
      sections.push(``);
    });
  }

  if (
    smartAnalysis &&
    smartAnalysis.existingComponentMatches &&
    smartAnalysis.existingComponentMatches.length > 0
  ) {
    sections.push(`**📚 现有组件匹配:**`);
    smartAnalysis.existingComponentMatches
      .filter((match) => match.matchScore > 0.5)
      .forEach((match, index) => {
        sections.push(
          `${index + 1}. **${match.componentName}** (匹配度: ${Math.round(match.matchScore * 100)}%)`
        );
        sections.push(`   - 能力: \`${match.capabilities.join('`, `')}\``);
        sections.push(`   - 可处理: \`${match.canHandle.join('`, `')}\``);
        if (match.limitations.length > 0) {
          sections.push(`   - 限制: \`${match.limitations.join('`, `')}\``);
        }
        sections.push(``);
      });
  }

  if (strategy.blocks?.length > 0) {
    sections.push(`**📦 智能组件划分:**`);

    strategy.blocks.forEach((block, index) => {
      sections.push(
        `${index + 1}. 🎯 **${block.title}** (\`${block.blockType}\`)`
      );
      sections.push(`   - 描述: ${block.description}`);
      sections.push(`   - 优先级: \`${block.priority}\``);
      sections.push(`   - 预估Token: \`${block.estimatedTokens}\``);

      const smartBlock = smartAnalysis?.recommendedBlocks.find(
        (b) => b.blockId === block.blockId
      );
      if (smartBlock) {
        sections.push(`   - 业务领域: \`${smartBlock.businessDomain}\``);
        sections.push(`   - 复用潜力: \`${smartBlock.reusePotential}\``);
        if (smartBlock.interactionPatterns.length > 0) {
          sections.push(
            `   - 交互模式: \`${smartBlock.interactionPatterns.join('`, `')}\``
          );
        }
      }

      if (block.dependencies && block.dependencies.length > 0) {
        sections.push(`   - 依赖: \`${block.dependencies.join('`, `')}\``);
      }
      sections.push(``);
    });
  }

  if (strategy.implementationSteps?.length > 0) {
    sections.push(`**🚀 实施步骤:**`);
    strategy.implementationSteps.forEach((step, index) => {
      sections.push(`${index + 1}. **${step.action}**`);
      sections.push(`   - 区块: \`${step.blockId}\``);
      sections.push(`   - 工具: \`${step.toolCall}\``);
      sections.push(``);
    });
  }

  return sections.join('\n');
}
