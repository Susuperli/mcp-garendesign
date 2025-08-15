/**
 * Diagram formatter module
 * Handles formatting of interaction diagrams and dependency graphs
 */

/**
 * Format interaction diagram
 */
export function formatInteractionDiagram(interactionPatterns: any[]): string {
  if (!interactionPatterns?.length) {
    return '';
  }

  const sections = [
    `## 🔄 交互模式图`,
    ``,
    `### 交互关系图`,
    `\`\`\`mermaid`,
    `graph TD`,
  ];

  interactionPatterns.forEach((pattern, index) => {
    const patternId = `pattern_${index}`;
    sections.push(`    ${patternId}[${pattern.type}]`);

    if (pattern.components && pattern.components.length > 0) {
      pattern.components.forEach((comp: string, compIndex: number) => {
        const compId = `${patternId}_comp_${compIndex}`;
        sections.push(`    ${compId}[${comp}]`);
        sections.push(`    ${patternId} --> ${compId}`);
      });
    }
  });

  sections.push(`\`\`\``);
  sections.push(``);

  // Add pattern descriptions
  sections.push(`### 交互模式说明`);
  interactionPatterns.forEach((pattern, index) => {
    sections.push(`${index + 1}. **${pattern.type}**`);
    sections.push(`   - 描述: ${pattern.description}`);
    sections.push(`   - 涉及组件: ${pattern.components.join(', ')}`);
    if (pattern.dataFlow) {
      sections.push(`   - 数据流: ${pattern.dataFlow}`);
    }
    sections.push(``);
  });

  return sections.join('\n');
}

/**
 * Format dependency graph
 */
export function formatDependencyGraph(blocks: any[]): string {
  if (!blocks?.length) {
    return '';
  }

  const sections = [`## 📊 依赖关系图`, ``];

  const dependencyMatrix = blocks.map((block) => ({
    name: block.title,
    dependencies: block.dependencies || [],
  }));

  sections.push(`### 依赖关系矩阵`);
  sections.push(`| 组件 | 依赖组件 |`);
  sections.push(`|------|----------|`);

  dependencyMatrix.forEach((block) => {
    if (block.dependencies.length > 0) {
      sections.push(`| ${block.name} | ${block.dependencies.join(', ')} |`);
    } else {
      sections.push(`| ${block.name} | 无依赖 |`);
    }
  });

  sections.push(``);

  sections.push(`### 依赖树结构`);
  const rootBlocks = dependencyMatrix.filter(
    (block) => block.dependencies.length === 0
  );

  if (rootBlocks.length > 0) {
    sections.push(`**根组件 (无依赖):**`);
    rootBlocks.forEach((block) => {
      sections.push(`- ${block.name}`);
    });
    sections.push(``);
  }

  const dependentBlocks = dependencyMatrix.filter(
    (block) => block.dependencies.length > 0
  );
  if (dependentBlocks.length > 0) {
    sections.push(`**依赖组件:**`);
    dependentBlocks.forEach((block) => {
      sections.push(`- ${block.name} ← ${block.dependencies.join(', ')}`);
    });
  }

  return sections.join('\n');
}
