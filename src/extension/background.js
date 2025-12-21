// ============================================================================
// SERVICE WORKER - BACKGROUND SCRIPT
// ============================================================================

import { PATTERNS, MESSAGE_TYPES } from './modules/config.js';

// Engine status tracking
let isModelReady = false;
let isModelLoading = false;

// ============================================================================
// OFFSCREEN DOCUMENT MANAGEMENT
// ============================================================================

const OFFSCREEN_DOCUMENT_PATH = 'offscreen.html';
let creatingOffscreenDocument = null;

async function hasOffscreenDocument() {
  // Use the chrome.offscreen API to check if document exists
  if (chrome.offscreen && chrome.offscreen.hasDocument) {
    return await chrome.offscreen.hasDocument();
  }
  
  // API not available, assume no document exists
  return false;
}

async function setupOffscreenDocument() {
  try {
    if (await hasOffscreenDocument()) {
      console.log('[PrivacyWall] Offscreen document already exists');
      return;
    }
  } catch (e) {
    // If check fails, try to create anyway
    console.log('[PrivacyWall] Could not check for existing document, attempting creation');
  }

  if (creatingOffscreenDocument) {
    await creatingOffscreenDocument;
    return;
  }

  try {
    creatingOffscreenDocument = chrome.offscreen.createDocument({
      url: OFFSCREEN_DOCUMENT_PATH,
      reasons: [chrome.offscreen.Reason.WORKERS],
      justification: 'Run AI model for PII detection'
    });

    await creatingOffscreenDocument;
    console.log('[PrivacyWall] Offscreen document created');
  } catch (err) {
    // If document already exists, that's fine
    if (err.message?.includes('single offscreen document')) {
      console.log('[PrivacyWall] Offscreen document already exists (caught)');
    } else {
      throw err;
    }
  } finally {
    creatingOffscreenDocument = null;
  }
}

// ============================================================================
// INITIALIZATION
// ============================================================================

// Setup offscreen document on startup
setupOffscreenDocument().catch(err => {
  console.error('[PrivacyWall] Failed to setup offscreen document:', err);
});

// ============================================================================
// LOCAL REGEX SCANNING
// ============================================================================

function scanLocally(text) {
  if (!text || typeof text !== 'string') {
    return [];
  }
  
  const findings = [];
  PATTERNS.forEach((pattern) => {
    if (pattern.regex.test(text)) {
      findings.push({ 
        type: pattern.type, 
        value: "REDACTED", 
        description: pattern.desc 
      });
    }
  });
  
  return findings;
}

// ============================================================================
// AI SCANNING (via Offscreen Document)
// ============================================================================

async function scanWithAI(text) {
  if (!isModelReady || !text) {
    console.log('[PrivacyWall] AI scan skipped - model not ready or no text');
    return [];
  }
  
  try {
    await setupOffscreenDocument();
    
    console.log('[PrivacyWall] Sending SCAN_WITH_AI request to offscreen...');
    
    const response = await chrome.runtime.sendMessage({
      type: 'SCAN_WITH_AI',
      text: text
    });
    
    console.log('[PrivacyWall] Got response from offscreen:', response);
    
    if (response && response.success) {
      return response.data || [];
    } else {
      console.warn('[PrivacyWall] AI scan error:', response?.error);
      return [];
    }
  } catch (err) {
    console.warn('[PrivacyWall] AI Engine error:', err);
    return [];
  }
}

// ============================================================================
// CONTENT SCRIPT NOTIFICATIONS
// ============================================================================

function notifyContentScripts() {
  console.log(`[PrivacyWall] Notifying content scripts - Ready: ${isModelReady}, Loading: ${isModelLoading}`);
  
  chrome.tabs.query({}, (tabs) => {
    console.log(`[PrivacyWall] Found ${tabs.length} tabs to notify`);
    
    tabs.forEach((tab) => {
      // Only send to http/https tabs (not chrome:// pages)
      if (tab.url && (tab.url.startsWith('http://') || tab.url.startsWith('https://'))) {
        chrome.tabs.sendMessage(tab.id, {
          type: MESSAGE_TYPES.ENGINE_STATUS,
          reachable: isModelReady,
          loading: isModelLoading,
        }).then(() => {
          console.log(`[PrivacyWall] Notified tab ${tab.id}: ${tab.url?.substring(0, 50)}`);
        }).catch((err) => {
          // Tab might not have content script loaded, this is normal
          // console.log(`[PrivacyWall] Could not notify tab ${tab.id}: ${err.message}`);
        });
      }
    });
  });
}

// ============================================================================
// MESSAGE HANDLERS
// ============================================================================

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // Status update from offscreen document
  if (request.type === 'OFFSCREEN_STATUS') {
    isModelReady = request.isReady;
    isModelLoading = request.isLoading;
    console.log(`[PrivacyWall] Engine status: ${isModelReady ? 'READY' : isModelLoading ? 'LOADING' : 'NOT LOADED'}`);
    notifyContentScripts();
    return false;
  }
  
  // Scan request from content script
  if (request.type === MESSAGE_TYPES.SCAN_TEXT) {
    console.log('[PrivacyWall] Received SCAN_TEXT request from content script');
    console.log('[PrivacyWall] Text to scan:', request.text);
    console.log('[PrivacyWall] isModelReady:', isModelReady);
    
    scanWithAI(request.text)
      .then(result => {
        console.log('[PrivacyWall] SCAN_TEXT result:', result);
        sendResponse({ success: true, data: result });
      })
      .catch(err => {
        console.error('[PrivacyWall] SCAN_TEXT error:', err);
        sendResponse({ success: false, error: err.message });
      });
    return true; // Keep channel open for async response
  }
  
  // Status request from content script - check with offscreen document for fresh status
  if (request.type === MESSAGE_TYPES.GET_ENGINE_STATUS) {
    // Try to get fresh status from offscreen document
    chrome.runtime.sendMessage({ type: 'GET_OFFSCREEN_STATUS' })
      .then((response) => {
        if (response) {
          isModelReady = response.isReady;
          isModelLoading = response.isLoading;
        }
        try {
          sendResponse({ 
            reachable: isModelReady,
            loading: isModelLoading 
          });
        } catch (e) {
          // Receiver may have disconnected (page reload)
        }
      })
      .catch(() => {
        // Offscreen might not be ready, use cached values
        try {
          sendResponse({ 
            reachable: isModelReady,
            loading: isModelLoading 
          });
        } catch (e) {
          // Receiver may have disconnected (page reload)
        }
      });
    return true; // Keep channel open for async response
  }
});