/**
 * Design module unified entry
 * Provides design strategy, block design, and integration functionality
 */

// Design strategy
export {
  analyzeRequirementsSmartly,
  generateSmartDesignStrategy,
  type SmartComponentAnalysis,
  type InteractionPattern,
  type ComponentMatch,
  type SmartDesignBlock,
} from './strategy/index.js';

// Block design
export {
  processSmartBlockDesign,
  buildSmartBlockDesignPrompt,
  buildSmartBlockUserMessage,
  generateBlockStrategy,
} from './blocks/index.js';

// Design integration
export {
  integrateDesign,
  processComponentDesign,
  buildAnalysisPrompt,
  buildUserMessage,
  parseDesignAnalysisXml,
} from './integration/index.js';

// Complexity analysis
export {
  analyzeRequirementComplexity,
  analyzeRequirementComplexityWithAI,
  type ComplexityAnalysisResult,
} from './complexity-analyzer.js';

// Configuration loading
export {
  loadPrivateComponentCodegen,
  type ProjectConfig,
} from './config-loader.js';
