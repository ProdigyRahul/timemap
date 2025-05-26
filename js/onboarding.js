// Onboarding functionality for TimeMap extension

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('username-form');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const username = document.getElementById('username-input').value.trim();
      
      // Save username to chrome.storage
      chrome.storage.sync.set({ username }, () => {
        // Mark onboarding as completed
        chrome.runtime.sendMessage({ action: 'onboardingComplete' }, () => {
          // Open a new tab to show TimeMap
          chrome.tabs.create({ url: 'chrome://newtab' });
        });
      });
    });
  }
}); 