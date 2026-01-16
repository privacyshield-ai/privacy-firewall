// ============================================================================
// UI STYLES
// ============================================================================

import { CONFIG } from '../config.js';

/**
 * Global CSS animations that need to be injected once
 */
export const GLOBAL_ANIMATIONS = `
  @keyframes slideDown {
    from {
      transform: translateY(-100%);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }
`;

/**
 * Injects global styles into the document
 */
export function injectGlobalStyles() {
  if (document.getElementById('privacy-wall-global-styles')) {
    return; // Already injected
  }
  
  const style = document.createElement('style');
  style.id = 'privacy-wall-global-styles';
  style.textContent = GLOBAL_ANIMATIONS;
  document.head.appendChild(style);
}

/**
 * Generates CSS for the firewall modal (Shadow DOM scoped)
 * @returns {string} CSS string for modal
 */
export function getModalStyles() {
  return `
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.85);
      backdrop-filter: blur(5px);
      z-index: ${CONFIG.MODAL_Z_INDEX};
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: ${CONFIG.FONT_FAMILY};
    }
    
    .modal-content {
      background-color: ${CONFIG.COLORS.BACKGROUND};
      border: 2px solid ${CONFIG.COLORS.PRIMARY};
      box-shadow: 0 4px 24px rgba(66, 133, 244, 0.3);
      border-radius: 12px;
      padding: 24px;
      width: 500px;
      max-width: 90%;
      max-height: 90vh;
      overflow-y: auto;
      color: ${CONFIG.COLORS.TEXT_PRIMARY};
    }
    
    .modal-header {
      margin: 0 0 8px 0;
      color: ${CONFIG.COLORS.PRIMARY_DARK};
      display: flex;
      align-items: center;
      font-size: 18px;
      font-weight: 600;
    }
    
    .modal-icon {
      font-size: 20px;
      margin-right: 8px;
    }
    
    .modal-text {
      color: ${CONFIG.COLORS.TEXT_SECONDARY};
      font-size: 14px;
      line-height: 1.5;
      margin: 0 0 16px 0;
    }
    
    /* Pasted text preview box */
    .pasted-text-box {
      background: ${CONFIG.COLORS.BACKGROUND_SECONDARY};
      border: 1px solid ${CONFIG.COLORS.BORDER};
      border-radius: 8px;
      padding: 12px;
      margin-bottom: 16px;
    }
    
    .pasted-text-label {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: ${CONFIG.COLORS.TEXT_SECONDARY};
      margin-bottom: 8px;
    }
    
    .pasted-text-content {
      font-size: 13px;
      line-height: 1.6;
      color: ${CONFIG.COLORS.TEXT_PRIMARY};
      word-break: break-word;
      white-space: pre-wrap;
    }
    
    .pasted-text-content .highlight {
      background: #fef3c7;
      color: #92400e;
      padding: 1px 4px;
      border-radius: 3px;
      font-weight: 500;
    }
    
    .pasted-text-hint {
      font-size: 11px;
      color: ${CONFIG.COLORS.TEXT_TERTIARY};
      margin-top: 8px;
      display: flex;
      align-items: center;
      gap: 4px;
    }
    
    /* Detected items section */
    .detected-section {
      margin-bottom: 20px;
    }
    
    .detected-label {
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: ${CONFIG.COLORS.TEXT_SECONDARY};
      margin-bottom: 8px;
    }
    
    .detected-list {
      list-style: none;
      margin: 0;
      padding: 0;
    }
    
    .detected-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 0;
      font-size: 13px;
      border-bottom: 1px solid ${CONFIG.COLORS.BORDER};
    }
    
    .detected-item:last-child {
      border-bottom: none;
    }
    
    .detected-icon {
      font-size: 16px;
    }
    
    .detected-type {
      color: ${CONFIG.COLORS.TEXT_SECONDARY};
      min-width: 80px;
    }
    
    .detected-value {
      color: ${CONFIG.COLORS.TEXT_PRIMARY};
      font-family: monospace;
      background: ${CONFIG.COLORS.BACKGROUND_SECONDARY};
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 12px;
    }
    
    .button-container {
      display: flex;
      gap: 10px;
      margin-top: 20px;
    }
    
    .btn {
      flex: 1;
      padding: 12px 16px;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 600;
      font-family: ${CONFIG.FONT_FAMILY};
      font-size: 14px;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }
    
    .btn:hover {
      transform: translateY(-1px);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    }
    
    .btn-cancel {
      background: ${CONFIG.COLORS.PRIMARY_DARK};
      color: ${CONFIG.COLORS.BACKGROUND};
      border: none;
    }
    
    .btn-cancel:hover {
      background: ${CONFIG.COLORS.PRIMARY_HOVER};
    }
    
    .btn-override {
      background: ${CONFIG.COLORS.BACKGROUND};
      color: ${CONFIG.COLORS.DANGER};
      border: 1px solid ${CONFIG.COLORS.DANGER_BORDER};
    }
    
    .btn-override:hover {
      background: ${CONFIG.COLORS.DANGER_LIGHT};
      border-color: ${CONFIG.COLORS.DANGER_HOVER};
    }
    
    .status-bar {
      margin-top: 16px;
      padding-top: 12px;
      border-top: 1px solid ${CONFIG.COLORS.BORDER};
      font-size: 11px;
      color: ${CONFIG.COLORS.TEXT_TERTIARY};
      text-align: center;
    }
  `;
}

/**
 * Returns style object for banner (inline style for direct DOM insertion)
 * @returns {Object} Style object for banner
 */
export function getBannerStyles() {
  return {
    position: 'fixed',
    top: '0',
    left: '0',
    right: '0',
    backgroundColor: CONFIG.COLORS.BACKGROUND,
    color: CONFIG.COLORS.TEXT_PRIMARY,
    padding: '12px 20px',
    boxShadow: '0 4px 12px rgba(66, 133, 244, 0.25)',
    borderBottom: `2px solid ${CONFIG.COLORS.PRIMARY}`,
    zIndex: String(CONFIG.BANNER_Z_INDEX),
    fontFamily: CONFIG.FONT_FAMILY,
    fontSize: '14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '16px',
    animation: 'slideDown 0.3s ease-out'
  };
}

/**
 * Returns CSS string for banner internal elements (injected via <style>)
 * @returns {string} CSS string
 */
export function getBannerInnerStyles() {
  return `
    .banner-content {
      display: flex;
      align-items: center;
      gap: 10px;
      flex: 1;
      flex-wrap: wrap;
    }
    
    .banner-shield {
      font-size: 20px;
    }
    
    .banner-label {
      font-weight: 600;
      color: ${CONFIG.COLORS.PRIMARY_DARK};
      font-size: 14px;
    }
    
    .banner-items {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }
    
    .banner-item {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      background: ${CONFIG.COLORS.PRIMARY_LIGHT};
      padding: 4px 10px;
      border-radius: 16px;
      font-size: 13px;
      color: ${CONFIG.COLORS.PRIMARY_DARKER};
      font-weight: 500;
    }
    
    .banner-actions {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .banner-btn {
      padding: 6px 12px;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 600;
      font-family: inherit;
      font-size: 13px;
      transition: all 0.2s;
      border: none;
    }
    
    .banner-undo {
      background: ${CONFIG.COLORS.BACKGROUND};
      color: ${CONFIG.COLORS.PRIMARY_DARK};
      border: 1px solid ${CONFIG.COLORS.PRIMARY};
    }
    
    .banner-undo:hover {
      background: ${CONFIG.COLORS.PRIMARY_LIGHT};
    }
    
    .banner-close {
      background: transparent;
      color: ${CONFIG.COLORS.TEXT_SECONDARY};
      font-size: 18px;
      padding: 4px 8px;
    }
    
    .banner-close:hover {
      background: ${CONFIG.COLORS.HOVER_BG};
      color: ${CONFIG.COLORS.TEXT_PRIMARY};
    }
  `;
}

