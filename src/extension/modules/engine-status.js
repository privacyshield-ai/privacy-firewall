// ============================================================================
// MODEL STATUS MANAGEMENT
// ============================================================================

import { Logger } from './utils.js';
import { initializeModel } from '../lib/transformer-detector.js';

/**
 * Manages AI model loading status
 */
export class ModelStatus {
  constructor() {
    this.isReady = false;
    this.isLoading = false;
    this.listeners = [];
  }

  /**
   * Initialize and load the model
   */
  async initialize() {
    if (this.isReady || this.isLoading) return;
    
    this.isLoading = true;
    this.notifyListeners();
    
    try {
      await initializeModel((progress) => {
        Logger.info(`Model loading: ${Math.round(progress.progress || 0)}%`);
      });
      this.isReady = true;
      Logger.info('Model loaded: READY ✓');
    } catch (error) {
      Logger.error('Model loading failed:', error);
      this.isReady = false;
    } finally {
      this.isLoading = false;
      this.notifyListeners();
    }
  }

  /**
   * Subscribe to model status changes
   * @param {Function} callback - Callback function receiving status updates
   * @returns {Function} Unsubscribe function
   */
  subscribe(callback) {
    this.listeners.push(callback);
    
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  /**
   * Notify all listeners of status change
   */
  notifyListeners() {
    this.listeners.forEach(callback => {
      try {
        callback({ isReady: this.isReady, isLoading: this.isLoading });
      } catch (error) {
        Logger.error('Error in model status listener:', error);
      }
    });
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    this.listeners = [];
  }

  /**
   * Get status message for display
   * @returns {string} HTML status message
   */
  getStatusMessage() {
    if (this.isLoading) {
      return '<span style="color: #fbbc04;">● Loading AI Model...</span>';
    }
    if (this.isReady) {
      return '<span style="color: #34a853;">● AI Model Ready</span>';
    }
    return '<span style="color: #9aa0a6;">● AI Model Not Loaded (Regex Mode Only)</span>';
  }
}

// Keep backward compatibility alias
export { ModelStatus as EngineStatus };
