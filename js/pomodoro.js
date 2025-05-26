// Pomodoro timer functionality for TimeMap extension (Popup)

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const timerDisplay = document.getElementById('timer-display');
  const startButton = document.getElementById('pomodoro-start');
  const pauseButton = document.getElementById('pomodoro-pause');
  const resetButton = document.getElementById('pomodoro-reset');
  const modeButtons = document.querySelectorAll('.timer-mode-btn');
  
  // Initialize timer display by fetching state from background
  chrome.runtime.sendMessage({ action: 'getPomodoroState' }, (response) => {
    if (response) {
      updateUI(response);
    }
  });
  
  // Event listeners
  if (startButton) {
    startButton.addEventListener('click', () => {
      chrome.runtime.sendMessage({ action: 'pomodoroControl', command: 'start' }, updateUI);
    });
  }
  
  if (pauseButton) {
    pauseButton.addEventListener('click', () => {
      chrome.runtime.sendMessage({ action: 'pomodoroControl', command: 'pause' }, updateUI);
    });
  }
  
  if (resetButton) {
    resetButton.addEventListener('click', () => {
      chrome.runtime.sendMessage({ action: 'pomodoroControl', command: 'reset' }, updateUI);
    });
  }
  
  if (modeButtons) {
    modeButtons.forEach(button => {
      button.addEventListener('click', () => {
        const mode = button.getAttribute('data-mode');
        const time = parseInt(button.getAttribute('data-time'), 10);
        chrome.runtime.sendMessage({ 
          action: 'pomodoroControl', 
          command: 'switchMode', 
          data: { mode, time } 
        }, updateUI);
      });
    });
  }
  
  // Listen for updates from the background script
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'pomodoroUpdate') {
      updateUI(message.pomodoroState);
    }
  });
  
  // UI Update function
  function updateUI(pomodoroState) {
    if (!pomodoroState) return;

    // Update timer display
    if (timerDisplay) {
      const minutes = Math.floor(pomodoroState.timeLeft / 60);
      const seconds = pomodoroState.timeLeft % 60;
      timerDisplay.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }
    
    // Update mode buttons
    if (modeButtons) {
      modeButtons.forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-mode') === pomodoroState.mode) {
          btn.classList.add('active');
        }
      });
    }

    // Update start/pause button text and state if needed (optional)
    if(startButton && pauseButton){
        startButton.textContent = pomodoroState.isRunning ? 'Running' : 'Start';
        // You might want to disable start if running, and pause if not running
        startButton.disabled = pomodoroState.isRunning;
        pauseButton.disabled = !pomodoroState.isRunning;
    }
  }
  
  // Request notification permission on load (if not already handled by background)
  if ('Notification' in window) {
    if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          console.log('Notification permission granted.');
        }
      });
    }
  }
}); 