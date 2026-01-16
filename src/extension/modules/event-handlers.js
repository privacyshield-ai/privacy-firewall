// ============================================================================
// EVENT HANDLERS
// ============================================================================

import { CONFIG } from './config.js';
import { Logger, debounce } from './utils.js';
import { getTextFromElement, captureInsertionContext } from './dom-utils.js';
import { FirewallModal } from './ui/modal.js';
import { TypingWarningBanner } from './ui/banner.js';

/**
 * Check if extension context is still valid
 * @returns {boolean} True if context is valid
 */
function isExtensionContextValid() {
  try {
    // This will throw if context is invalidated
    return !!chrome.runtime?.id;
  } catch {
    return false;
  }
}

/**
 * Handles paste events and scanning
 */
export class PasteHandler {
  constructor(scanner, modal, settings = null) {
    this.scanner = scanner;
    this.modal = modal;
    this.settings = settings;
    this.handler = null;
  }

  /**
   * Update settings
   * @param {Object} settings - New settings object
   */
  updateSettings(settings) {
    this.settings = settings;
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
    // Check if extension context is still valid
    if (!isExtensionContextValid()) {
      // Silently fail - extension was reloaded
      return;
    }
    
    Logger.info("Paste event detected");
    
    try {
      // Get pasted text from clipboard
      const pastedText = (e.clipboardData || window.clipboardData)?.getData("text");
      
      // Validate input
      if (!pastedText || typeof pastedText !== "string" || pastedText.trim() === "") {
        return;
      }

      Logger.info("Pasted text length:", pastedText.length);

      // Always prevent paste first - we'll re-insert if clean
      e.preventDefault();
      e.stopPropagation();
      
      const insertionContext = captureInsertionContext(e);

      // STEP 1: Instant local regex scan (synchronous)
      const localFindings = this.scanner.scanLocally(pastedText);
      Logger.info("Regex findings:", localFindings.length);

      // STEP 2: AI scan (async) - run in parallel if AI is available
      let aiFindings = [];
      if (this.scanner.engineStatus.isReachable) {
        try {
          Logger.info("Running AI scan...");
          aiFindings = await this.scanner.scanWithAI(pastedText);
          Logger.info("AI findings:", aiFindings.length);
        } catch (err) {
          Logger.error("AI scan error:", err);
        }
      }

      // STEP 3: Combine all findings
      const allFindings = [...localFindings, ...aiFindings];
      
      // Deduplicate by type (keep first occurrence)
      const seenTypes = new Set();
      const uniqueFindings = allFindings.filter(f => {
        const key = f.ruleId || f.type;
        if (seenTypes.has(key)) return false;
        seenTypes.add(key);
        return true;
      });

      const blockingFindings = uniqueFindings.filter(f => f.shouldBlock);
      const warningFindings = uniqueFindings.filter(f => !f.shouldBlock);

      Logger.info("Combined findings - blocking:", blockingFindings.length, "warning:", warningFindings.length);

      // If we have blocking findings, show modal
      if (blockingFindings.length > 0) {
        this.modal.show(blockingFindings, pastedText, insertionContext);
        return;
      }
      
      // If we have warning-only findings, show banner but allow paste
      if (warningFindings.length > 0) {
        Logger.info("Warning findings (non-blocking):", warningFindings.length);
        // Re-insert the text since we blocked it
        if (insertionContext.target) {
          insertionContext.target.focus();
          document.execCommand('insertText', false, pastedText);
        }
        const banner = new TypingWarningBanner(warningFindings, pastedText, insertionContext);
        banner.show();
        return;
      }

      // No findings - allow paste by re-inserting
      Logger.info("No sensitive data found, allowing paste");
      if (insertionContext.target) {
        insertionContext.target.focus();
        document.execCommand('insertText', false, pastedText);
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
  constructor(scanner, settings = null) {
    this.scanner = scanner;
    this.settings = settings;
    this.handler = null;
  }

  /**
   * Update settings
   * @param {Object} settings - New settings object
   */
  updateSettings(settings) {
    this.settings = settings;
  }

  /**
   * Initializes the input event listener
   */
  initialize() {
    // Separate debounced handlers for local (fast) and AI (slower) scans
    this.debouncedLocalScan = debounce(
      (e) => this.handleLocalScan(e),
      CONFIG.LOCAL_SCAN_DEBOUNCE_MS || 300
    );
    
    this.debouncedAIScan = debounce(
      (e) => this.handleAIScan(e),
      CONFIG.AI_SCAN_DEBOUNCE_MS || 600
    );
    
    this.handler = (e) => {
      this.debouncedLocalScan(e);
      this.debouncedAIScan(e);
    };
    
    document.addEventListener('input', this.handler, true);
    Logger.info('Input handler initialized');
  }

  /**
   * Handles local regex scan (faster, 300ms debounce)
   * @param {InputEvent} e - Input event
   */
  handleLocalScan(e) {
    // Check if extension context is still valid
    if (!isExtensionContextValid()) {
      this.cleanup();
      return;
    }
    
    try {
      const target = e.target;
      const text = getTextFromElement(target);
      
      if (!text || text.trim() === '') {
        return;
      }
      
      // Scan locally
      const localFindings = this.scanner.scanLocally(text);
      
      if (localFindings.length > 0) {
        Logger.warn("Sensitive data detected while typing (regex)");
        const banner = new TypingWarningBanner(localFindings);
        banner.show();
      }
    } catch (error) {
      if (error.message?.includes('Extension context invalidated')) {
        this.cleanup();
        return;
      }
      Logger.error('Error in local scan handler:', error);
    }
  }

  /**
   * Handles AI scan (slower, 600ms debounce)
   * @param {InputEvent} e - Input event
   */
  async handleAIScan(e) {
    // Check if extension context is still valid
    if (!isExtensionContextValid()) {
      this.cleanup();
      return;
    }
    
    try {
      const target = e.target;
      const text = getTextFromElement(target);
      
      if (!text || text.trim() === '') {
        return;
      }
      
      // Only scan with AI if available
      if (this.scanner.engineStatus.isReachable) {
        const aiFindings = await this.scanner.scanWithAI(text);
        if (aiFindings && aiFindings.length > 0) {
          Logger.warn("Sensitive data detected while typing (AI)");
          const banner = new TypingWarningBanner(aiFindings);
          banner.show();
        }
      }
    } catch (error) {
      if (error.message?.includes('Extension context invalidated')) {
        this.cleanup();
        return;
      }
      Logger.error('Error in AI scan handler:', error);
    }
  }

  /**
   * Removes the input event listener
   */
  cleanup() {
    if (this.handler) {
      document.removeEventListener('input', this.handler, true);
      this.handler = null;
      this.debouncedLocalScan = null;
      this.debouncedAIScan = null;
      Logger.info('Input handler cleaned up');
    }
  }
}
