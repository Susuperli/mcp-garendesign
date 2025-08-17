import { CodegenRule } from '@/types/mcp-types.js';

/**
 * Rule processing tool collection
 * Centralize all rule processing functions to avoid duplicate code
 */

/**
 * Get private component documents
 */
export function getPrivateComponentDocs(rules: CodegenRule[]) {
  const privateComponentsRule = rules.find(
    rule => rule.type === 'private-components'
  );
  const docs = privateComponentsRule?.docs;
  return docs;
}

/**
 * Get private document description
 */
export function getPrivateDocsDescription(rules: CodegenRule[]): string {
  const docs = getPrivateComponentDocs(rules);

  // Process private component library
  const templates: string[] = [];

  let componentDescriptions = '';
  for (const key in docs) {
    if (Object.prototype.hasOwnProperty.call(docs, key)) {
      const component = docs[key] as {
        purpose?: string;
        usage?: string | string[];
      };

      // Only build description for purpose and usage
      let description = '';

      if (component.purpose) {
        description += component.purpose;
      }

      if (component.usage) {
        if (description) description += ' ';
        description += Array.isArray(component.usage)
          ? component.usage.join(', ')
          : component.usage;
      }

      if (!description) {
        continue;
      }

      componentDescriptions += `
  ${key}: ${description}
  `;
    }
  }

  if (componentDescriptions.trim()) {
    const template = `
  - Component Library - The following components are available for use:
  ---------------------
  ${componentDescriptions.trim()}
  ---------------------
  `;
    templates.push(template.trim());
  }

  const result = templates.join('\n\n');
  return result;
}
