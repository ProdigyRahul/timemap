// Pomodoro timer functionality for TimeMap extension (Popup)

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const timerDisplay = document.getElementById('timer-display');
  const startButton = document.getElementById('pomodoro-start');
  const pauseButton = document.getElementById('pomodoro-pause');
  const resetButton = document.getElementById('pomodoro-reset');
  const modeButtons = document.querySelectorAll('.timer-mode-btn');
  
  // Timer state
  let pomodoroState = null;
  let timerInterval = null;
  
  // Initialize timer display by fetching state from background
  chrome.runtime.sendMessage({ action: 'getPomodoroState' }, (response) => {
    if (response) {
      pomodoroState = response;
      updateUI(response);
      
      // Start local timer if pomodoro is running
      if (response.isRunning) {
        startLocalTimer();
      }
    }
  });
  
  // Event listeners
  if (startButton) {
    startButton.addEventListener('click', () => {
      chrome.runtime.sendMessage({ action: 'pomodoroControl', command: 'start' }, (response) => {
        pomodoroState = response;
        updateUI(response);
        startLocalTimer();
      });
    });
  }
  
  if (pauseButton) {
    pauseButton.addEventListener('click', () => {
      chrome.runtime.sendMessage({ action: 'pomodoroControl', command: 'pause' }, (response) => {
        pomodoroState = response;
        updateUI(response);
        stopLocalTimer();
      });
    });
  }
  
  if (resetButton) {
    resetButton.addEventListener('click', () => {
      chrome.runtime.sendMessage({ action: 'pomodoroControl', command: 'reset' }, (response) => {
        pomodoroState = response;
        updateUI(response);
        stopLocalTimer();
      });
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
        }, (response) => {
          pomodoroState = response;
          updateUI(response);
          stopLocalTimer();
        });
      });
    });
  }
  
  // Listen for updates from the background script
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'pomodoroUpdate') {
      pomodoroState = message.pomodoroState;
      updateUI(message.pomodoroState);
      
      // Start or stop local timer based on pomodoro state
      if (pomodoroState.isRunning) {
        startLocalTimer();
      } else {
        stopLocalTimer();
      }
    }
  });
  
  // Start a local timer that updates the UI every second
  function startLocalTimer() {
    // Clear any existing interval
    stopLocalTimer();
    
    // Set up a new interval
    timerInterval = setInterval(() => {
      if (pomodoroState && pomodoroState.isRunning && pomodoroState.timeLeft > 0) {
        pomodoroState.timeLeft -= 1;
        updateTimerDisplay(pomodoroState);
        
        // Handle timer completion locally
        if (pomodoroState.timeLeft <= 0) {
          stopLocalTimer();
          // Let the background script handle the rest
        }
      }
    }, 1000);
  }
  
  // Stop the local timer
  function stopLocalTimer() {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
  }
  
  // Just update the timer display without changing other elements
  function updateTimerDisplay(pomodoroState) {
    if (!timerDisplay || !pomodoroState) return;
    
    const minutes = Math.floor(pomodoroState.timeLeft / 60);
    const seconds = pomodoroState.timeLeft % 60;
    timerDisplay.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
  
  // UI Update function
  function updateUI(pomodoroState) {
    if (!pomodoroState) return;

    // Update timer display
    updateTimerDisplay(pomodoroState);
    
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