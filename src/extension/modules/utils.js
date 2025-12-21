// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Logger utility for consistent logging with prefixes
 */
export const Logger = {
  /**
   * Log informational message
   * @param {string} msg - Message to log
   * @param {...any} args - Additional arguments
   */
  info: (msg, ...args) => {
    console.log(`[PrivacyWall] ${msg}`, ...args);
  },

  /**
   * Log warning message
   * @param {string} msg - Message to log
   * @param {...any} args - Additional arguments
   */
  warn: (msg, ...args) => {
    console.warn(`[PrivacyWall] ${msg}`, ...args);
  },

  /**
   * Log error message
   * @param {string} msg - Message to log
   * @param {...any} args - Additional arguments
   */
  error: (msg, ...args) => {
    console.error(`[PrivacyWall] ${msg}`, ...args);
  },
};

/**
 * Debounce function to limit how often a function can fire
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Cleanup manager for handling multiple cleanup tasks
 */
export class CleanupManager {
  constructor() {
    this.cleanupTasks = [];
  }

  /**
   * Register a cleanup task
   * @param {Function} task - Cleanup function to register
   */
  register(task) {
    this.cleanupTasks.push(task);
  }

  /**
   * Execute all registered cleanup tasks
   */
  execute() {
    this.cleanupTasks.forEach(task => {
      try {
        task();
      } catch (error) {
        Logger.error('Cleanup task failed:', error);
      }
    });
    this.cleanupTasks = [];
  }
}
