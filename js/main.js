// Main JavaScript for TimeMap extension
document.addEventListener('DOMContentLoaded', async () => {
  // DOM Elements
  const settingsPanel = document.getElementById('settings-panel');
  const settingsToggle = document.getElementById('settings-toggle');
  const closeSettings = document.getElementById('close-settings');
  const themeToggle = document.getElementById('theme-toggle');
  const themeSelect = document.getElementById('theme-select');
  const dotShapeSelect = document.getElementById('dot-shape');
  const dotSizeInput = document.getElementById('dot-size');
  
  // Stats Elements
  const daysPassedElement = document.getElementById('days-passed');
  const daysRemainingElement = document.getElementById('days-remaining');
  const yearProgressElement = document.getElementById('year-progress');
  
  // Get saved settings
  const settings = await chrome.storage.sync.get({
    theme: 'auto',
    dotShape: 'square',
    dotSize: 3,
    colorIntensity: 3
  });
  
  // Initialize UI with saved settings
  if (typeof initializeTheme === 'function') {
    initializeTheme(settings.theme);
  } else {
    // Fallback if the function isn't defined elsewhere
    applyTheme(settings.theme);
  }
  
  // Update stats
  updateStats();
  
  // Event listeners
  if (settingsToggle) {
    settingsToggle.addEventListener('click', toggleSettings);
  }
  
  if (closeSettings) {
    closeSettings.addEventListener('click', toggleSettings);
  }
  
  if (themeToggle) {
    themeToggle.addEventListener('click', toggleTheme);
  }
  
  // Setup message listener for theme changes from popup
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'updateTheme' && message.theme) {
      applyTheme(message.theme);
    }
    if (message.action === 'openSettings') {
      if (settingsPanel) {
        settingsPanel.classList.add('visible');
      }
    }
  });
  
  // Check if we should open settings on load
  chrome.storage.local.get(['openSettings'], (result) => {
    if (result.openSettings && settingsPanel) {
      settingsPanel.classList.add('visible');
      chrome.storage.local.remove(['openSettings']);
    }
  });
  
  // Update stats periodically (every minute)
  setInterval(updateStats, 60000);
  
  // Functions
  function toggleSettings() {
    if (settingsPanel) {
      settingsPanel.classList.toggle('visible');
    }
  }
  
  function toggleTheme() {
    chrome.storage.sync.get(['theme'], (result) => {
      let newTheme;
      
      // If in auto mode, switch to light/dark based on current state
      if (result.theme === 'auto') {
        const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        newTheme = isDark ? 'light' : 'dark';
      } else {
        // Toggle between light and dark
        newTheme = document.body.classList.contains('dark-theme') ? 'light' : 'dark';
      }
      
      chrome.storage.sync.set({ theme: newTheme }, () => {
        applyTheme(newTheme);
      });
    });
  }
  
  function applyTheme(theme) {
    // Remove all possible theme classes
    document.body.classList.remove('light-theme', 'dark-theme', 'blue-theme', 'purple-theme', 'sunset-theme', 'high-contrast-theme');
    
    // Apply the selected theme
    if (theme === 'auto') {
      // Detect system preference
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (isDark) {
        document.body.classList.add('dark-theme');
      } else {
        document.body.classList.add('light-theme');
      }
    } else {
      document.body.classList.add(`${theme}-theme`);
    }
  }
  
  function updateStats() {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const endOfYear = new Date(now.getFullYear(), 11, 31);
    
    const millisecondsPerDay = 24 * 60 * 60 * 1000;
    const daysPassed = Math.floor((now - startOfYear) / millisecondsPerDay);
    const totalDays = Math.floor((endOfYear - startOfYear) / millisecondsPerDay) + 1; // +1 to include the last day
    const daysRemaining = totalDays - daysPassed;
    const progress = Math.floor((daysPassed / totalDays) * 100);
    
    // Update UI elements if they exist
    if (daysPassedElement) {
      daysPassedElement.textContent = daysPassed;
    }
    if (daysRemainingElement) {
      daysRemainingElement.textContent = daysRemaining;
    }
    if (yearProgressElement) {
      yearProgressElement.textContent = `${progress}%`;
    }
    
    // Update tab title with progress
    document.title = `${progress}% of ${now.getFullYear()} - TimeMap`;
  }
}); 