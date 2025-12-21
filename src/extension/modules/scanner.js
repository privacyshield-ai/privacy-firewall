// ============================================================================
// SCANNING FUNCTIONS
// ============================================================================

import { PATTERNS, MESSAGE_TYPES } from './config.js';
import { Logger } from './utils.js';

/**
 * Scanner class for detecting sensitive data
 */
export class Scanner {
  constructor(engineStatus) {
    this.engineStatus = engineStatus;
  }

  /**
   * Scans text locally using regex patterns (instant, no network)
   * @param {string} text - Text to scan
   * @returns {Array} Array of findings
   */
  scanLocally(text) {
    if (!text || typeof text !== 'string') {
      return [];
    }
    
    const findings = [];
    PATTERNS.forEach((pattern) => {
      if (pattern.regex.test(text)) {
        findings.push({ 
          type: pattern.type, 
          value: "REDACTED", 
          description: pattern.desc 
        });
      }
    });
    
    return findings;
  }

  /**
   * Scans text using AI engine via background script
   * @param {string} text - Text to scan
   * @returns {Promise<Array>} Promise resolving to array of findings
   */
  async scanWithAI(text) {
    Logger.info("scanWithAI called, engineStatus:", this.engineStatus, "text:", text);
    
    if (!this.engineStatus.isReachable || !text) {
      Logger.info("scanWithAI - skipping. isReachable:", this.engineStatus.isReachable, "text:", !!text);
      return [];
    }
    
    Logger.info("scanWithAI - sending SCAN_TEXT message to background...");
    
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(
        { type: MESSAGE_TYPES.SCAN_TEXT, text: text },
        (response) => {
          Logger.info("scanWithAI - got response:", response);
          
          if (chrome.runtime.lastError) {
            Logger.warn("AI scan failed:", chrome.runtime.lastError.message);
            resolve([]);
            return;
          }
          
          if (response && response.success) {
            resolve(response.data || []);
          } else {
            Logger.warn("AI scan error:", response?.error);
            resolve([]);
          }
        }
      );
    });
  }

  /**
   * Performs a comprehensive scan (local + AI if available)
   * @param {string} text - Text to scan
   * @param {boolean} blockOnLocal - Whether to block on local findings
   * @returns {Promise<Object>} Scan results with local and AI findings
   */
  async scan(text, blockOnLocal = true) {
    const localFindings = this.scanLocally(text);
    
    if (blockOnLocal && localFindings.length > 0) {
      return {
        blocked: true,
        localFindings,
        aiFindings: []
      };
    }

    let aiFindings = [];
    if (this.engineStatus.isReachable) {
      try {
        aiFindings = await this.scanWithAI(text);
      } catch (error) {
        Logger.error('AI scan error:', error);
      }
    }

    return {
      blocked: localFindings.length > 0 || aiFindings.length > 0,
      localFindings,
      aiFindings
    };
  }
}
