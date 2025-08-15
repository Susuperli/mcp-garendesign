/**
 * Blocks module unified entry
 * Provides block generation and design functionality
 */

export { generateBlockStrategy } from './generator.js';

export {
  buildSmartBlockDesignPrompt,
  buildSmartBlockUserMessage,
  processSmartBlockDesign,
} from './designer.js';
