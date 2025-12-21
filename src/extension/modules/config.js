// ============================================================================
// CONFIGURATION CONSTANTS
// ============================================================================

/**
 * Main configuration object for the extension
 */
export const CONFIG = {
  // Modal settings
  MODAL_Z_INDEX: 2147483647,
  MODAL_WIDTH: "450px",
  MODAL_MAX_HEIGHT: "150px",
  
  // Banner settings
  BANNER_Z_INDEX: 2147483646,
  BANNER_AUTO_HIDE_MS: 8000,
  
  // Timing settings
  DEBOUNCE_DELAY_MS: 300,
  
  // Animation settings
  ANIMATION_DURATION_MS: 300,
  
  // Colors
  COLORS: {
    PRIMARY: '#4285f4',
    PRIMARY_HOVER: '#1765cc',
    PRIMARY_DARK: '#1a73e8',
    PRIMARY_DARKER: '#1967d2',
    PRIMARY_LIGHT: '#e8f0fe',
    DANGER: '#dc2626',
    DANGER_HOVER: '#ef4444',
    DANGER_LIGHT: '#fef2f2',
    DANGER_BORDER: '#fca5a5',
    SUCCESS: '#34a853',
    TEXT_PRIMARY: '#202124',
    TEXT_SECONDARY: '#5f6368',
    TEXT_TERTIARY: '#9aa0a6',
    BACKGROUND: '#fff',
    HOVER_BG: '#f1f3f4',
  },
  
  // Font settings
  FONT_FAMILY: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
};

/**
 * DOM element IDs used throughout the extension
 */
export const DOM_IDS = {
  MODAL_HOST: 'privacy-wall-host',
  MODAL_CANCEL: 'pw-cancel',
  MODAL_OVERRIDE: 'pw-override',
  BANNER: 'privacy-wall-banner',
  BANNER_CLOSE: 'privacy-banner-close',
};

/**
 * SVG icons used in the UI
 */
export const ICONS = {
  warning: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path><path d="M12 9v4"></path><path d="M12 17h.01"></path></svg>`,
  
  shield: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>`,
};

/**
 * Regex patterns for detecting sensitive data locally
 */
export const PATTERNS = [
  {
    type: "email",
    regex: /[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+/,
    desc: "Email Address",
  },
  {
    type: "phone_number",
    regex: /(\+\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/,
    desc: "Phone Number",
  },
  {
    type: "mac_address",
    regex: /\b([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})\b/,
    desc: "MAC Address",    
  },
  {
    type: "aws_key",
    regex: /AKIA[0-9A-Z]{16}/,
    desc: "AWS Access Key",
  },
  {
    type: "private_key",
    regex: /-----BEGIN (RSA )?PRIVATE KEY-----/,
    desc: "Private SSH/RSA Key",
  },
  {
    type: "ip_address",
    regex: /\b(?:\d{1,3}\.){3}\d{1,3}\b/,
    desc: "IP Address",
  },
  {
    type: "credit_card",
    regex: /\b(?:\d[ -]*?){13,16}\b/,
    desc: "Credit Card Number",
  },
  {
    type: "ssn",
    regex: /\b\d{3}-\d{2}-\d{4}\b/,
    desc: "US Social Security Number",
  },
  {
    type: "api_key",
    regex: /\b[0-9a-fA-F]{32,64}\b/,
    desc: "Generic API Key / Hash",
  },
  {
    type: "jwt",
    regex: /\beyJ[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\b/,
    desc: "JWT Token",
  },
];

/**
 * Message types for communication with background script
 */
export const MESSAGE_TYPES = {
  GET_ENGINE_STATUS: 'GET_ENGINE_STATUS',
  ENGINE_STATUS: 'ENGINE_STATUS',
  SCAN_TEXT: 'SCAN_TEXT',
};
