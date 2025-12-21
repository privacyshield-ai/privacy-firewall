// ============================================================================
// FIREWALL MODAL COMPONENT
// ============================================================================

import { DOM_IDS, ICONS, CONFIG } from '../config.js';
import { getModalStyles } from './styles.js';
import { insertTextAtCursor, removeTextFromElement } from '../dom-utils.js';
import { Logger } from '../utils.js';

/**
 * Firewall Modal for displaying sensitive data warnings
 */
export class FirewallModal {
  constructor(engineStatus) {
    this.engineStatus = engineStatus;
    this.host = null;
    this.shadow = null;
    this.keyDownHandler = null;
  }

  /**
   * Shows the firewall modal
   * @param {Array} findings - Array of detected sensitive data
   * @param {string} originalText - The original text that was blocked
   * @param {Object|null} insertionContext - Saved cursor/selection context
   * @param {boolean} pasteAlreadyInserted - Whether paste already happened (AI scan case)
   */
  show(findings, originalText, insertionContext = null, pasteAlreadyInserted = false) {
    try {
      // Remove existing modal if any
      this.remove();

      // Create host element for Shadow DOM
      this.host = document.createElement("div");
      this.host.id = DOM_IDS.MODAL_HOST;
      document.body.appendChild(this.host);

      // Attach Shadow DOM (isolates from page CSS)
      this.shadow = this.host.attachShadow({ mode: "open" });

      // Create and append styles
      const style = document.createElement("style");
      style.textContent = getModalStyles();
      this.shadow.appendChild(style);

      // Create and append modal structure
      const modalOverlay = this.createModalStructure(findings, originalText, insertionContext);
      this.shadow.appendChild(modalOverlay);

      // Attach event handlers
      this.attachEventHandlers(originalText, insertionContext, pasteAlreadyInserted);
    } catch (error) {
      Logger.error('Failed to show firewall modal:', error);
    }
  }

  /**
   * Creates the modal HTML structure
   * @param {Array} findings - Detection findings
   * @param {string} originalText - Original text
   * @param {Object|null} insertionContext - Insertion context
   * @returns {HTMLElement} Modal overlay element
   */
  createModalStructure(findings, originalText, insertionContext) {
    const findingsHtml = this.buildFindingsHTML(findings);
    const statusMessage = this.engineStatus.getStatusMessage();

    const modalOverlay = document.createElement("div");
    modalOverlay.className = "modal-overlay";
    modalOverlay.innerHTML = `
      <div class="modal-content">
        <h2 class="modal-header">
          <span class="modal-icon">🛡️</span> 
          DATA LEAK BLOCKED
        </h2>
        <p class="modal-text">
          PrivacyWall prevented this paste because it contains sensitive data.
        </p>
        <div class="findings-list">
          ${findingsHtml}
        </div>
        <div class="button-container">
          <button id="${DOM_IDS.MODAL_CANCEL}" class="btn btn-cancel">
            ${ICONS.shield}
            <span>Keep Safe</span>
          </button>
          <button id="${DOM_IDS.MODAL_OVERRIDE}" class="btn btn-override">
            ${ICONS.warning}
            <span>Paste Anyway</span>
          </button>
        </div>
        <div class="status-bar">
          ${statusMessage}
        </div>
      </div>
    `;

    return modalOverlay;
  }

  /**
   * Builds HTML for findings list
   * @param {Array} findings - Detection findings
   * @returns {string} HTML string
   */
  buildFindingsHTML(findings) {
    return findings
      .map(
        (f) =>
          `<div class="finding-item">
            <strong class="finding-type">${f.description || f.type.toUpperCase()}</strong> detected
          </div>`
      )
      .join("");
  }

  /**
   * Attaches event handlers to modal buttons
   * @param {string} originalText - Original text
   * @param {Object|null} insertionContext - Insertion context
   * @param {boolean} pasteAlreadyInserted - Whether paste already happened
   */
  attachEventHandlers(originalText, insertionContext, pasteAlreadyInserted = false) {
    if (!this.shadow) return;

    const cancelBtn = this.shadow.getElementById(DOM_IDS.MODAL_CANCEL);
    const overrideBtn = this.shadow.getElementById(DOM_IDS.MODAL_OVERRIDE);

    if (cancelBtn) {
      cancelBtn.addEventListener("click", () => {
        // If paste already happened (AI scan case), we need to remove it
        if (pasteAlreadyInserted) {
          removeTextFromElement(originalText, insertionContext);
        }
        this.close();
      });
    }

    if (overrideBtn) {
      overrideBtn.addEventListener("click", () => {
        // If paste was blocked (regex case), insert it now
        if (!pasteAlreadyInserted) {
          insertTextAtCursor(originalText, insertionContext);
        }
        // If paste already happened (AI case), just close - text is already there
        this.close();
      });
    }

    // ESC key to cancel
    this.keyDownHandler = (e) => {
      if (e.key === "Escape") {
        this.close();
      }
    };
    document.addEventListener("keydown", this.keyDownHandler);
  }

  /**
   * Closes and removes the modal
   */
  close() {
    this.remove();
  }

  /**
   * Removes the modal from DOM and cleans up listeners
   */
  remove() {
    if (this.keyDownHandler) {
      document.removeEventListener("keydown", this.keyDownHandler);
      this.keyDownHandler = null;
    }

    if (this.host && this.host.parentElement) {
      this.host.remove();
    }

    this.host = null;
    this.shadow = null;
  }

  /**
   * Static method to remove any existing modal
   */
  static removeExisting() {
    const existingHost = document.getElementById(DOM_IDS.MODAL_HOST);
    if (existingHost) {
      existingHost.remove();
    }
  }
}
