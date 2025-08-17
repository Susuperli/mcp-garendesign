import { CodegenRule } from '@/types/mcp-types.js';
import { loadCodegensFile } from '@/config/path-utils.js';

/**
 * Configuration loader module
 * Handles loading of project configuration files
 */

export interface ProjectConfig {
  rules: CodegenRule[];
  defaultModel: string;
}

/**
 * Load private component codegen configuration
 */
export function loadPrivateComponentCodegen(): ProjectConfig {
  try {
    // Use unified path utilities
    const codegens = loadCodegensFile();

    // Find the private component codegen
    const privateCodegen = codegens.find(
      codegen => codegen.title === 'Private Component Codegen'
    );

    if (!privateCodegen) {
      return {
        rules: [],
        defaultModel: 'claude-3-7-sonnet-latest',
      };
    }

    // Find private components rule
    const privateComponentsRule = privateCodegen.rules?.find(
      (r: { type: string }) => r.type === 'private-components'
    );

    if (!privateComponentsRule) {
      return {
        rules: [],
        defaultModel: 'claude-3-7-sonnet-latest',
      };
    }

    return {
      rules: privateCodegen.rules || [],
      defaultModel: 'claude-3-7-sonnet-latest',
    };
  } catch (error) {
    // Return empty configuration, let the system prompt handle the case of no component library
    return {
      rules: [],
      defaultModel: 'claude-3-7-sonnet-latest',
    };
  }
}
