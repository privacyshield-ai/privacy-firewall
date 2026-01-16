// ============================================================================
// POPUP SCRIPT - PrivacyWall
// ============================================================================

document.addEventListener('DOMContentLoaded', async () => {
  const aiStatusEl = document.getElementById('ai-status');
  const siteStatusEl = document.getElementById('site-status');
  const settingsBtn = document.getElementById('settings-btn');
  
  // Settings button - opens settings page
  if (settingsBtn) {
    settingsBtn.addEventListener('click', () => {
      chrome.runtime.openOptionsPage();
    });
  }
  
  // Get AI engine status
  try {
    chrome.runtime.sendMessage({ type: 'GET_ENGINE_STATUS' }, (response) => {
      if (chrome.runtime.lastError) {
        aiStatusEl.textContent = 'Unknown';
        aiStatusEl.className = 'status-value offline';
        return;
      }
      
      if (response?.reachable) {
        aiStatusEl.textContent = 'Ready';
        aiStatusEl.className = 'status-value ready';
      } else if (response?.loading) {
        aiStatusEl.textContent = 'Loading...';
        aiStatusEl.className = 'status-value loading';
      } else {
        aiStatusEl.textContent = 'Regex Only';
        aiStatusEl.className = 'status-value offline';
      }
    });
  } catch (e) {
    aiStatusEl.textContent = 'Error';
    aiStatusEl.className = 'status-value offline';
  }
  
  // Check if current site is protected
  try {
    // Load settings directly from storage
    const result = await chrome.storage.sync.get(['privacywall_settings']);
    const settings = result.privacywall_settings || {
      protectAllSites: false,
      protectedSites: {
        'chat.openai.com': { enabled: true },
        'chatgpt.com': { enabled: true },
        'claude.ai': { enabled: true },
        'gemini.google.com': { enabled: true },
        'copilot.microsoft.com': { enabled: true },
        'poe.com': { enabled: true },
      }
    };
    
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (tab?.url) {
      const url = new URL(tab.url);
      const hostname = url.hostname.toLowerCase();
      
      let isProtected = settings.protectAllSites;
      
      if (!isProtected && settings.protectedSites) {
        for (const [domain, config] of Object.entries(settings.protectedSites)) {
          if (config.enabled && (hostname === domain || hostname.endsWith('.' + domain))) {
            isProtected = true;
            break;
          }
        }
      }
      
      if (isProtected) {
        siteStatusEl.textContent = 'Protected';
        siteStatusEl.className = 'status-value protected';
      } else {
        siteStatusEl.textContent = 'Not Protected';
        siteStatusEl.className = 'status-value not-protected';
      }
    } else {
      siteStatusEl.textContent = 'N/A';
      siteStatusEl.className = 'status-value not-protected';
    }
  } catch (e) {
    console.error('Error checking site status:', e);
    siteStatusEl.textContent = 'Unknown';
    siteStatusEl.className = 'status-value not-protected';
  }
});
