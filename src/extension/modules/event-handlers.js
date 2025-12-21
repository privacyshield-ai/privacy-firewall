// ============================================================================
// EVENT HANDLERS
// ============================================================================

import { CONFIG } from './config.js';
import { Logger, debounce } from './utils.js';
import { getTextFromElement, captureInsertionContext } from './dom-utils.js';
import { FirewallModal } from './ui/modal.js';
import { TypingWarningBanner } from './ui/banner.js';

/**
 * Handles paste events and scanning
 */
export class PasteHandler {
  constructor(scanner, modal) {
    this.scanner = scanner;
    this.modal = modal;
    this.handler = null;
  }

  /**
   * Initializes the paste event listener
   */
  initialize() {
    this.handler = (e) => this.handlePaste(e);
    document.addEventListener("paste", this.handler, true);
    Logger.info('Paste handler initialized');
  }

  /**
   * Handles paste events
   * @param {ClipboardEvent} e - Paste event
   */
  async handlePaste(e) {
    Logger.info("🎯 PASTE EVENT DETECTED!");
    
    try {
      // Get pasted text from clipboard
      const pastedText = (e.clipboardData || window.clipboardData)?.getData("text");
      Logger.info("📋 Pasted text length:", pastedText?.length || 0);
      
      // Validate input
      if (!pastedText || typeof pastedText !== "string" || pastedText.trim() === "") {
        Logger.info("❌ No text or invalid input");
        return;
      }

      // STEP 1: Instant local regex scan (synchronous, no network)
      const localFindings = this.scanner.scanLocally(pastedText);
      const insertionContext = captureInsertionContext(e);
      Logger.info("🔍 Local scan findings:", localFindings.length);

      // If regex detects sensitive data, block immediately
      if (localFindings.length > 0) {
        e.preventDefault();
        e.stopPropagation();
        this.modal.show(localFindings, pastedText, insertionContext);
        return;
      }

      // STEP 2: Optional AI scan in background (async, non-blocking)
      // Note: We allow the paste to proceed, but scan in background for additional detection
      // This provides a better user experience while still catching AI-detected patterns
      Logger.info("🤖 AI Engine status:", this.scanner.engineStatus.isReachable ? 'READY' : 'OFFLINE');
      
      if (this.scanner.engineStatus.isReachable) {
        Logger.info("🤖 Starting AI scan...");
        this.scanner.scanWithAI(pastedText)
          .then((aiFindings) => {
            Logger.info("🤖 AI scan complete, findings:", aiFindings?.length || 0);
            if (aiFindings && aiFindings.length > 0) {
              // AI detected something after paste - show warning
              // Pass true for pasteAlreadyInserted so "Keep Safe" will remove the text
              Logger.warn("⚠️ AI detected sensitive data in pasted content:", aiFindings);
              this.modal.show(aiFindings, pastedText, insertionContext, true);
            }
          })
          .catch((err) => {
            Logger.error("AI scan error:", err);
          });
      } else {
        Logger.info("🤖 AI scan skipped - engine not ready");
      }
    } catch (error) {
      Logger.error('Error in paste handler:', error);
    }
  }

  /**
   * Removes the paste event listener
   */
  cleanup() {
    if (this.handler) {
      document.removeEventListener("paste", this.handler, true);
      this.handler = null;
      Logger.info('Paste handler cleaned up');
    }
  }
}

/**
 * Handles input events for typing detection
 */
export class InputHandler {
  constructor(scanner) {
    this.scanner = scanner;
    this.handler = null;
  }

  /**
   * Initializes the input event listener
   */
  initialize() {
    const debouncedHandler = debounce(
      (e) => this.handleInput(e),
      CONFIG.DEBOUNCE_DELAY_MS
    );
    
    this.handler = debouncedHandler;
    document.addEventListener('input', this.handler, true);
    Logger.info('Input handler initialized');
  }

  /**
   * Handles input events after debounce
   * @param {InputEvent} e - Input event
   */
  async handleInput(e) {
    try {
      const target = e.target;
      const text = getTextFromElement(target);
      
      if (!text || text.trim() === '') {
        return;
      }
      
      Logger.info("⌨️ INPUT SCAN - Text length:", text.length);
      
      // Scan locally
      const localFindings = this.scanner.scanLocally(text);
      
      if (localFindings.length > 0) {
        Logger.warn("🚨 Sensitive data detected while typing!");
        // Show warning (non-blocking, just notification)
        const banner = new TypingWarningBanner(localFindings);
        banner.show();
      }
    } catch (error) {
      Logger.error('Error in input handler:', error);
    }
  }

  /**
   * Removes the input event listener
   */
  cleanup() {
    if (this.handler) {
      document.removeEventListener('input', this.handler, true);
      this.handler = null;
      Logger.info('Input handler cleaned up');
    }
  }
}
