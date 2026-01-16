// ============================================================================
// SCANNING FUNCTIONS
// ============================================================================

import { PATTERNS, MESSAGE_TYPES } from './config.js';
import { Logger } from './utils.js';

/**
 * Maps regex pattern types to settings PII rule IDs
 */
const PATTERN_TO_RULE_MAP = {
  'email': 'EMAIL',
  'phone_number': 'PHONE',
  'credit_card': 'CREDIT_CARD',
  'ssn': 'SSN',
  'ip_address': 'IP_ADDRESS',
  'aws_key': 'API_KEY',
  'private_key': 'API_KEY',
  'api_key': 'API_KEY',
  'jwt': 'API_KEY',
  'mac_address': 'IP_ADDRESS',
  'address': 'ADDRESS',
  'zipcode': 'ADDRESS',
};

/**
 * Maps AI entity types to settings PII rule IDs
 */
const AI_ENTITY_TO_RULE_MAP = {
  'PERSON': 'PERSON',
  'LOCATION': 'ADDRESS',
  'ORGANIZATION': 'PERSON', // Treat orgs similar to names
};

/**
 * Scanner class for detecting sensitive data
 */
export class Scanner {
  constructor(engineStatus, settings = null) {
    this.engineStatus = engineStatus;
    this.settings = settings;
  }

  /**
   * Update settings
   * @param {Object} settings - New settings object
   */
  updateSettings(settings) {
    this.settings = settings;
  }

  /**
   * Check if a PII type is enabled for detection
   * @param {string} ruleId - The PII rule ID (e.g., 'EMAIL', 'PERSON')
   * @returns {boolean} Whether detection is enabled
   */
  isDetectionEnabled(ruleId) {
    if (!this.settings || !this.settings.piiRules) {
      return true; // Default to enabled if no settings
    }
    const rule = this.settings.piiRules[ruleId];
    return rule ? rule.detect : true;
  }

  /**
   * Check if a PII type should block (modal) or warn (banner)
   * @param {string} ruleId - The PII rule ID
   * @returns {boolean} Whether to block (true) or warn (false)
   */
  shouldBlock(ruleId) {
    if (!this.settings || !this.settings.piiRules) {
      return true; // Default to block if no settings
    }
    const rule = this.settings.piiRules[ruleId];
    return rule ? rule.block : true;
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
      // Map pattern type to settings rule ID
      const ruleId = PATTERN_TO_RULE_MAP[pattern.type] || pattern.type.toUpperCase();
      
      // Skip if detection is disabled for this type
      if (!this.isDetectionEnabled(ruleId)) {
        return;
      }
      
      if (pattern.regex.test(text)) {
        findings.push({ 
          type: pattern.type, 
          ruleId: ruleId,
          value: "REDACTED", 
          description: pattern.desc,
          shouldBlock: this.shouldBlock(ruleId),
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
    // Check if AI is enabled in settings
    if (this.settings && !this.settings.aiSettings.enabled) {
      Logger.info("scanWithAI - AI disabled in settings");
      return [];
    }
    
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
            // Filter and enrich AI findings based on settings
            const findings = (response.data || [])
              .map(finding => {
                const ruleId = AI_ENTITY_TO_RULE_MAP[finding.type] || finding.type;
                return {
                  ...finding,
                  ruleId: ruleId,
                  shouldBlock: this.shouldBlock(ruleId),
                };
              })
              .filter(finding => {
                // Filter by detection enabled
                if (!this.isDetectionEnabled(finding.ruleId)) {
                  return false;
                }
                // Filter by confidence threshold
                const threshold = this.settings?.aiSettings?.confidenceThreshold || 0.5;
                return (finding.score || finding.confidence || 1) >= threshold;
              });
            
            resolve(findings);
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
   * @returns {Promise<Object>} Scan results with local and AI findings
   */
  async scan(text) {
    const localFindings = this.scanLocally(text);
    
    // Check if any local finding should block
    const hasBlockingLocal = localFindings.some(f => f.shouldBlock);
    
    if (hasBlockingLocal) {
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

    // Check if any finding should block
    const hasBlockingAI = aiFindings.some(f => f.shouldBlock);
    const hasAnyBlocking = hasBlockingLocal || hasBlockingAI;

    return {
      blocked: hasAnyBlocking,
      localFindings,
      aiFindings
    };
  }
}
