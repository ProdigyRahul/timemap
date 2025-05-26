// Background service worker for TimeMap extension
const POMODORO_ALARM_NAME = 'timemapPomodoroAlarm';
const POMODORO_TICK_ALARM = 'timemapPomodoroTick';

// Initialize default settings if not already set
chrome.runtime.onInstalled.addListener(async (details) => {
  // Get current settings or set defaults
  const settings = await chrome.storage.sync.get({
    username: '',          // Store username
    theme: 'auto',           // 'auto', 'light', 'dark', 'blue', 'purple', 'sunset', 'high-contrast'
    dotShape: 'square',      // 'square', 'circle', 'rounded', 'hexagon'
    dotSize: 3,              // 1-5
    colorIntensity: 3,       // 1-5
    showQuotes: 'daily',     // 'daily', 'always', 'never'
    showTasks: 'true',       // 'true', 'false'
    tasks: [],               // Array of task objects
    currentQuote: null,      // Current quote object
    quoteLastUpdated: 0,      // Timestamp of when the quote was last updated
    onboardingCompleted: false // Whether onboarding has been completed
  });

  // Save default settings
  await chrome.storage.sync.set(settings);
  
  // Initialize Pomodoro state in storage
  await chrome.storage.local.set({
    pomodoro: {
      isRunning: false,
      mode: 'pomodoro', // pomodoro, shortBreak, longBreak
      timeLeft: 25 * 60, // seconds
      duration: 25 * 60 // seconds, duration of the current mode
    }
  });

  // Open onboarding page on initial install
  if (details.reason === 'install') {
    console.log('Extension installed, opening onboarding page');
    chrome.tabs.create({ url: 'onboarding.html' });
  } else {
    console.log('Extension updated, reason:', details.reason);
  }
});

// Check if the user has completed onboarding when Chrome starts
chrome.runtime.onStartup.addListener(async () => {
  const settings = await chrome.storage.sync.get(['username', 'onboardingCompleted']);
  
  // If username is not set and onboarding not completed, show onboarding page
  if (!settings.username && !settings.onboardingCompleted) {
    chrome.tabs.create({ url: 'onboarding.html' });
  }
});

// Listen for messages from popup.js or newtab.js
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'openNewTab') {
    chrome.tabs.create({ url: 'chrome://newtab' });
    sendResponse({ success: true });
  }
  
  if (message.action === 'onboardingComplete') {
    chrome.storage.sync.set({ onboardingCompleted: true });
    sendResponse({ success: true });
  }
  
  // Pomodoro message handling
  if (message.action === 'pomodoroControl') {
    handlePomodoroControl(message.command, message.data, sendResponse);
    return true; // Keep channel open for async response
  }
  
  if (message.action === 'getPomodoroState') {
    chrome.storage.local.get('pomodoro', (data) => {
      sendResponse(data.pomodoro);
    });
    return true;
  }
  
  return true; // Keep the message channel open for async responses
});

// Pomodoro Timer Logic
async function handlePomodoroControl(command, data, sendResponse) {
  const { pomodoro } = await chrome.storage.local.get('pomodoro');

  switch (command) {
    case 'start':
      if (!pomodoro.isRunning) {
        pomodoro.isRunning = true;
        // If timeLeft is 0 (timer finished), reset to current mode's duration
        if (pomodoro.timeLeft === 0) {
            pomodoro.timeLeft = pomodoro.duration;
        }
        
        // Clear any existing alarms
        await chrome.alarms.clear(POMODORO_TICK_ALARM);
        
        // Create a recurring alarm that fires every second (1/60 minutes)
        chrome.alarms.create(POMODORO_TICK_ALARM, { 
          periodInMinutes: 1/60 
        });
        
        console.log('Pomodoro started:', pomodoro);
      }
      break;
    case 'pause':
      if (pomodoro.isRunning) {
        pomodoro.isRunning = false;
        await chrome.alarms.clear(POMODORO_TICK_ALARM);
        console.log('Pomodoro paused:', pomodoro);
      }
      break;
    case 'reset':
      pomodoro.isRunning = false;
      pomodoro.timeLeft = pomodoro.duration;
      await chrome.alarms.clear(POMODORO_TICK_ALARM);
      console.log('Pomodoro reset:', pomodoro);
      break;
    case 'switchMode':
      pomodoro.isRunning = false;
      pomodoro.mode = data.mode;
      pomodoro.duration = data.time * 60;
      pomodoro.timeLeft = pomodoro.duration;
      await chrome.alarms.clear(POMODORO_TICK_ALARM);
      console.log('Pomodoro mode switched:', pomodoro);
      break;
  }

  await chrome.storage.local.set({ pomodoro });
  sendResponse(pomodoro); // Send updated state back
}

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === POMODORO_TICK_ALARM) {
    const { pomodoro } = await chrome.storage.local.get('pomodoro');
    
    if (pomodoro.isRunning && pomodoro.timeLeft > 0) {
      pomodoro.timeLeft -= 1;

      if (pomodoro.timeLeft <= 0) {
        pomodoro.isRunning = false;
        pomodoro.timeLeft = 0;
        
        // Play sound and show notification
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'img/icons/icon128.png',
          title: 'TimeMap Pomodoro',
          message: `${pomodoro.mode.charAt(0).toUpperCase() + pomodoro.mode.slice(1)} finished!`,
          priority: 2
        });
        
        // Auto-switch logic
        if (pomodoro.mode === 'pomodoro') {
          pomodoro.mode = 'shortBreak';
          pomodoro.duration = 5 * 60;
        } else { // shortBreak or longBreak
          pomodoro.mode = 'pomodoro';
          pomodoro.duration = 25 * 60;
        }
        pomodoro.timeLeft = pomodoro.duration;
        
        // Clear the alarm as we're now stopped
        await chrome.alarms.clear(POMODORO_TICK_ALARM);
      }
      
      // Save updated state
      await chrome.storage.local.set({ pomodoro });
      
      // Send update to popup
      try {
        chrome.runtime.sendMessage({ action: 'pomodoroUpdate', pomodoroState: pomodoro });
      } catch (error) {
        // Handle error: Popup might be closed, which is fine
        console.log("Could not send pomodoro update - receiver might be closed");
      }
    }
  }
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
    
    if (!settings.hasOwnProperty('username')) {
      settings.username = ''; // Add username field for existing users
    }
    
    if (!settings.hasOwnProperty('onboardingCompleted')) {
      settings.onboardingCompleted = settings.username ? true : false;
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