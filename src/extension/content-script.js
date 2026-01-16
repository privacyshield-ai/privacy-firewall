// ============================================================================
// CONTENT SCRIPT FOR PRIVACYWALL EXTENSION
// ============================================================================

// Import modules (NOTE: Do NOT import engine-status.js or transformer-detector.js here
// as they load the heavy AI model. AI runs only in the offscreen document.)
import { CONFIG, MESSAGE_TYPES, DOM_IDS } from './modules/config.js';
import { Logger, CleanupManager } from './modules/utils.js';
import { injectGlobalStyles } from './modules/ui/styles.js';
import { Scanner } from './modules/scanner.js';
import { FirewallModal } from './modules/ui/modal.js';
import { PasteHandler, InputHandler } from './modules/event-handlers.js';
import { loadSettings } from './modules/settings.js';

// ============================================================================
// SETTINGS & SITE PROTECTION
// ============================================================================

let settings = null;
let isSiteProtected = false;

/**
 * Check if the current site is protected based on settings
 * @param {Object} settings - Settings object
 * @returns {boolean} Whether the current site should be protected
 */
function checkSiteProtection(settings) {
  // If protectAllSites is enabled, protect everything
  if (settings.protectAllSites) {
    return true;
  }
  
  // Check if current hostname matches any protected site
  const currentHost = window.location.hostname.toLowerCase();
  
  for (const [domain, config] of Object.entries(settings.protectedSites)) {
    if (config.enabled) {
      // Match exact domain or subdomain
      if (currentHost === domain || currentHost.endsWith('.' + domain)) {
        return true;
      }
    }
  }
  
  return false;
}

// ============================================================================
// ENGINE STATUS TRACKING
// ============================================================================

const engineStatus = {
  isReachable: false,
  isLoading: false,
  getStatusMessage() {
    if (this.isLoading) {
      return '<span style="color: #fbbc04;">Loading AI Model...</span>';
    }
    if (this.isReachable) {
      return '<span style="color: #34a853;">AI Model Ready</span>';
    }
    return '<span style="color: #9aa0a6;">Regex Mode Only</span>';
  }
};

// ============================================================================
// INITIALIZATION
// ============================================================================

// Create instances (will be initialized after settings load)
let scanner = null;
let modal = null;
let pasteHandler = null;
let inputHandler = null;
const cleanupManager = new CleanupManager();

/**
 * Initialize the extension after settings are loaded
 */
async function initialize() {
  try {
    // Load settings from storage
    settings = await loadSettings();
    Logger.info('Settings loaded:', {
      protectAllSites: settings.protectAllSites,
      aiEnabled: settings.aiSettings.enabled,
      threshold: settings.aiSettings.confidenceThreshold
    });
    
    // Check if this site should be protected
    isSiteProtected = checkSiteProtection(settings);
    
    if (!isSiteProtected) {
      Logger.info(`Site not protected: ${window.location.hostname}`);
      return; // Don't initialize handlers for non-protected sites
    }
    
    Logger.info(`Site protected: ${window.location.hostname}`);
    
    // Inject global CSS animations
    injectGlobalStyles();
    
    // Create instances with settings
    scanner = new Scanner(engineStatus, settings);
    modal = new FirewallModal(engineStatus, settings);
    pasteHandler = new PasteHandler(scanner, modal, settings);
    inputHandler = new InputHandler(scanner, settings);
    
    // Initialize event handlers
    pasteHandler.initialize();
    
    // Only initialize typing detection if enabled
    if (settings.behavior.scanWhileTyping) {
      inputHandler.initialize();
    }
    
    // Register cleanup tasks
    cleanupManager.register(() => pasteHandler.cleanup());
    cleanupManager.register(() => inputHandler.cleanup());
    cleanupManager.register(() => modal.remove());
    cleanupManager.register(() => {
      const banner = document.getElementById(DOM_IDS.BANNER);
      if (banner) banner.remove();
    });
    
    // Request initial engine status
    requestEngineStatus();
    
    Logger.info('PrivacyWall content script initialized');
    
  } catch (error) {
    Logger.error('Failed to initialize PrivacyWall:', error);
  }
}

/**
 * Request engine status from background script
 */
function requestEngineStatus() {
  try {
    chrome.runtime.sendMessage({ type: MESSAGE_TYPES.GET_ENGINE_STATUS }, (response) => {
      if (chrome.runtime.lastError) {
        return; // Silently ignore during page reload
      }
      if (response) {
        engineStatus.isReachable = response.reachable;
        engineStatus.isLoading = response.loading || false;
        Logger.info(`Engine status: ${engineStatus.isReachable ? 'READY' : engineStatus.isLoading ? 'LOADING' : 'OFFLINE'}`);
      }
    });
  } catch (e) {
    // Silently ignore - extension context may be invalidated
  }
}

// ============================================================================
// MESSAGE LISTENERS
// ============================================================================

// Listen for engine status updates from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === MESSAGE_TYPES.ENGINE_STATUS) {
    const wasReachable = engineStatus.isReachable;
    const wasLoading = engineStatus.isLoading;
    engineStatus.isReachable = message.reachable;
    engineStatus.isLoading = message.loading || false;
    
    if (wasReachable !== engineStatus.isReachable || wasLoading !== engineStatus.isLoading) {
      Logger.info(`Engine status updated: ${engineStatus.isReachable ? 'READY' : engineStatus.isLoading ? 'LOADING' : 'OFFLINE'}`);
    }
    
    return false;
  }
  
  // Listen for settings changes
  if (message.type === MESSAGE_TYPES.SETTINGS_UPDATED) {
    Logger.info('Settings updated, reloading...');
    // Reload settings and reinitialize if needed
    loadSettings().then((newSettings) => {
      settings = newSettings;
      
      // Update scanner and modal with new settings
      if (scanner) scanner.updateSettings(settings);
      if (modal) modal.updateSettings(settings);
      if (pasteHandler) pasteHandler.updateSettings(settings);
      if (inputHandler) inputHandler.updateSettings(settings);
      
      // Check if site protection status changed
      const wasProtected = isSiteProtected;
      isSiteProtected = checkSiteProtection(settings);
      
      if (wasProtected !== isSiteProtected) {
        if (isSiteProtected) {
          Logger.info('Site is now protected, reinitializing...');
          // Would need full reinit here
        } else {
          Logger.info('Site is no longer protected, cleaning up...');
          cleanupManager.execute();
        }
      }
    });
    
    return false;
  }
});

// ============================================================================
// CLEANUP ON UNLOAD
// ============================================================================

window.addEventListener("unload", () => {
  cleanupManager.execute();
});

// ============================================================================
// START
// ============================================================================

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}

