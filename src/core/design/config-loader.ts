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
    console.log('[Config] Starting to load configuration file...');

    // Use unified path utilities
    const codegens = loadCodegensFile();
    console.log(`[Config] Codegens array length:`, codegens?.length);

    console.log('[Config] Successfully loaded configuration file');
    console.log(
      '[Config] Available codegens:',
      codegens.map((c: any) => c.title)
    );

    // Find the private component codegen
    const privateCodegen = codegens.find(
      (codegen: any) => codegen.title === 'Private Component Codegen'
    );

    if (!privateCodegen) {
      console.warn(
        '[Config] Private Component Codegen not found, using empty configuration'
      );
      return {
        rules: [],
        defaultModel: 'claude-3-7-sonnet-latest',
      };
    }

    console.log(
      '[Config] Found Private Component Codegen with rules:',
      privateCodegen.rules?.map((r: any) => r.type)
    );

    // Find private components rule
    const privateComponentsRule = privateCodegen.rules?.find(
      (r: any) => r.type === 'private-components'
    );

    if (!privateComponentsRule) {
      console.warn('[Config] Private components rule not found in codegen');
    }

    return {
      rules: privateCodegen.rules || [],
      defaultModel: 'claude-3-7-sonnet-latest',
    };
  } catch (error) {
    console.error('[Config] Failed to load configuration:', error);
    // Return empty configuration, let the system prompt handle the case of no component library
    return {
      rules: [],
      defaultModel: 'claude-3-7-sonnet-latest',
    };
  }
}
