// ============================================================================
// CONTENT SCRIPT FOR PRIVACYWALL EXTENSION
// ============================================================================

// Add CSS animation for banner
const style = document.createElement('style');
style.textContent = `
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
document.head.appendChild(style);

const CONFIG = {
  MODAL_Z_INDEX: 2147483647,
  MODAL_WIDTH: "450px",
  MODAL_MAX_HEIGHT: "150px",
};

// Clean Line-Art Icons (SVG)
const ICONS = {
  trash: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>`,
  
  warning: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path><path d="M12 9v4"></path><path d="M12 17h.01"></path></svg>`,
  
  shield: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>`
};


let isEngineReachable = false;

// Request initial engine status from background script
chrome.runtime.sendMessage({ type: "GET_ENGINE_STATUS" }, (response) => {
  if (response) {
    isEngineReachable = response.reachable;
    console.log(`Initial engine status: ${isEngineReachable ? 'ONLINE ✓' : 'OFFLINE ✗'}`);
  }
});

// Listen for engine status updates from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "ENGINE_STATUS") {
    const wasReachable = isEngineReachable;
    isEngineReachable = message.reachable;
    
    // Log status changes
    if (wasReachable !== isEngineReachable) {
      console.log(`Engine status changed: ${isEngineReachable ? 'ONLINE ✓' : 'OFFLINE ✗'}`);
    }
  }
});

// ============================================================================
// REGEX PATTERNS FOR LOCAL SCANNING
// ============================================================================
const PATTERNS = [
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

// ============================================================================
// SCANNING FUNCTIONS
// ============================================================================

/**
 * Scans text locally using regex patterns (instant, no network)
 * @param {string} text - Text to scan
 * @returns {Array} Array of findings
 */
function scanLocally(text) {
  if (!text || typeof text !== 'string') {
    return [];
  }
  
  const findings = [];
  PATTERNS.forEach((p) => {
    if (p.regex.test(text)) {
      findings.push({ 
        type: p.type, 
        value: "REDACTED", 
        description: p.desc 
      });
    }
  });
  return findings;
}

/**
 * Scans text using AI engine via background script
 * @param {string} text - Text to scan
 * @returns {Promise<Array>} Promise resolving to array of findings
 */
async function scanWithAI(text) {
  if (!isEngineReachable || !text) {
    return [];
  }
  
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(
      { type: "SCAN_TEXT", text: text },
      (response) => {
        if (chrome.runtime.lastError) {
          console.warn("AI scan failed:", chrome.runtime.lastError.message);
          resolve([]);
          return;
        }
        
        if (response && response.success) {
          resolve(response.data || []);
        } else {
          console.warn("AI scan error:", response?.error);
          resolve([]);
        }
      }
    );
  });
}

// ============================================================================
// UI MODAL FOR FIREWALL (Using Shadow DOM)
// ============================================================================

function createInsertionContext(e) {
  const target = e?.target;
  if (!target) return null;
  
  if (target.tagName === "TEXTAREA" || target.tagName === "INPUT") {
    return {
      type: "input",
      node: target,
      start: target.selectionStart || 0,
      end: target.selectionEnd || 0
    };
  }
  
  if (target.isContentEditable) {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      return {
        type: "contentEditable",
        node: target,
        range: selection.getRangeAt(0).cloneRange()
      };
    }
  }
  return null;
}

/**
 * Shows a firewall modal using Shadow DOM for CSS isolation
 * @param {Array} findings - Array of detected sensitive data
 * @param {string} originalText - The original text that was blocked
 * @param {Object|null} insertionContext - Saved cursor/selection context from the paste target
 */
function showFirewallModal(findings, originalText, insertionContext = null) {
  // Remove existing modal if any
  const existingHost = document.getElementById("privacy-wall-host");
  if (existingHost) {
    existingHost.remove();
  }

  // Create host element for Shadow DOM
  const host = document.createElement("div");
  host.id = "privacy-wall-host";
  document.body.appendChild(host);

  // Attach Shadow DOM (isolates from page CSS)
  const shadow = host.attachShadow({ mode: "open" });

  // Create styles (scoped to shadow DOM)
  const style = document.createElement("style");
  style.textContent = `
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
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    
    .modal-content {
      background-color: #fff;
      border: 2px solid #4285f4;
      box-shadow: 0 4px 24px rgba(66, 133, 244, 0.3);
      border-radius: 12px;
      padding: 28px;
      width: ${CONFIG.MODAL_WIDTH};
      max-width: 90%;
      color: #202124;
    }
    
    .modal-header {
      margin-top: 0;
      color: #1a73e8;
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
      color: #5f6368;
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
      background: #e8f0fe;
      padding: 10px 12px;
      margin: 6px 0;
      border-left: 4px solid #4285f4;
      font-size: 13px;
      border-radius: 4px;
    }
    
    .finding-type {
      color: #1967d2;
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
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
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
      background: #1a73e8;
      color: #fff;
      border: none;
    }
    
    .btn-cancel:hover {
      background: #1765cc;
    }
    
    .btn-override {
      background: #fff;
      color: #dc2626;
      border: 1px solid #fca5a5;
    }
    
    .btn-override:hover {
      background: #fef2f2;
      border-color: #ef4444;
    }
    
    .status-bar {
      margin-top: 16px;
      font-size: 11px;
      color: #5f6368;
      text-align: center;
    }
  `;

  // Build findings HTML
  const findingsHtml = findings
    .map(
      (f) =>
        `<div class="finding-item">
          <strong class="finding-type">${f.description || f.type.toUpperCase()}</strong> detected
        </div>`
    )
    .join("");

  // Create modal structure
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
        <button id="pw-cancel" class="btn btn-cancel">
          ${ICONS.shield}
          <span>Keep Safe</span>
        </button>
        <button id="pw-override" class="btn btn-override">
          ${ICONS.warning}
          <span>Paste Anyway</span>
        </button>
      </div>
      <div class="status-bar">
        ${isEngineReachable ? '<span style="color: #34a853;">● Local AI Engine Online</span>' : '<span style="color: #9aa0a6;">● Local AI Offline (Regex Mode Only)</span>'}
      </div>
    </div>
  `;

  // Append to shadow DOM
  shadow.appendChild(style);
  shadow.appendChild(modalOverlay);

  // Button event handlers
  const cancelBtn = shadow.getElementById("pw-cancel");
  const overrideBtn = shadow.getElementById("pw-override");
  
  const cleanup = () => {
    host.remove();
  };
  
  cancelBtn.addEventListener("click", cleanup);
  
  overrideBtn.addEventListener("click", () => {
    cleanup();
    insertTextAtCursor(originalText, insertionContext);
  });
  
  // ESC key to cancel
  const handleKeyDown = (e) => {
    if (e.key === "Escape") {
      cleanup();
      document.removeEventListener("keydown", handleKeyDown);
    }
  };
  document.addEventListener("keydown", handleKeyDown);
}


/**
 * Inserts text at the current cursor position using modern APIs
 * @param {string} text - Text to insert
 */
function insertTextAtCursor(text, context = null) {
  if (context?.type === "input" && context.node?.isConnected) {
    const input = context.node;
    input.focus();
    const start = context.start ?? input.selectionStart ?? 0;
    const end = context.end ?? input.selectionEnd ?? start;
    const value = input.value || "";
    input.value = value.substring(0, start) + text + value.substring(end);
    const newPosition = start + text.length;
    input.selectionStart = newPosition;
    input.selectionEnd = newPosition;
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
    return;
  }

  if (context?.type === "contentEditable" && context.node?.isConnected && context.range) {
    const selection = window.getSelection();
    const range = context.range.cloneRange();
    context.node.focus();
    selection.removeAllRanges();
    selection.addRange(range);
    range.deleteContents();
    const textNode = document.createTextNode(text);
    range.insertNode(textNode);
    range.setStartAfter(textNode);
    range.setEndAfter(textNode);
    selection.removeAllRanges();
    selection.addRange(range);
    context.node.dispatchEvent(new Event("input", { bubbles: true }));
    return;
  }

  const activeElement = document.activeElement;
  if (!activeElement) return;

  if (activeElement.tagName === "TEXTAREA" || activeElement.tagName === "INPUT") {
    const start = activeElement.selectionStart || 0;
    const end = activeElement.selectionEnd || 0;
    const value = activeElement.value || "";
    activeElement.value = value.substring(0, start) + text + value.substring(end);
    const newPosition = start + text.length;
    activeElement.selectionStart = newPosition;
    activeElement.selectionEnd = newPosition;
    activeElement.dispatchEvent(new Event("input", { bubbles: true }));
    activeElement.dispatchEvent(new Event("change", { bubbles: true }));
  } else if (activeElement.isContentEditable) {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      range.deleteContents();
      const textNode = document.createTextNode(text);
      range.insertNode(textNode);
      range.setStartAfter(textNode);
      range.setEndAfter(textNode);
      selection.removeAllRanges();
      selection.addRange(range);
      activeElement.dispatchEvent(new Event("input", { bubbles: true }));
    }
  }
}

// ============================================================================
// DEBOUNCE HELPER
// ============================================================================
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// ============================================================================
// INPUT MONITORING (TYPING DETECTION)
// ============================================================================

/**
 * Scans input field content after user stops typing
 * @param {Event} e - Input event
 */
const handleInputChange = debounce(async (e) => {
  const target = e.target;
  
  // Get current value from input field
  let text = '';
  if (target.tagName === 'TEXTAREA' || target.tagName === 'INPUT') {
    text = target.value;
  } else if (target.isContentEditable) {
    text = target.textContent || target.innerText;
  }
  
  if (!text || text.trim() === '') {
    return;
  }
  
  console.log("⌨️  INPUT SCAN - Text length:", text.length);
  
  // Scan locally
  const localFindings = scanLocally(text);
  
  if (localFindings.length > 0) {
    console.warn("🚨 Sensitive data detected while typing!");
    // Show warning (non-blocking, just notification)
    showTypingWarning(localFindings);
  }
}, 300); // Wait 300ms after user stops typing

/**
 * Shows a banner warning at the top for typing detection
 * @param {Array} findings - Detected sensitive data
 */
function showTypingWarning(findings) {
  // Remove existing banner if any
  const existingBanner = document.getElementById('privacy-wall-banner');
  if (existingBanner) {
    existingBanner.remove();
  }
  
  const banner = document.createElement('div');
  banner.id = 'privacy-wall-banner';
  Object.assign(banner.style, {
    position: 'fixed',
    top: '0',
    left: '0',
    right: '0',
    backgroundColor: '#fff',
    color: '#202124',
    padding: '16px 20px',
    boxShadow: '0 4px 12px rgba(66, 133, 244, 0.3)',
    borderBottom: '3px solid #4285f4',
    zIndex: '2147483646',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontSize: '14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    animation: 'slideDown 0.5s ease-out'
  });
  
  const findingsText = findings.map(f => f.description).join(', ');
  banner.innerHTML = `
    <div style="display: flex; align-items: center; gap: 12px; flex: 1;">
      <span style="font-size: 24px;">🛡️</span>
      <div>
        <strong style="font-size: 15px; color: #1a73e8;">Sensitive Data Detected While Typing</strong><br>
        <small style="opacity: 0.7; color: #5f6368;">${findingsText}</small>
      </div>
    </div>
    <button id="privacy-banner-close" style="
      background: transparent;
      border: none;
      color: #5f6368;
      font-size: 24px;
      cursor: pointer;
      padding: 0;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 4px;
      transition: background 0.2s;
    " title="Close">✕</button>
  `;
  
  document.body.appendChild(banner);
  
  // Close button handler
  const closeBtn = banner.querySelector('#privacy-banner-close');
  closeBtn.addEventListener('mouseenter', () => {
    closeBtn.style.background = '#f1f3f4';
  });
  closeBtn.addEventListener('mouseleave', () => {
    closeBtn.style.background = 'transparent';
  });
  closeBtn.addEventListener('click', () => {
    banner.style.transition = 'transform 0.3s ease-out, opacity 0.3s';
    banner.style.transform = 'translateY(-100%)';
    banner.style.opacity = '0';
    setTimeout(() => banner.remove(), 300);
  });
  
  // Auto-remove after 8 seconds
  setTimeout(() => {
    if (banner.parentElement) {
      banner.style.transition = 'transform 0.3s ease-out, opacity 0.3s';
      banner.style.transform = 'translateY(-100%)';
      banner.style.opacity = '0';
      setTimeout(() => banner.remove(), 300);
    }
  }, 8000);
}

// Add input event listener for typing detection
document.addEventListener('input', handleInputChange, true);

// ============================================================================
// MAIN PASTE EVENT LISTENER
// ============================================================================

document.addEventListener("paste", async (e) => {
  console.log("🎯 PASTE EVENT DETECTED!");
  
  // Get pasted text from clipboard
  const pastedText = (e.clipboardData || window.clipboardData)?.getData("text");
  console.log("📋 Pasted text:", pastedText);
  
  // Validate input
  if (!pastedText || typeof pastedText !== "string" || pastedText.trim() === "") {
    console.log("❌ No text or invalid input");
    return;
  }

  // STEP 1: Instant local regex scan (synchronous, no network)
  const localFindings = scanLocally(pastedText);
  const insertionContext = createInsertionContext(e);
  console.log("🔍 Local scan findings:", localFindings);

  // If regex detects sensitive data, block immediately
  if (localFindings.length > 0) {
    e.preventDefault();
    e.stopPropagation();
    showFirewallModal(localFindings, pastedText, insertionContext);
    return;
  }

  // STEP 2: Optional AI scan in background (async, non-blocking)
  // Note: We allow the paste to proceed, but scan in background for additional detection
  // This provides a better user experience while still catching AI-detected patterns
  if (isEngineReachable) {
    scanWithAI(pastedText).then((aiFindings) => {
      if (aiFindings && aiFindings.length > 0) {
        // AI detected something after paste - show warning
        console.warn("⚠️ PrivacyWall: AI detected sensitive data in pasted content");
        showFirewallModal(aiFindings, pastedText, insertionContext);
      }
    }).catch((err) => {
      console.warn("PrivacyWall AI scan error:", err);
    });
  }
}, true); // Use capture phase to intercept before other handlers

//cleanup on unload
window.addEventListener("unload", () => {
  // Clean up any remaining modals and banners
  const host = document.getElementById("privacy-wall-host");
  if (host) {
    host.remove();
  }
  
  const banner = document.getElementById("privacy-wall-banner");
  if (banner) {
    banner.remove();
  }
});
