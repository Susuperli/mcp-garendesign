/**
 * Config utilities module
 * Provides configuration management utilities
 */

export {
  getAIClientByModelName,
  loadAIProvidersConfig,
} from './ai-client-adapter.js';

export {
  getPrivateComponentDocs,
  getPrivateDocsDescription,
} from './rule-processors.js';

export {
  getCodegensPaths,
  loadCodegensFile,
  findPrivateComponents,
} from './path-utils.js';

// Model management
export {
  getRecommendedModel,
  getAvailableModels,
  validateModel,
  getModelInfo,
  getProviderByModel,
} from './model-manager.js';

// Config validation
export {
  validateAIConfig,
  testAIConnection,
  getConfigSummary,
} from './config-validator.js';

// Types and enums
export {
  AIProvider,
  ModelPurpose,
  ModelFeature,
  type AIModelConfig,
  type AIProviderConfig,
  type AIProvidersConfig,
  type AvailableModel,
  type ConfigValidationResult,
  type ConnectionTestResult,
  type ConfigSummary,
} from './types.js';
