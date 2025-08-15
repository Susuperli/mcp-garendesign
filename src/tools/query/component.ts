import { formatComponentQueryResult } from '@/utils/index.js';
import { queryComponentByName } from '@/core/index.js';

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
 * Component query tool implementation
 * Query detailed information of a component by name, including docs, API, examples, etc.
 * Returns all content except purpose and usage.
 */
export async function queryComponentTool(
  args: any
): Promise<{ content: any[] }> {
  const startTime = Date.now();

  try {
    // Validate input parameters
    if (
      !args ||
      typeof args.componentName !== 'string' ||
      !args.componentName.trim()
    ) {
      throw new Error('Missing required parameter: componentName is required');
    }

    const componentName = args.componentName as string;
    // Query component info
    const componentInfo = await queryComponentByName(componentName);

    // Minimal output for IDE
    return {
      content: [
        {
          type: 'text',
          text: formatComponentQueryResult(componentInfo),
        },
        {
          type: 'text',
          text: JSON.stringify({ componentName, componentInfo }),
        },
      ],
    };
  } catch (error) {
    console.error('Query component tool error:', error);

    const message =
      error instanceof Error ? error.message : 'Unknown error occurred';
    return {
      content: [
        {
          type: 'text',
          text: `❌ Component query failed: ${message}`,
        },
      ],
    };
  }
}
