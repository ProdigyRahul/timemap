// Popup script for TimeMap extension

document.addEventListener('DOMContentLoaded', async () => {
  // DOM elements
  const yearProgressElement = document.getElementById('popup-year-progress');
  const themeSelect = document.getElementById('popup-theme-select');
  const openNewTabButton = document.getElementById('open-newtab');
  const openSettingsButton = document.getElementById('open-settings');
  
  // Get current settings
  const settings = await chrome.storage.sync.get({
    theme: 'auto'
  });
  
  // Initialize theme dropdown
  themeSelect.value = settings.theme;
  
  // Calculate and display year progress
  updateYearProgress();
  
  // Event listeners
  themeSelect.addEventListener('change', changeTheme);
  openNewTabButton.addEventListener('click', openNewTab);
  openSettingsButton.addEventListener('click', openSettings);
  
  function changeTheme(e) {
    const theme = e.target.value;
    chrome.storage.sync.set({ theme: theme });
    
    // Send message to any open TimeMap tabs to update their theme
    chrome.tabs.query({ url: 'chrome://newtab/' }, (tabs) => {
      tabs.forEach((tab) => {
        chrome.tabs.sendMessage(tab.id, { action: 'updateTheme', theme: theme });
      });
    });
  }
  
  function openNewTab() {
    chrome.runtime.sendMessage({ action: 'openNewTab' });
    window.close(); // Close the popup
  }
  
  function openSettings() {
    // Open settings on an existing TimeMap tab or create a new one
    chrome.tabs.query({ url: 'chrome://newtab/' }, (tabs) => {
      if (tabs.length > 0) {
        // Send message to open settings on existing tab
        chrome.tabs.sendMessage(tabs[0].id, { action: 'openSettings' });
        chrome.tabs.update(tabs[0].id, { active: true });
      } else {
        // Create new tab and set flag to open settings when it loads
        chrome.storage.local.set({ openSettings: true }, () => {
          chrome.tabs.create({ url: 'chrome://newtab/' });
        });
      }
      window.close(); // Close the popup
    });
  }
  
  function updateYearProgress() {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const endOfYear = new Date(now.getFullYear(), 11, 31);
    
    const millisecondsPerDay = 24 * 60 * 60 * 1000;
    const daysPassed = Math.floor((now - startOfYear) / millisecondsPerDay);
    const totalDays = Math.floor((endOfYear - startOfYear) / millisecondsPerDay) + 1;
    const progress = Math.floor((daysPassed / totalDays) * 100);
    
    yearProgressElement.textContent = `${progress}%`;
  }
}); 