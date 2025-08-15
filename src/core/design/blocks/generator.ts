import { ComponentDesignRequest, DesignBlock } from '@/types/mcp-types.js';

/**
 * Block generation module
 * Handles generation of design blocks based on complexity analysis
 */

/**
 * Generate block strategy based on complexity level
 */
export function generateBlockStrategy(
  prompt: ComponentDesignRequest['prompt'],
  complexity: 'simple' | 'medium' | 'complex'
): DesignBlock[] {
  const textContent = prompt
    .filter((p) => p.type === 'text')
    .map((p) => p.text)
    .join(' ')
    .toLowerCase();

  const detectedAreas = detectUIAreas(textContent);

  if (complexity === 'simple') {
    return generateSimpleBlocks(detectedAreas);
  } else if (complexity === 'medium') {
    return generateMediumBlocks(detectedAreas);
  } else {
    return generateComplexBlocks(detectedAreas);
  }
}

/**
 * Detect UI areas from text content
 */
function detectUIAreas(textContent: string): string[] {
  const areas: string[] = [];

  if (/表格|列表|数据表格|table|list/.test(textContent))
    areas.push('Table area');
  if (/搜索|查询|筛选|search|filter/.test(textContent))
    areas.push('Search area');
  if (/详情|弹窗|抽屉|modal|drawer|详情页/.test(textContent))
    areas.push('Detail area');
  if (/头部|导航|header|nav/.test(textContent)) areas.push('Header area');
  if (/侧边栏|侧栏|sidebar/.test(textContent)) areas.push('Sidebar area');
  if (/底部|footer/.test(textContent)) areas.push('Footer area');
  if (/表单|form/.test(textContent)) areas.push('Form area');
  if (/卡片|card/.test(textContent)) areas.push('Card area');
  if (/标签页|tabs|tab/.test(textContent)) areas.push('Tab area');

  return areas;
}

/**
 * Generate blocks for simple complexity
 */
function generateSimpleBlocks(detectedAreas: string[]): DesignBlock[] {
  if (detectedAreas.length === 0) {
    return [
      {
        blockId: 'main-component',
        blockType: 'component',
        title: 'Main component',
        description: 'Design main component based on requirements',
        components: [],
        dependencies: [],
        estimatedTokens: 1500,
        priority: 'high',
      },
    ];
  }

  return [
    {
      blockId: 'main-component',
      blockType: 'component',
      title: detectedAreas[0],
      description: `Design ${detectedAreas[0]}`,
      components: [],
      dependencies: [],
      estimatedTokens: 1500,
      priority: 'high',
    },
  ];
}

/**
 * Generate blocks for medium complexity
 */
function generateMediumBlocks(detectedAreas: string[]): DesignBlock[] {
  const blocks: DesignBlock[] = [];

  // Layout areas (header, sidebar, footer)
  const layoutAreas = detectedAreas.filter(
    (area) =>
      area.includes('Header area') ||
      area.includes('Sidebar area') ||
      area.includes('Footer area')
  );

  if (layoutAreas.length > 0) {
    blocks.push({
      blockId: 'layout-structure',
      blockType: 'layout',
      title: 'Page layout structure',
      description: `Design page layout: ${layoutAreas.join('、')}`,
      components: [],
      dependencies: [],
      estimatedTokens: 1500,
      priority: 'high',
    });
  }

  // Main content areas
  const contentAreas = detectedAreas.filter(
    (area) =>
      !area.includes('Header area') &&
      !area.includes('Sidebar area') &&
      !area.includes('Footer area')
  );

  contentAreas.forEach((area, index) => {
    blocks.push({
      blockId: `content-area-${index + 1}`,
      blockType: 'component',
      title: area,
      description: `Design ${area}`,
      components: [],
      dependencies: layoutAreas.length > 0 ? ['layout-structure'] : [],
      estimatedTokens: 1200,
      priority: index === 0 ? 'high' : 'medium',
    });
  });

  // If there is no content area, create a default block
  if (contentAreas.length === 0) {
    blocks.push({
      blockId: 'main-content',
      blockType: 'component',
      title: 'Main content area',
      description: 'Design main content area',
      components: [],
      dependencies: layoutAreas.length > 0 ? ['layout-structure'] : [],
      estimatedTokens: 1500,
      priority: 'high',
    });
  }

  return blocks;
}

/**
 * Generate blocks for complex complexity
 */
function generateComplexBlocks(detectedAreas: string[]): DesignBlock[] {
  const blocks: DesignBlock[] = [];

  // Layout areas (header, sidebar, footer)
  const layoutAreas = detectedAreas.filter(
    (area) =>
      area.includes('Header area') ||
      area.includes('Sidebar area') ||
      area.includes('Footer area')
  );

  if (layoutAreas.length > 0) {
    blocks.push({
      blockId: 'layout-structure',
      blockType: 'layout',
      title: 'Page layout structure',
      description: `Design page layout: ${layoutAreas.join('、')}`,
      components: [],
      dependencies: [],
      estimatedTokens: 1500,
      priority: 'high',
    });
  }

  // Main content areas
  const contentAreas = detectedAreas.filter(
    (area) =>
      !area.includes('Header area') &&
      !area.includes('Sidebar area') &&
      !area.includes('Footer area')
  );

  contentAreas.forEach((area, index) => {
    blocks.push({
      blockId: `content-area-${index + 1}`,
      blockType: 'component',
      title: area,
      description: `Design ${area}`,
      components: [],
      dependencies: layoutAreas.length > 0 ? ['layout-structure'] : [],
      estimatedTokens: 1200,
      priority: index === 0 ? 'high' : 'medium',
    });
  });

  // If there is no content area, create a default block
  if (contentAreas.length === 0) {
    blocks.push({
      blockId: 'main-content',
      blockType: 'component',
      title: 'Main content area',
      description: 'Design main content area',
      components: [],
      dependencies: layoutAreas.length > 0 ? ['layout-structure'] : [],
      estimatedTokens: 1500,
      priority: 'high',
    });
  }

  return blocks;
}
