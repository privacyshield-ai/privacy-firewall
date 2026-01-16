// ============================================================================
// SETTINGS PAGE JAVASCRIPT
// ============================================================================

import { loadSettings, saveSettings, resetSettings, markSetupComplete } from '../modules/settings.js';
import { DEFAULT_SETTINGS, DEFAULT_PII_RULES, DEFAULT_PROTECTED_SITES } from '../modules/settings-defaults.js';
import { MESSAGE_TYPES } from '../modules/config.js';

// ============================================================================
// DOM ELEMENTS
// ============================================================================

const elements = {
  piiRulesBody: document.getElementById('pii-rules-body'),
  sitesList: document.getElementById('sites-list'),
  protectAllSites: document.getElementById('protect-all-sites'),
  aiThreshold: document.getElementById('ai-threshold'),
  thresholdDisplay: document.getElementById('threshold-display'),
  showPastedText: document.getElementById('show-pasted-text'),
  strictMode: document.getElementById('strict-mode'),
  scanWhileTyping: document.getElementById('scan-while-typing'),
  resetBtn: document.getElementById('reset-btn'),
  saveBtn: document.getElementById('save-btn'),
  modelStatus: document.getElementById('model-status'),
};

// Current settings state
let currentSettings = null;

// ============================================================================
// INITIALIZATION
// ============================================================================

document.addEventListener('DOMContentLoaded', async () => {
  console.log('[PrivacyWall Settings] Initializing...');
  
  // Load settings
  currentSettings = await loadSettings();
  console.log('[PrivacyWall Settings] Loaded settings:', currentSettings);
  
  // Render UI
  renderPiiRules();
  renderSitesList();
  renderBehaviorOptions();
  
  // Setup event listeners
  setupEventListeners();
  
  // Check model status
  checkModelStatus();
});

// ============================================================================
// RENDER FUNCTIONS
// ============================================================================

function renderPiiRules() {
  const tbody = elements.piiRulesBody;
  tbody.innerHTML = '';

  for (const [ruleId, defaultRule] of Object.entries(DEFAULT_PII_RULES)) {
    const rule = currentSettings.piiRules[ruleId] || defaultRule;

    const row = document.createElement('tr');
    row.innerHTML = `
      <td>
        <div class="category-cell">
          <span class="category-icon">${defaultRule.icon}</span>
          <span class="category-name">${defaultRule.name}</span>
        </div>
      </td>
      <td>
        <input type="checkbox" 
               class="table-checkbox" 
               data-rule="${ruleId}" 
               data-field="detect" 
               ${rule.detect ? 'checked' : ''}>
      </td>
      <td>
        <input type="checkbox" 
               class="table-checkbox" 
               data-rule="${ruleId}" 
               data-field="block" 
               ${rule.block ? 'checked' : ''}
               ${!rule.detect ? 'disabled' : ''}>
      </td>
      <td>
        <span class="severity-badge severity-${rule.severity}">
          ${getSeverityIcon(rule.severity)} ${capitalize(rule.severity)}
        </span>
      </td>
    `;
    
    tbody.appendChild(row);
  }
  
  // Add event listeners for checkboxes
  tbody.querySelectorAll('.table-checkbox').forEach(checkbox => {
    checkbox.addEventListener('change', handlePiiRuleChange);
  });
}

function renderSitesList() {
  const container = elements.sitesList;
  container.innerHTML = '';

  for (const [domain, siteDefaults] of Object.entries(DEFAULT_PROTECTED_SITES)) {
    const isEnabled = currentSettings.protectedSites[domain]?.enabled ?? siteDefaults.enabled;

    const siteItem = document.createElement('label');
    siteItem.className = 'site-item';
    siteItem.innerHTML = `
      <input type="checkbox"
             data-domain="${domain}"
             ${isEnabled ? 'checked' : ''}>
      <div>
        <div class="site-domain">${domain}</div>
        <div class="site-name">${siteDefaults.name}</div>
      </div>
    `;

    container.appendChild(siteItem);
  }
  
  // Set protect all checkbox
  elements.protectAllSites.checked = currentSettings.protectAllSites || false;
  
  // Add event listeners
  container.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
    checkbox.addEventListener('change', handleSiteChange);
  });
}

function renderBehaviorOptions() {
  // AI Threshold
  const threshold = Math.round((currentSettings.aiSettings?.confidenceThreshold || 0.5) * 100);
  elements.aiThreshold.value = threshold;
  elements.thresholdDisplay.textContent = `${threshold}%`;
  
  // Behavior checkboxes
  elements.showPastedText.checked = currentSettings.behavior?.showPastedText ?? true;
  elements.strictMode.checked = currentSettings.behavior?.strictMode ?? false;
  elements.scanWhileTyping.checked = currentSettings.behavior?.scanWhileTyping ?? true;
}

// ============================================================================
// EVENT HANDLERS
// ============================================================================

function setupEventListeners() {
  // Threshold slider
  elements.aiThreshold.addEventListener('input', (e) => {
    const value = e.target.value;
    elements.thresholdDisplay.textContent = `${value}%`;
    currentSettings.aiSettings.confidenceThreshold = parseInt(value) / 100;
  });
  
  // Protect all sites
  elements.protectAllSites.addEventListener('change', (e) => {
    currentSettings.protectAllSites = e.target.checked;
  });
  
  // Behavior options
  elements.showPastedText.addEventListener('change', (e) => {
    currentSettings.behavior.showPastedText = e.target.checked;
  });
  
  elements.strictMode.addEventListener('change', (e) => {
    currentSettings.behavior.strictMode = e.target.checked;
  });
  
  elements.scanWhileTyping.addEventListener('change', (e) => {
    currentSettings.behavior.scanWhileTyping = e.target.checked;
  });
  
  // Save button
  elements.saveBtn.addEventListener('click', handleSave);
  
  // Reset button
  elements.resetBtn.addEventListener('click', handleReset);
}

function handlePiiRuleChange(e) {
  const ruleId = e.target.dataset.rule;
  const field = e.target.dataset.field;
  const value = e.target.checked;
  
  if (!currentSettings.piiRules[ruleId]) {
    currentSettings.piiRules[ruleId] = { ...DEFAULT_SETTINGS.piiRules[ruleId] };
  }
  
  currentSettings.piiRules[ruleId][field] = value;
  
  // If detect is turned off, also turn off block
  if (field === 'detect' && !value) {
    currentSettings.piiRules[ruleId].block = false;
    // Update the block checkbox in the UI
    const blockCheckbox = document.querySelector(`input[data-rule="${ruleId}"][data-field="block"]`);
    if (blockCheckbox) {
      blockCheckbox.checked = false;
      blockCheckbox.disabled = true;
    }
  }
  
  // If detect is turned on, enable block checkbox
  if (field === 'detect' && value) {
    const blockCheckbox = document.querySelector(`input[data-rule="${ruleId}"][data-field="block"]`);
    if (blockCheckbox) {
      blockCheckbox.disabled = false;
    }
  }
}

function handleSiteChange(e) {
  const domain = e.target.dataset.domain;
  currentSettings.protectedSites[domain] = e.target.checked;
}

async function handleSave() {
  try {
    elements.saveBtn.disabled = true;
    elements.saveBtn.textContent = 'Saving...';
    
    // Mark setup as complete
    currentSettings.meta.setupComplete = true;
    currentSettings.meta.lastUpdated = Date.now();
    
    await saveSettings(currentSettings);
    await markSetupComplete();
    
    showToast('Settings saved successfully!', 'success');
    
    // Notify background script
    chrome.runtime.sendMessage({ type: 'SETTINGS_UPDATED' });
    
  } catch (error) {
    console.error('[PrivacyWall Settings] Save failed:', error);
    showToast('Failed to save settings', 'error');
  } finally {
    elements.saveBtn.disabled = false;
    elements.saveBtn.textContent = '💾 Save Settings';
  }
}

async function handleReset() {
  if (!confirm('Are you sure you want to reset all settings to defaults?')) {
    return;
  }
  
  try {
    await resetSettings();
    currentSettings = await loadSettings();
    
    renderPiiRules();
    renderSitesList();
    renderBehaviorOptions();
    
    showToast('Settings reset to defaults', 'success');
  } catch (error) {
    console.error('[PrivacyWall Settings] Reset failed:', error);
    showToast('Failed to reset settings', 'error');
  }
}

// ============================================================================
// MODEL STATUS
// ============================================================================

function checkModelStatus() {
  chrome.runtime.sendMessage({ type: MESSAGE_TYPES.GET_ENGINE_STATUS }, (response) => {
    if (chrome.runtime.lastError) {
      updateModelStatus('error', 'Unable to connect');
      return;
    }
    
    if (response?.reachable) {
      updateModelStatus('ready', 'AI Model Ready ✓');
    } else if (response?.loading) {
      updateModelStatus('loading', 'AI Model Loading...');
      // Check again in a few seconds
      setTimeout(checkModelStatus, 3000);
    } else {
      updateModelStatus('loading', 'AI Model Initializing...');
      setTimeout(checkModelStatus, 3000);
    }
  });
}

function updateModelStatus(status, text) {
  const modelStatus = elements.modelStatus;
  
  // Update aria-busy for Pico CSS loading state
  if (status === 'loading') {
    modelStatus.setAttribute('aria-busy', 'true');
  } else {
    modelStatus.removeAttribute('aria-busy');
  }
  
  // Update class for styling
  modelStatus.className = status;
  
  // Update text
  modelStatus.textContent = text;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function getSeverityIcon(severity) {
  const icons = {
    low: '🟢',
    medium: '🟡',
    high: '🔴',
    critical: '🔴'
  };
  return icons[severity] || '⚪';
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function showToast(message, type = 'success') {
  // Remove existing toast
  const existingToast = document.querySelector('.toast');
  if (existingToast) {
    existingToast.remove();
  }
  
  // Create new toast
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  
  // Show toast
  requestAnimationFrame(() => {
    toast.classList.add('show');
  });
  
  // Hide after 3 seconds
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}
