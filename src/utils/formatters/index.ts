/**
 * Formatters module unified entry
 * Provides formatting utilities for various data structures
 */

// Strategy formatters
export { formatSmartDesignStrategyResult } from './strategy-formatter.js';

// Component formatters
export {
  formatBlockDesignResult,
  formatComponentQueryResult,
} from './component-formatter.js';

// Diagram formatters
export {
  formatInteractionDiagram,
  formatDependencyGraph,
} from './diagram-formatter.js';
