import { ComponentDesign } from '@/types/mcp-types.js';

/**
 * Component formatter module
 * Handles formatting of component design results
 */

/**
 * Format block design result for display
 */
export function formatBlockDesignResult(
  design: ComponentDesign,
  blockId: string
): string {
  const sections = [
    `## 🎯 区块设计结果: ${blockId}`,
    ``,
    `**组件名称:** ${design.componentName}`,
    ``,
    `**组件描述:** ${design.componentDescription}`,
    ``,
  ];

  // Component library information
  if (design.library && design.library.length > 0) {
    sections.push(`**📚 组件库推荐:**`);
    design.library.forEach((lib, index) => {
      sections.push(`${index + 1}. **${lib.name}**`);
      sections.push(`   - 组件: \`${lib.components.join('`, `')}\``);
      sections.push(`   - 描述: ${lib.description}`);
      sections.push(``);
    });
  }

  // Props information
  if (design.props && design.props.length > 0) {
    sections.push(`**🔧 Props 定义:**`);
    sections.push(`| 属性名 | 类型 | 必需 | 默认值 | 描述 |`);
    sections.push(`|--------|------|------|--------|------|`);

    design.props.forEach((prop) => {
      const required = prop.required ? '是' : '否';
      const defaultValue = prop.default || '-';
      const description = prop.description || '-';
      sections.push(
        `| ${prop.name} | ${prop.type} | ${required} | ${defaultValue} | ${description} |`
      );
    });
    sections.push(``);
  }

  return sections.join('\n');
}

/**
 * Format component query result for display
 */
export function formatComponentQueryResult(componentInfo: any): string {
  const sections = [
    `## 📚 组件文档: ${componentInfo.name || 'Unknown Component'}`,
    ``,
  ];

  // Purpose
  if (componentInfo.purpose) {
    sections.push(`**🎯 用途:** ${componentInfo.purpose}`);
    sections.push(``);
  }

  // Usage
  if (componentInfo.usage) {
    sections.push(`**💡 使用场景:**`);
    if (Array.isArray(componentInfo.usage)) {
      componentInfo.usage.forEach((usage: string, index: number) => {
        sections.push(`${index + 1}. ${usage}`);
      });
    } else {
      sections.push(componentInfo.usage);
    }
    sections.push(``);
  }

  // Examples
  if (componentInfo.example) {
    sections.push(`**📝 使用示例:**`);
    sections.push('```vue');
    sections.push(componentInfo.example);
    sections.push('```');
    sections.push(``);
  }

  // API documentation
  if (componentInfo.api) {
    sections.push(`**🔧 API 文档:**`);
    Object.entries(componentInfo.api).forEach(
      ([apiName, apiInfo]: [string, any]) => {
        sections.push(`### ${apiName}`);
        sections.push(`${apiInfo}`);
        sections.push(``);
      }
    );
  }

  // Types
  if (componentInfo.types) {
    sections.push(`**📋 类型定义:**`);
    Object.entries(componentInfo.types).forEach(
      ([typeName, typeInfo]: [string, any]) => {
        sections.push(`### ${typeName}`);
        sections.push(`${typeInfo}`);
        sections.push(``);
      }
    );
  }

  // Events
  if (componentInfo.events) {
    sections.push(`**🎯 事件:**`);
    Object.entries(componentInfo.events).forEach(
      ([eventName, eventInfo]: [string, any]) => {
        sections.push(`### ${eventName}`);
        sections.push(`${eventInfo}`);
        sections.push(``);
      }
    );
  }

  // Slots
  if (componentInfo.slots) {
    sections.push(`**🎭 插槽:**`);
    Object.entries(componentInfo.slots).forEach(
      ([slotName, slotInfo]: [string, any]) => {
        sections.push(`### ${slotName}`);
        sections.push(`${slotInfo}`);
        sections.push(``);
      }
    );
  }

  // Notes
  if (componentInfo.notes) {
    sections.push(`**📝 注意事项:**`);
    Object.entries(componentInfo.notes).forEach(
      ([noteName, noteInfo]: [string, any]) => {
        sections.push(`### ${noteName}`);
        sections.push(`${noteInfo}`);
        sections.push(``);
      }
    );
  }

  return sections.join('\n');
}
