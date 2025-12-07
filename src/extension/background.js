// ============================================================================
// SERVICE WORKER - BACKGROUND SCRIPT
// ============================================================================
const ENGINE_URL = "http://127.0.0.1:8765";
let isEngineReachable = false;

// Check engine status immediately on startup
checkEngineStatus();

// Poll the engine status every 5 seconds
setInterval(checkEngineStatus, 5000);

async function checkEngineStatus() {
  let previousStatus = isEngineReachable;
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout
    
    const res = await fetch(`${ENGINE_URL}/health`, { 
      method: "GET",
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    isEngineReachable = res.ok;
    
    console.log(`Engine status: ${isEngineReachable ? 'ONLINE' : 'OFFLINE'}`);
  } catch (e) {
    console.warn("Engine check failed:", e.message);
    isEngineReachable = false;
  }
  
  // Always notify content scripts about status (even if unchanged)
  notifyContentScripts();
}

function notifyContentScripts() {
  chrome.tabs.query({}, (tabs) => {
    tabs.forEach((tab) => {
      chrome.tabs.sendMessage(tab.id, {
        type: "ENGINE_STATUS",
        reachable: isEngineReachable,
      }).catch((err) => {
        // Tab might not have content script loaded, this is normal
      });
    });
  });
}

// AI Scanning Function (communicates with local engine)
async function scanWithEngine(text) {
  if (!isEngineReachable) {
    return [];
  }
  
  try {
    const response = await fetch(`${ENGINE_URL}/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const data = await response.json();
    return data.entities || [];
  } catch (err) {
    console.warn("AI Engine error:", err);
    return [];
  }
}

// Handle messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "SCAN_TEXT") {
    scanWithEngine(request.text)
      .then(result => sendResponse({ success: true, data: result }))
      .catch(err => sendResponse({ success: false, error: err.message }));
    return true; // Keep channel open for async response
  }
  
  if (request.type === "GET_ENGINE_STATUS") {
    sendResponse({ reachable: isEngineReachable });
    return false;
  }
});