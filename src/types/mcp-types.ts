/**
 * Type definitions for MCP service
 */

// Basic types
export interface Prompt {
  type: 'text' | 'image';
  text?: string;
  image?: string;
}

export interface CodegenRule {
  type: string;
  description: string;
  prompt?: string;
  dataSet?: string[];
  docs?: Record<string, any>;
}

// Component design related types
export interface ComponentDesignRequest {
  prompt: Prompt[];
  rules: CodegenRule[];
  aiModel: string;
  component?: {
    id: string;
    name: string;
    code: string;
  };
}

export interface ComponentDesign {
  componentName: string;
  componentDescription: string;
  library: Array<{
    name: string;
    components: Array<{
      name: string;
      info: any;
      isPrivate: boolean;
    }>;
    description: string;
  }>;
  // Optional: props list returned when designing blocks
  props?: Array<{
    name: string;
    type: string;
    required?: boolean;
    default?: string;
    description?: string;
  }>;
}

export interface DesignToolResult {
  success: boolean;
  data?: ComponentDesign;
  error?: string;
  metadata?: {
    processingTime: number;
    model: string;
    timestamp: string;
    componentSelectionStrategy?: string;
    blockId?: string;
  };
}

// Block-based design related types
export interface DesignBlock {
  blockId: string;
  blockType: 'layout' | 'component' | 'logic';
  title: string;
  description: string;
  components: string[];
  dependencies: string[];
  estimatedTokens: number;
  priority: 'high' | 'medium' | 'low';
}

export interface DesignStrategy {
  requirementSummary: string;
  complexityLevel: 'simple' | 'medium' | 'complex';
  designStrategy: string;
  blocks: DesignBlock[];
  implementationSteps: Array<{
    stepNumber: number;
    blockId: string;
    action: string;
    toolCall: string;
  }>;
}

export interface RequirementAnalysis {
  functionalRequirements: string[];
  nonFunctionalRequirements: string[];
  complexity: 'simple' | 'medium' | 'complex';
  estimatedBlocks: number;
  reasoning: string;
}

// Integrated design (composition design) types
export interface IntegratedDesign {
  strategy: DesignStrategy;
  // Each block's design result, associated by blockId
  blockDesigns: Array<{
    blockId: string;
    component: ComponentDesign;
  }>;
  // Aggregated information
  aggregated: {
    // Props summary of all blocks (categorized by blockId)
    propsByBlock: Record<
      string,
      Array<{
        name: string;
        type: string;
        required?: boolean;
        default?: string;
        description?: string;
      }>
    >;
    // Set of used private component names (deduplicated from library.components)
    privateComponentsUsed: string[];
  };
  // Composition suggestions and layout assembly (text description for IDE)
  compositionPlan: string;
}
