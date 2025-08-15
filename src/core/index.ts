/**
 * Core module unified entry
 * Organized by component design workflow:
 * 1. Design module - strategy, block design, and integration
 * 2. Query module - component library query and verification
 */

// Design module - unified design functionality
export {
  // Strategy
  analyzeRequirementsSmartly,
  generateSmartDesignStrategy,
  type SmartComponentAnalysis,
  type InteractionPattern,
  type ComponentMatch,
  type SmartDesignBlock,
  // Block design
  processSmartBlockDesign,
  buildSmartBlockDesignPrompt,
  buildSmartBlockUserMessage,
  // Integration
  integrateDesign,
} from '@/core/design/index.js';

// Query module - iterative query
export { queryComponentByName } from '@/core/query/component-query.js';
