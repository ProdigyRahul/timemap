// Background service worker for TimeMap extension

// Initialize default settings if not already set
chrome.runtime.onInstalled.addListener(async () => {
  // Get current settings or set defaults
  const settings = await chrome.storage.sync.get({
    theme: 'auto',           // 'auto', 'light', 'dark', 'blue', 'purple', 'sunset', 'high-contrast'
    dotShape: 'square',      // 'square', 'circle', 'rounded', 'hexagon'
    dotSize: 3,              // 1-5
    colorIntensity: 3,       // 1-5
    showQuotes: 'daily',     // 'daily', 'always', 'never'
    showTasks: 'true',       // 'true', 'false'
    tasks: [],               // Array of task objects
    currentQuote: null,      // Current quote object
    quoteLastUpdated: 0      // Timestamp of when the quote was last updated
  });

  // Save default settings
  await chrome.storage.sync.set(settings);

  // Open onboarding page on initial install
  if (chrome.runtime.OnInstalledReason && chrome.runtime.onInstalled.reason === chrome.runtime.OnInstalledReason.INSTALL) {
    chrome.tabs.create({ url: 'onboarding.html' });
  }
});

// Listen for messages from popup.js or newtab.js
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'openNewTab') {
    chrome.tabs.create({ url: 'chrome://newtab' });
    sendResponse({ success: true });
  }
  
  return true; // Keep the message channel open for async responses
});

// Handle data migration for updates
async function migrateDataIfNeeded() {
  const currentVersion = chrome.runtime.getManifest().version;
  const storedVersion = await chrome.storage.sync.get('version');
  
  if (storedVersion.version !== currentVersion) {
    // This could handle specific migrations for version updates
    console.log(`Migrating data from ${storedVersion.version || 'unknown'} to ${currentVersion}`);
    
    // Example: If adding a new setting in a new version
    const settings = await chrome.storage.sync.get(null);
    
    if (!settings.hasOwnProperty('colorIntensity')) {
      settings.colorIntensity = 3; // Default value for new setting
    }
    
    if (!settings.hasOwnProperty('showQuotes')) {
      settings.showQuotes = 'daily';
    }
    
    if (!settings.hasOwnProperty('showTasks')) {
      settings.showTasks = 'true';
    }
    
    // Save migrated settings
    await chrome.storage.sync.set({
      ...settings,
      version: currentVersion
    });
  }
}

// Run migration check
migrateDataIfNeeded(); 