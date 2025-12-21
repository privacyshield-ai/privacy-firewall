// ============================================================================
// TYPING WARNING BANNER COMPONENT
// ============================================================================

import { DOM_IDS, CONFIG } from '../config.js';
import { getBannerStyles, getBannerCloseButtonStyles } from './styles.js';
import { Logger } from '../utils.js';

/**
 * Warning banner for typing detection
 */
export class TypingWarningBanner {
  constructor(findings) {
    this.findings = findings;
    this.banner = null;
    this.autoHideTimeout = null;
  }

  /**
   * Shows the warning banner
   */
  show() {
    try {
      // Remove existing banner if any
      TypingWarningBanner.removeExisting();

      // Create banner element
      this.banner = document.createElement('div');
      this.banner.id = DOM_IDS.BANNER;
      
      // Apply styles
      Object.assign(this.banner.style, getBannerStyles());

      // Set content
      const findingsText = this.findings.map(f => f.description).join(', ');
      this.banner.innerHTML = this.createBannerHTML(findingsText);

      // Append to body
      document.body.appendChild(this.banner);

      // Attach event handlers
      this.attachEventHandlers();

      // Set up auto-hide
      this.autoHide(CONFIG.BANNER_AUTO_HIDE_MS);
    } catch (error) {
      Logger.error('Failed to show typing warning banner:', error);
    }
  }

  /**
   * Creates the banner HTML structure
   * @param {string} findingsText - Comma-separated list of findings
   * @returns {string} HTML string
   */
  createBannerHTML(findingsText) {
    return `
      <div style="display: flex; align-items: center; gap: 12px; flex: 1;">
        <span style="font-size: 24px;">🛡️</span>
        <div>
          <strong style="font-size: 15px; color: ${CONFIG.COLORS.PRIMARY_DARK};">Sensitive Data Detected While Typing</strong><br>
          <small style="opacity: 0.7; color: ${CONFIG.COLORS.TEXT_SECONDARY};">${findingsText}</small>
        </div>
      </div>
      <button id="${DOM_IDS.BANNER_CLOSE}" title="Close">✕</button>
    `;
  }

  /**
   * Attaches event handlers to banner elements
   */
  attachEventHandlers() {
    if (!this.banner) return;

    const closeBtn = this.banner.querySelector(`#${DOM_IDS.BANNER_CLOSE}`);
    if (!closeBtn) return;

    // Apply close button styles
    Object.assign(closeBtn.style, getBannerCloseButtonStyles());

    // Hover effects
    closeBtn.addEventListener('mouseenter', () => {
      closeBtn.style.background = CONFIG.COLORS.HOVER_BG;
    });

    closeBtn.addEventListener('mouseleave', () => {
      closeBtn.style.background = 'transparent';
    });

    // Click to close
    closeBtn.addEventListener('click', () => {
      this.hide();
    });
  }

  /**
   * Hides the banner with animation
   */
  hide() {
    if (!this.banner || !this.banner.parentElement) return;

    // Clear auto-hide timeout
    if (this.autoHideTimeout) {
      clearTimeout(this.autoHideTimeout);
      this.autoHideTimeout = null;
    }

    // Animate out
    this.banner.style.transition = `transform ${CONFIG.ANIMATION_DURATION_MS}ms ease-out, opacity ${CONFIG.ANIMATION_DURATION_MS}ms`;
    this.banner.style.transform = 'translateY(-100%)';
    this.banner.style.opacity = '0';

    // Remove after animation
    setTimeout(() => {
      if (this.banner && this.banner.parentElement) {
        this.banner.remove();
        this.banner = null;
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
