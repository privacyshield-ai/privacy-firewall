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
      padding: 28px;
      width: ${CONFIG.MODAL_WIDTH};
      max-width: 90%;
      color: ${CONFIG.COLORS.TEXT_PRIMARY};
    }
    
    .modal-header {
      margin-top: 0;
      color: ${CONFIG.COLORS.PRIMARY_DARK};
      display: flex;
      align-items: center;
      font-size: 20px;
      font-weight: 500;
    }
    
    .modal-icon {
      font-size: 24px;
      margin-right: 10px;
    }
    
    .modal-text {
      color: ${CONFIG.COLORS.TEXT_SECONDARY};
      font-size: 14px;
      line-height: 1.6;
      margin: 12px 0;
    }
    
    .findings-list {
      margin: 16px 0;
      max-height: ${CONFIG.MODAL_MAX_HEIGHT};
      overflow-y: auto;
    }
    
    .finding-item {
      background: ${CONFIG.COLORS.PRIMARY_LIGHT};
      padding: 10px 12px;
      margin: 6px 0;
      border-left: 4px solid ${CONFIG.COLORS.PRIMARY};
      font-size: 13px;
      border-radius: 4px;
    }
    
    .finding-type {
      color: ${CONFIG.COLORS.PRIMARY_DARKER};
      font-weight: 500;
    }
    
    .button-container {
      display: flex;
      gap: 10px;
      margin-top: 24px;
    }
    
    .btn {
      flex: 1;
      padding: 11px 16px;
      border-radius: 6px;
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
      font-size: 11px;
      color: ${CONFIG.COLORS.TEXT_SECONDARY};
      text-align: center;
    }
  `;
}

/**
 * Returns style object for banner
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
    padding: '16px 20px',
    boxShadow: '0 4px 12px rgba(66, 133, 244, 0.3)',
    borderBottom: `3px solid ${CONFIG.COLORS.PRIMARY}`,
    zIndex: String(CONFIG.BANNER_Z_INDEX),
    fontFamily: CONFIG.FONT_FAMILY,
    fontSize: '14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    animation: 'slideDown 0.5s ease-out'
  };
}

/**
 * Returns style object for banner close button
 * @returns {Object} Style object for close button
 */
export function getBannerCloseButtonStyles() {
  return {
    background: 'transparent',
    border: 'none',
    color: CONFIG.COLORS.TEXT_SECONDARY,
    fontSize: '24px',
    cursor: 'pointer',
    padding: '0',
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '4px',
    transition: 'background 0.2s'
  };
}
