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

// ============================================================================
// INITIALIZATION
// ============================================================================

// Inject global CSS animations
injectGlobalStyles();

// Create engine status tracker
const engineStatus = {
  isReachable: false,
  isLoading: false,
  getStatusMessage() {
    if (this.isLoading) {
      return '<span style="color: #fbbc04;">● Loading AI Model...</span>';
    }
    if (this.isReachable) {
      return '<span style="color: #34a853;">● AI Model Ready</span>';
    }
    return '<span style="color: #9aa0a6;">● AI Model Not Loaded (Regex Mode Only)</span>';
  }
};

// Create instances
const scanner = new Scanner(engineStatus);
const modal = new FirewallModal(engineStatus);
const pasteHandler = new PasteHandler(scanner, modal);
const inputHandler = new InputHandler(scanner);
const cleanupManager = new CleanupManager();

// ============================================================================
// ENGINE STATUS COMMUNICATION
// ============================================================================

// Request initial engine status from background script
try {
  chrome.runtime.sendMessage({ type: MESSAGE_TYPES.GET_ENGINE_STATUS }, (response) => {
    // Check for errors (e.g., if extension context was invalidated)
    if (chrome.runtime.lastError) {
      // Silently ignore - this happens during page reload
      return;
    }
    if (response) {
      engineStatus.isReachable = response.reachable;
      engineStatus.isLoading = response.loading || false;
      Logger.info(`Initial engine status: ${engineStatus.isReachable ? 'READY ✓' : engineStatus.isLoading ? 'LOADING...' : 'OFFLINE ✗'}`);
    }
  });
} catch (e) {
  // Silently ignore - extension context may be invalidated during reload
}

// Listen for engine status updates from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === MESSAGE_TYPES.ENGINE_STATUS) {
    const wasReachable = engineStatus.isReachable;
    const wasLoading = engineStatus.isLoading;
    engineStatus.isReachable = message.reachable;
    engineStatus.isLoading = message.loading || false;
    
    // Log status changes
    if (wasReachable !== engineStatus.isReachable || wasLoading !== engineStatus.isLoading) {
      Logger.info(`Engine status updated: ${engineStatus.isReachable ? 'READY ✓' : engineStatus.isLoading ? 'LOADING...' : 'OFFLINE ✗'}`);
    }
    
    // Return true to indicate we handled the message
    return false;
  }
});

// ============================================================================
// INITIALIZE EVENT HANDLERS
// ============================================================================

// Initialize paste and input handlers
pasteHandler.initialize();
inputHandler.initialize();

// Register cleanup tasks
cleanupManager.register(() => pasteHandler.cleanup());
cleanupManager.register(() => inputHandler.cleanup());
cleanupManager.register(() => modal.remove());
cleanupManager.register(() => {
  const banner = document.getElementById(DOM_IDS.BANNER);
  if (banner) banner.remove();
});

// ============================================================================
// CLEANUP ON UNLOAD
// ============================================================================

window.addEventListener("unload", () => {
  cleanupManager.execute();
});

Logger.info('PrivacyWall content script initialized');

