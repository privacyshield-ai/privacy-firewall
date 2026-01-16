// ============================================================================
// OFFSCREEN DOCUMENT - AI Model Runner
// ============================================================================
// This runs in an offscreen document which has full Web API access (XMLHttpRequest, etc.)
// Required because Service Workers don't support WASM with XMLHttpRequest

import { initializeModel, detectEntities } from './lib/transformer-detector.js';

let isModelReady = false;
let isModelLoading = false;

// Initialize model when offscreen document loads
async function initialize() {
  if (isModelReady || isModelLoading) return;
  
  isModelLoading = true;
  notifyStatus();
  
  try {
    let lastFile = '';
    let filesLoaded = 0;
    
    await initializeModel((progress) => {
      // progress object contains: status, name, file, progress, loaded, total
      const fileName = progress.file || progress.name || 'model';
      const percent = Math.round(progress.progress || 0);
      const status = progress.status || 'loading';
      
      // Track when a new file starts
      if (fileName !== lastFile) {
        if (lastFile) filesLoaded++;
        lastFile = fileName;
        console.log(`[PrivacyWall Offscreen] Loading: ${fileName}`);
      }
      
      // Only log significant progress updates (every 25%) to reduce noise
      if (status === 'done') {
        console.log(`[PrivacyWall Offscreen] ✓ Loaded: ${fileName}`);
      } else if (percent % 25 === 0 && percent > 0) {
        console.log(`[PrivacyWall Offscreen] ${fileName}: ${percent}%`);
      }
    });
    isModelReady = true;
    console.log('[PrivacyWall Offscreen] ✅ Model fully loaded: READY');
  } catch (error) {
    console.error('[PrivacyWall Offscreen] ❌ Model loading failed:', error);
    isModelReady = false;
  } finally {
    isModelLoading = false;
    notifyStatus();
  }
}

// Notify background script of status changes
function notifyStatus() {
  chrome.runtime.sendMessage({
    type: 'OFFSCREEN_STATUS',
    isReady: isModelReady,
    isLoading: isModelLoading
  }).catch(() => {
    // Background might not be ready yet
  });
}

// Handle messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[PrivacyWall Offscreen] Received message:', message.type);
  
  if (message.type === 'SCAN_WITH_AI') {
    console.log('[PrivacyWall Offscreen] Processing SCAN_WITH_AI for text:', message.text);
    
    if (!isModelReady) {
      console.log('[PrivacyWall Offscreen] Model not ready, returning error');
      sendResponse({ success: false, error: 'Model not ready' });
      return false;
    }
    
    detectEntities(message.text)
      .then(entities => {
        console.log('[PrivacyWall Offscreen] Scan complete, entities:', entities);
        sendResponse({ success: true, data: entities });
      })
      .catch(error => {
        console.error('[PrivacyWall Offscreen] Scan error:', error);
        sendResponse({ success: false, error: error.message });
      });
    
    return true; // Keep channel open for async response
  }
  
  if (message.type === 'GET_OFFSCREEN_STATUS') {
    sendResponse({
      isReady: isModelReady,
      isLoading: isModelLoading
    });
    return false;
  }
  
  if (message.type === 'INITIALIZE_MODEL') {
    initialize();
    sendResponse({ success: true });
    return false;
  }
});

// Start initialization
initialize();
