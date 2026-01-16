// ============================================================================
// TYPING WARNING BANNER COMPONENT
// ============================================================================

import { DOM_IDS, CONFIG } from '../config.js';
import { getBannerStyles, getBannerInnerStyles } from './styles.js';
import { getTypeIcon } from './icons.js';
import { removeTextFromElement, escapeHtml } from '../dom-utils.js';
import { Logger } from '../utils.js';
import { FirewallModal } from './modal.js';

/**
 * Warning banner for typing detection
 */
export class TypingWarningBanner {
  constructor(findings, originalText = '', insertionContext = null) {
    this.findings = findings;
    this.originalText = originalText;
    this.insertionContext = insertionContext;
    this.host = null;
    this.shadow = null;
    this.autoHideTimeout = null;
    this.onUndo = null;
  }

  /**
   * Shows the warning banner
   * @param {Function} onUndoCallback - Optional callback when Undo is clicked
   */
  show(onUndoCallback = null) {
    try {
      // Don't show banner if a modal is currently visible
      if (FirewallModal.isVisible()) {
        Logger.info('Skipping banner - modal is visible');
        return;
      }
      
      this.onUndo = onUndoCallback;
      
      // Remove existing banner if any
      TypingWarningBanner.removeExisting();

      // Create host element for Shadow DOM (isolates from page CSS)
      this.host = document.createElement('div');
      this.host.id = DOM_IDS.BANNER;
      
      // Apply outer styles to host
      Object.assign(this.host.style, getBannerStyles());
      
      // Attach Shadow DOM
      this.shadow = this.host.attachShadow({ mode: 'open' });
      
      // Inject inner styles
      const style = document.createElement('style');
      style.textContent = getBannerInnerStyles();
      this.shadow.appendChild(style);
      
      // Create content wrapper
      const content = document.createElement('div');
      content.style.cssText = 'display: flex; align-items: center; justify-content: space-between; width: 100%; gap: 16px;';
      content.innerHTML = this.createBannerHTML();
      this.shadow.appendChild(content);

      // Append to body
      document.body.appendChild(this.host);

      // Attach event handlers
      this.attachEventHandlers();

      // Set up auto-hide
      this.autoHide(CONFIG.BANNER_AUTO_HIDE_MS);
    } catch (error) {
      Logger.error('Failed to show typing warning banner:', error);
    }
  }

  /**
   * Creates the banner HTML structure with inline detected items
   * @returns {string} HTML string
   */
  createBannerHTML() {
    // Build inline findings with icons and values
    const inlineItems = this.findings.map(f => {
      const icon = getTypeIcon(f.type);
      const typeName = f.description || f.type;
      const value = f.value && f.value !== 'REDACTED' ? escapeHtml(f.value) : 'redacted';
      return `<span class="banner-item">${icon} ${typeName}: ${value}</span>`;
    }).join('');
    
    const hasUndoContext = this.originalText && this.insertionContext;

    return `
      <div class="banner-content">
        <span class="banner-shield">🛡️</span>
        <span class="banner-label">PrivacyWall detected:</span>
        <span class="banner-items">${inlineItems}</span>
      </div>
      <div class="banner-actions">
        ${hasUndoContext ? `<button id="${DOM_IDS.BANNER_UNDO}" class="banner-btn banner-undo">Undo</button>` : ''}
        <button id="${DOM_IDS.BANNER_CLOSE}" class="banner-btn banner-close" title="Close">✕</button>
      </div>
    `;
  }

  /**
   * Attaches event handlers to banner elements
   */
  attachEventHandlers() {
    if (!this.shadow) return;

    const closeBtn = this.shadow.getElementById(DOM_IDS.BANNER_CLOSE);
    const undoBtn = this.shadow.getElementById(DOM_IDS.BANNER_UNDO);

    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        this.hide();
      });
    }
    
    if (undoBtn) {
      undoBtn.addEventListener('click', () => {
        // Remove the detected text
        if (this.originalText && this.insertionContext) {
          removeTextFromElement(this.originalText, this.insertionContext);
        }
        
        // Call undo callback if provided
        if (this.onUndo) {
          this.onUndo();
        }
        
        this.hide();
      });
    }
  }

  /**
   * Hides the banner with animation
   */
  hide() {
    if (!this.host || !this.host.parentElement) return;

    // Clear auto-hide timeout
    if (this.autoHideTimeout) {
      clearTimeout(this.autoHideTimeout);
      this.autoHideTimeout = null;
    }

    // Animate out
    this.host.style.transition = `transform ${CONFIG.ANIMATION_DURATION_MS}ms ease-out, opacity ${CONFIG.ANIMATION_DURATION_MS}ms`;
    this.host.style.transform = 'translateY(-100%)';
    this.host.style.opacity = '0';

    // Remove after animation
    setTimeout(() => {
      if (this.host && this.host.parentElement) {
        this.host.remove();
        this.host = null;
        this.shadow = null;
      }
    }, CONFIG.ANIMATION_DURATION_MS);
  }

  /**
   * Sets up auto-hide after specified delay
   * @param {number} delay - Delay in milliseconds
   */
  autoHide(delay) {
    this.autoHideTimeout = setTimeout(() => {
      this.hide();
    }, delay);
  }

  /**
   * Static method to remove any existing banner
   */
  static removeExisting() {
    const existingBanner = document.getElementById(DOM_IDS.BANNER);
    if (existingBanner) {
      existingBanner.remove();
    }
  }
}
