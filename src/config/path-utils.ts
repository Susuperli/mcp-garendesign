import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

/**
 * Unified path utilities for configuration file loading
 * Handles finding and loading codegens.json from various possible locations
 */

/**
 * Get possible paths for codegens.json file
 */
export function getCodegensPaths(): string[] {
  const currentFilePath = fileURLToPath(import.meta.url);
  const currentDir = dirname(currentFilePath);

  return [
    // Current working directory
    join(process.cwd(), 'data/codegens.json'),
    join(process.cwd(), '..', 'data', 'codegens.json'),
    // Relative to current file
    join(currentDir, '..', '..', '..', 'data', 'codegens.json'),
    join(currentDir, '..', '..', 'data', 'codegens.json'),
    // Absolute path fallback
    join(process.cwd(), 'mcp-garendesign', 'data', 'codegens.json'),
  ];
}

/**
 * Load codegens.json from the first available path
 */
export function loadCodegensFile(): any[] {
  const possiblePaths = getCodegensPaths();
  let loadedPath: string | null = null;

  for (const path of possiblePaths) {
    try {
      if (existsSync(path)) {
        const fileContent = readFileSync(path, 'utf-8');
        const codegens = JSON.parse(fileContent);
        loadedPath = path;
        console.log(`[PathUtils] Successfully loaded codegens from: ${path}`);
        return codegens;
      }
    } catch (err) {
      console.log(`[PathUtils] Codegens path not found: ${path}`);
      continue;
    }
  }

  throw new Error('Could not find codegens.json in any expected location');
}

/**
 * Find private components from codegens data
 */
export function findPrivateComponents(codegens: any[]): any {
  for (const codegen of codegens) {
    if (codegen.rules) {
      for (const rule of codegen.rules) {
        if (rule.type === 'private-components' && rule.docs) {
          return rule.docs;
        }
      }
    }
  }
  return null;
}
