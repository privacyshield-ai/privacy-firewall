// ============================================================================
// DEFAULT SETTINGS - PrivacyWall
// ============================================================================
// These are the default settings applied on first install or reset.
// Designed to be aggressive (block everything) for maximum protection.

/**
 * PII Rule configuration
 * @typedef {Object} PiiRule
 * @property {boolean} detect - Whether to scan for this type
 * @property {boolean} block - Whether to show blocking modal (true) or warning banner (false)
 * @property {string} severity - "low" | "medium" | "high" | "critical"
 * @property {string} name - Display name
 * @property {string} icon - Emoji icon
 * @property {string} description - Description of what this detects
 * @property {string} detectionMethod - "regex" | "ai" | "both"
 */

/**
 * Default PII rules with aggressive protection
 */
export const DEFAULT_PII_RULES = {
  PERSON: {
    id: 'PERSON',
    name: 'Personal Names',
    icon: '👤',
    description: 'First names, last names, full names',
    detect: true,
    block: true,
    severity: 'high',
    detectionMethod: 'ai',
  },
  
  EMAIL: {
    id: 'EMAIL',
    name: 'Email Addresses',
    icon: '📧',
    description: 'Any email address format',
    detect: true,
    block: true,
    severity: 'high',
    detectionMethod: 'regex',
  },
  
  PHONE: {
    id: 'PHONE',
    name: 'Phone Numbers',
    icon: '📱',
    description: 'Phone numbers in various formats',
    detect: true,
    block: false,  // Warn only by default
    severity: 'medium',
    detectionMethod: 'regex',
  },
  
  ADDRESS: {
    id: 'ADDRESS',
    name: 'Physical Addresses',
    icon: '🏠',
    description: 'Street addresses, cities, zip codes',
    detect: true,
    block: true,
    severity: 'high',
    detectionMethod: 'ai',
  },
  
  CREDIT_CARD: {
    id: 'CREDIT_CARD',
    name: 'Credit Card Numbers',
    icon: '💳',
    description: 'Credit/debit card numbers',
    detect: true,
    block: true,
    severity: 'critical',
    detectionMethod: 'regex',
  },
  
  SSN: {
    id: 'SSN',
    name: 'Social Security Numbers',
    icon: '🔢',
    description: 'US Social Security Numbers',
    detect: true,
    block: true,
    severity: 'critical',
    detectionMethod: 'regex',
  },
  
  MEDICAL_ID: {
    id: 'MEDICAL_ID',
    name: 'Medical IDs',
    icon: '🏥',
    description: 'Health insurance, patient IDs',
    detect: true,
    block: true,
    severity: 'critical',
    detectionMethod: 'regex',
  },
  
  API_KEY: {
    id: 'API_KEY',
    name: 'API Keys & Secrets',
    icon: '🔑',
    description: 'API keys, tokens, secrets',
    detect: true,
    block: true,
    severity: 'critical',
    detectionMethod: 'regex',
  },
  
  IP_ADDRESS: {
    id: 'IP_ADDRESS',
    name: 'IP Addresses',
    icon: '🌐',
    description: 'IPv4 and IPv6 addresses',
    detect: true,
    block: false,  // Warn only by default
    severity: 'medium',
    detectionMethod: 'regex',
  },
};

/**
 * Default protected sites
 */
export const DEFAULT_PROTECTED_SITES = {
  'chat.openai.com': { enabled: true, name: 'ChatGPT' },
  'chatgpt.com': { enabled: true, name: 'ChatGPT' },
  'claude.ai': { enabled: true, name: 'Claude' },
  'gemini.google.com': { enabled: true, name: 'Gemini' },
  'copilot.microsoft.com': { enabled: true, name: 'Copilot' },
  'poe.com': { enabled: true, name: 'Poe' },
  'grok.com': { enabled: true, name: 'Grok' },
  'chat.deepseek.com': { enabled: true, name: 'DeepSeek' },
};

/**
 * Default AI settings
 */
export const DEFAULT_AI_SETTINGS = {
  confidenceThreshold: 0.3,  // 0.0 to 1.0 (lower = more sensitive)
  enabled: true,
};

/**
 * Default behavior settings
 */
export const DEFAULT_BEHAVIOR = {
  showPastedText: true,      // Show what was pasted in modal
  strictMode: false,         // Auto-block without asking
  scanWhileTyping: true,     // Real-time typing detection
};

/**
 * Complete default settings object
 */
export const DEFAULT_SETTINGS = {
  version: '1.0',
  
  piiRules: DEFAULT_PII_RULES,
  
  protectedSites: DEFAULT_PROTECTED_SITES,
  protectAllSites: false,
  
  aiSettings: DEFAULT_AI_SETTINGS,
  
  behavior: DEFAULT_BEHAVIOR,
  
  meta: {
    setupComplete: false,
    installedAt: null,
    lastUpdated: null,
  },
};

/**
 * Storage key for settings
 */
export const STORAGE_KEY = 'privacywall_settings';
