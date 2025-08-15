import {
  loadCodegensFile,
  findPrivateComponents,
} from '@/config/path-utils.js';

/**
 * Component query core module
 * Responsible for querying detailed information about a component, including documentation, API, examples, etc.
 * This is the query verification stage in the component design process
 */

/**
 * Component query tool result interface
 */
export interface ComponentQueryResult {
  success: boolean;
  data?: {
    componentName: string;
    componentInfo: any;
  };
  error?: string;
  metadata: {
    processingTime: number;
    timestamp: string;
  };
}

/**
 * Query component information by component name
 */
export async function queryComponentByName(
  componentName: string
): Promise<any> {
  try {
    console.log('[QueryCore] Starting to load configuration file...');

    // Use unified path utilities
    const codegensData = loadCodegensFile();
    console.log('[QueryCore] Successfully loaded configuration file');

    // Find private components using unified utility
    const privateComponents = findPrivateComponents(codegensData);

    if (!privateComponents) {
      throw new Error('No private components found in codegens.json');
    }

    console.log(
      '[QueryCore] Found private component library, number of components:',
      Object.keys(privateComponents).length
    );

    const componentInfo = privateComponents[componentName];

    if (!componentInfo) {
      const availableComponents = Object.keys(privateComponents).join(', ');
      throw new Error(
        `Component '${componentName}' not found. Available components: ${availableComponents}`
      );
    }

    console.log('[QueryCore] Successfully found component:', componentName);

    // Filter out purpose and usage, return all other content
    const filteredComponentInfo = { ...componentInfo };
    delete filteredComponentInfo.purpose;
    delete filteredComponentInfo.usage;

    return filteredComponentInfo;
  } catch (error) {
    throw new Error(
      `Failed to query component '${componentName}': ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
