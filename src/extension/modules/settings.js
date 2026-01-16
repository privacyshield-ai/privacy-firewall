// ============================================================================
// SETTINGS STORAGE HELPER - PrivacyWall
// ============================================================================
// Handles loading, saving, and managing settings in chrome.storage.sync

import { DEFAULT_SETTINGS, STORAGE_KEY } from './settings-defaults.js';

/**
 * Deep merge two objects
 * @param {Object} target - Target object
 * @param {Object} source - Source object to merge
 * @returns {Object} Merged object
 */
function deepMerge(target, source) {
  const result = { ...target };
  
  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(target[key] || {}, source[key]);
    } else {
      result[key] = source[key];
    }
  }
  
  return result;
}

/**
 * Load settings from chrome.storage.sync
 * Returns merged settings with defaults (ensures new fields are added)
 * @returns {Promise<Object>} Settings object
 */
export async function loadSettings() {
  return new Promise((resolve) => {
    chrome.storage.sync.get([STORAGE_KEY], (result) => {
      if (chrome.runtime.lastError) {
        console.warn('[PrivacyWall] Error loading settings:', chrome.runtime.lastError);
        resolve({ ...DEFAULT_SETTINGS });
        return;
      }
      
      const stored = result[STORAGE_KEY];
      if (!stored) {
        // No settings yet, return defaults
        resolve({ ...DEFAULT_SETTINGS });
        return;
      }
      
      // Merge stored settings with defaults (adds any new fields from updates)
      const merged = deepMerge(DEFAULT_SETTINGS, stored);
      resolve(merged);
    });
  });
}

/**
 * Save settings to chrome.storage.sync
 * @param {Object} settings - Settings object to save
 * @returns {Promise<boolean>} Success status
 */
export async function saveSettings(settings) {
  return new Promise((resolve) => {
    // Update lastUpdated timestamp
    const settingsToSave = {
      ...settings,
      meta: {
        ...settings.meta,
        lastUpdated: Date.now(),
      },
    };
    
    chrome.storage.sync.set({ [STORAGE_KEY]: settingsToSave }, () => {
      if (chrome.runtime.lastError) {
        console.error('[PrivacyWall] Error saving settings:', chrome.runtime.lastError);
        resolve(false);
        return;
      }
      
      console.log('[PrivacyWall] Settings saved successfully');
      resolve(true);
    });
  });
}

/**
 * Reset settings to defaults
 * @returns {Promise<boolean>} Success status
 */
export async function resetSettings() {
  const defaults = {
    ...DEFAULT_SETTINGS,
    meta: {
      ...DEFAULT_SETTINGS.meta,
      installedAt: Date.now(),
      lastUpdated: Date.now(),
    },
  };
  
  return saveSettings(defaults);
}

/**
 * Check if initial setup is complete
 * @returns {Promise<boolean>} Whether setup is complete
 */
export async function isSetupComplete() {
  const settings = await loadSettings();
  return settings.meta?.setupComplete === true;
}

/**
 * Mark setup as complete
 * @returns {Promise<boolean>} Success status
 */
export async function markSetupComplete() {
  const settings = await loadSettings();
  settings.meta.setupComplete = true;
  settings.meta.installedAt = settings.meta.installedAt || Date.now();
  return saveSettings(settings);
}

/**
 * Get a specific PII rule's settings
 * @param {string} ruleId - Rule ID (e.g., 'PERSON', 'EMAIL')
 * @returns {Promise<Object|null>} Rule settings or null if not found
 */
export async function getPiiRule(ruleId) {
  const settings = await loadSettings();
  return settings.piiRules?.[ruleId] || null;
}

/**
 * Update a specific PII rule
 * @param {string} ruleId - Rule ID
 * @param {Object} updates - Partial updates to apply
 * @returns {Promise<boolean>} Success status
 */
export async function updatePiiRule(ruleId, updates) {
  const settings = await loadSettings();
  
  if (!settings.piiRules[ruleId]) {
    console.warn(`[PrivacyWall] Unknown rule ID: ${ruleId}`);
    return false;
  }
  
  settings.piiRules[ruleId] = {
    ...settings.piiRules[ruleId],
    ...updates,
  };
  
  return saveSettings(settings);
}

/**
 * Check if a site is protected
 * @param {string} domain - Domain to check (e.g., 'chat.openai.com')
 * @returns {Promise<boolean>} Whether the site is protected
 */
export async function isSiteProtected(domain) {
  const settings = await loadSettings();
  
  // If protect all sites is enabled, always return true
  if (settings.protectAllSites) {
    return true;
  }
  
  // Check if specific site is enabled
  const site = settings.protectedSites?.[domain];
  return site?.enabled === true;
}

/**
 * Get all enabled PII rules (for scanning)
 * @returns {Promise<Object>} Object with only enabled rules
 */
export async function getEnabledPiiRules() {
  const settings = await loadSettings();
  const enabled = {};
  
  for (const [id, rule] of Object.entries(settings.piiRules)) {
    if (rule.detect) {
      enabled[id] = rule;
    }
  }
  
  return enabled;
}

/**
 * Get rules that should trigger blocking (modal)
 * @returns {Promise<string[]>} Array of rule IDs that should block
 */
export async function getBlockingRuleIds() {
  const settings = await loadSettings();
  const blocking = [];
  
  for (const [id, rule] of Object.entries(settings.piiRules)) {
    if (rule.detect && rule.block) {
      blocking.push(id);
    }
  }
  
  return blocking;
}

/**
 * Get rules that should only warn (banner)
 * @returns {Promise<string[]>} Array of rule IDs that should only warn
 */
export async function getWarningOnlyRuleIds() {
  const settings = await loadSettings();
  const warning = [];
  
  for (const [id, rule] of Object.entries(settings.piiRules)) {
    if (rule.detect && !rule.block) {
      warning.push(id);
    }
  }
  
  return warning;
}

/**
 * Get AI settings
 * @returns {Promise<Object>} AI settings
 */
export async function getAiSettings() {
  const settings = await loadSettings();
  return settings.aiSettings;
}

/**
 * Get behavior settings
 * @returns {Promise<Object>} Behavior settings
 */
export async function getBehaviorSettings() {
  const settings = await loadSettings();
  return settings.behavior;
}

/**
 * Update multiple settings at once
 * @param {Object} updates - Partial settings to update
 * @returns {Promise<boolean>} Success status
 */
export async function updateSettings(updates) {
  const settings = await loadSettings();
  const merged = deepMerge(settings, updates);
  return saveSettings(merged);
}

