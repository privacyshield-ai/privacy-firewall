// ============================================================================
// FIREWALL MODAL COMPONENT
// ============================================================================

import { DOM_IDS, ICONS, CONFIG } from '../config.js';
import { getModalStyles } from './styles.js';
import { getTypeIcon } from './icons.js';
import { insertTextAtCursor, removeTextFromElement, escapeHtml } from '../dom-utils.js';
import { Logger } from '../utils.js';

/**
 * Firewall Modal for displaying sensitive data warnings
 */
export class FirewallModal {
  constructor(engineStatus, settings = null) {
    this.engineStatus = engineStatus;
    this.settings = settings;
    this.host = null;
    this.shadow = null;
    this.keyDownHandler = null;
  }

  /**
   * Update settings
   * @param {Object} settings - New settings object
   */
  updateSettings(settings) {
    this.settings = settings;
  }

  /**
   * Check if a modal is currently visible
   * @returns {boolean}
   */
  static isVisible() {
    return !!document.getElementById(DOM_IDS.MODAL_HOST);
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
   * Creates highlighted text with sensitive data marked
   * @param {string} text - Original text
   * @param {Array} findings - Detection findings
   * @returns {string} HTML with highlights
   */
  createHighlightedText(text, findings) {
    // Collect all match positions
    const highlights = [];
    
    for (const finding of findings) {
      if (finding.value && finding.value.length > 0) {
        // If finding has start/end positions from AI, use them
        if (typeof finding.start === 'number' && typeof finding.end === 'number') {
          highlights.push({
            start: finding.start,
            end: finding.end,
            value: finding.value
          });
        } else {
          // Fall back to string matching (case-insensitive)
          const lowerText = text.toLowerCase();
          const lowerValue = finding.value.toLowerCase();
          let pos = 0;
          while ((pos = lowerText.indexOf(lowerValue, pos)) !== -1) {
            highlights.push({
              start: pos,
              end: pos + finding.value.length,
              value: text.substring(pos, pos + finding.value.length) // Use original case
            });
            pos += finding.value.length;
          }
        }
      }
    }
    
    // Sort by start position and merge overlapping
    highlights.sort((a, b) => a.start - b.start);
    const merged = [];
    for (const h of highlights) {
      if (merged.length === 0 || h.start > merged[merged.length - 1].end) {
        merged.push({ ...h });
      } else {
        merged[merged.length - 1].end = Math.max(merged[merged.length - 1].end, h.end);
      }
    }
    
    // Build HTML with highlights
    let result = '';
    let lastEnd = 0;
    
    for (const h of merged) {
      // Add non-highlighted text before this match
      if (h.start > lastEnd) {
        result += escapeHtml(text.substring(lastEnd, h.start));
      }
      // Add highlighted match
      result += `<span class="highlight">${escapeHtml(text.substring(h.start, h.end))}</span>`;
      lastEnd = h.end;
    }

    // Add remaining text
    if (lastEnd < text.length) {
      result += escapeHtml(text.substring(lastEnd));
    }

    return result || escapeHtml(text);
  }

  /**
   * Creates the modal HTML structure
   * @param {Array} findings - Detection findings
   * @param {string} originalText - Original text
   * @param {Object|null} insertionContext - Insertion context
   * @returns {HTMLElement} Modal overlay element
   */
  createModalStructure(findings, originalText, insertionContext) {
    const detectedHtml = this.buildDetectedHTML(findings);
    const highlightedText = this.createHighlightedText(originalText, findings);
    const statusMessage = this.engineStatus.getStatusMessage();
    
    // Truncate display if text is very long
    const maxDisplayLength = 300;
    const truncated = originalText.length > maxDisplayLength;
    const displayText = truncated 
      ? this.createHighlightedText(originalText.substring(0, maxDisplayLength) + '...', findings)
      : highlightedText;

    const modalOverlay = document.createElement("div");
    modalOverlay.className = "modal-overlay";
    modalOverlay.innerHTML = `
      <div class="modal-content">
        <h2 class="modal-header">
          <span class="modal-icon">🛡️</span> 
          Data Leak Blocked
        </h2>
        <p class="modal-text">
          PrivacyWall prevented this paste because it contains sensitive information.
        </p>
        
        <div class="pasted-text-box">
          <div class="pasted-text-label">Your Pasted Text</div>
          <div class="pasted-text-content">${displayText}</div>
          ${truncated ? '<div class="pasted-text-hint">📝 Text truncated for display</div>' : ''}
        </div>
        
        <div class="detected-section">
          <div class="detected-label">Detected Sensitive Data</div>
          <ul class="detected-list">
            ${detectedHtml}
          </ul>
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
   * Builds HTML for detected items list with icons and values
   * @param {Array} findings - Detection findings
   * @returns {string} HTML string
   */
  buildDetectedHTML(findings) {
    return findings
      .map((f) => {
        const icon = getTypeIcon(f.type);
        const typeName = f.description || f.type;
        const value = f.value && f.value !== 'REDACTED' ? escapeHtml(f.value) : 'redacted';
        
        return `
          <li class="detected-item">
            <span class="detected-icon">${icon}</span>
            <span class="detected-type">${typeName}:</span>
            <span class="detected-value">${value}</span>
          </li>
        `;
      })
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

    // Shared cancel/escape logic
    const handleCancel = () => {
      // If paste already happened (AI scan case), we need to remove it
      if (pasteAlreadyInserted) {
        removeTextFromElement(originalText, insertionContext);
      }
      this.close();
    };

    if (cancelBtn) {
      cancelBtn.addEventListener("click", handleCancel);
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

    // ESC key to cancel - same behavior as cancel button
    this.keyDownHandler = (e) => {
      if (e.key === "Escape") {
        handleCancel();
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
