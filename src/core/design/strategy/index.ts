/**
 * Strategy module unified entry
 * Provides smart design strategy analysis and generation functionality
 */

export {
  analyzeRequirementsSmartly,
  type SmartComponentAnalysis,
  type InteractionPattern,
  type ComponentMatch,
  type SmartDesignBlock,
} from './analyzer.js';

export { generateSmartDesignStrategy } from './generator.js';
