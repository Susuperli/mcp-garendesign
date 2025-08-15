/**
 * Integration module unified entry
 * Provides design integration and XML parsing functionality
 */

export {
  buildAnalysisPrompt,
  buildUserMessage,
  processComponentDesign,
  integrateDesign,
} from './processor.js';

export { parseDesignAnalysisXml } from './xml-parser.js';
