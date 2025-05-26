// Content script for TimeMap - floating Pomodoro timer

// Create the floating timer HTML structure
function createFloatingTimer() {
  const timerContainer = document.createElement('div');
  timerContainer.id = 'timemap-floating-timer';
  timerContainer.classList.add('timemap-timer-container', 'collapsed');
  
  timerContainer.innerHTML = `
    <div class="timemap-timer-header">
      <h3>TimeMap</h3>
      <div class="timemap-timer-controls">
        <button id="timemap-timer-toggle" title="Expand/Collapse">↕</button>
        <button id="timemap-timer-close" title="Hide Timer">×</button>
      </div>
    </div>
    <div class="timemap-timer-content">
      <div class="timemap-timer-display" id="timemap-timer-display">25:00</div>
      <div class="timemap-timer-buttons">
        <button id="timemap-timer-start">Start</button>
        <button id="timemap-timer-pause">Pause</button>
        <button id="timemap-timer-reset">Reset</button>
      </div>
      <div class="timemap-timer-modes">
        <button class="timemap-mode-btn active" data-mode="pomodoro" data-time="25">Pomodoro</button>
        <button class="timemap-mode-btn" data-mode="shortBreak" data-time="5">Short Break</button>
        <button class="timemap-mode-btn" data-mode="longBreak" data-time="15">Long Break</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(timerContainer);
  return timerContainer;
}

// Initialize the floating timer
function initFloatingTimer() {
  const timerContainer = createFloatingTimer();
  
  // Make the timer draggable
  makeDraggable(timerContainer);
  
  // Get timer elements
  const toggleButton = document.getElementById('timemap-timer-toggle');
  const closeButton = document.getElementById('timemap-timer-close');
  const startButton = document.getElementById('timemap-timer-start');
  const pauseButton = document.getElementById('timemap-timer-pause');
  const resetButton = document.getElementById('timemap-timer-reset');
  const modeButtons = document.querySelectorAll('.timemap-mode-btn');
  const timerDisplay = document.getElementById('timemap-timer-display');
  
  // Set up event listeners
  toggleButton.addEventListener('click', () => {
    timerContainer.classList.toggle('collapsed');
  });
  
  closeButton.addEventListener('click', () => {
    timerContainer.style.display = 'none';
    chrome.storage.local.set({ floatingTimerVisible: false });
  });
  
  startButton.addEventListener('click', () => {
    chrome.runtime.sendMessage({ 
      action: 'pomodoroControl', 
      command: 'start' 
    }, updateTimerDisplay);
  });
  
  pauseButton.addEventListener('click', () => {
    chrome.runtime.sendMessage({ 
      action: 'pomodoroControl', 
      command: 'pause' 
    }, updateTimerDisplay);
  });
  
  resetButton.addEventListener('click', () => {
    chrome.runtime.sendMessage({ 
      action: 'pomodoroControl', 
      command: 'reset' 
    }, updateTimerDisplay);
  });
  
  modeButtons.forEach(button => {
    button.addEventListener('click', () => {
      const mode = button.getAttribute('data-mode');
      const time = parseInt(button.getAttribute('data-time'), 10);
      chrome.runtime.sendMessage({ 
        action: 'pomodoroControl', 
        command: 'switchMode', 
        data: { mode, time } 
      }, updateTimerDisplay);
      
      // Update active mode button
      modeButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
    });
  });
  
  // Initialize timer display with current state from background
  chrome.runtime.sendMessage({ action: 'getPomodoroState' }, updateTimerDisplay);
  
  // Listen for updates from the background script
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'pomodoroUpdate') {
      updateTimerDisplay(message.pomodoroState);
    }
  });
  
  // Update timer position from saved position
  chrome.storage.local.get(['floatingTimerPosition', 'floatingTimerVisible'], (data) => {
    if (data.floatingTimerPosition) {
      timerContainer.style.top = `${data.floatingTimerPosition.top}px`;
      timerContainer.style.left = `${data.floatingTimerPosition.left}px`;
    }
    
    if (data.floatingTimerVisible === false) {
      timerContainer.style.display = 'none';
    }
  });
}

// Make the timer draggable
function makeDraggable(element) {
  let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
  const header = element.querySelector('.timemap-timer-header');
  
  if (header) {
    header.onmousedown = dragMouseDown;
  } else {
    element.onmousedown = dragMouseDown;
  }
  
  function dragMouseDown(e) {
    e.preventDefault();
    // Get the mouse cursor position at startup
    pos3 = e.clientX;
    pos4 = e.clientY;
    document.onmouseup = closeDragElement;
    // Call a function whenever the cursor moves
    document.onmousemove = elementDrag;
  }
  
  function elementDrag(e) {
    e.preventDefault();
    // Calculate the new cursor position
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;
    // Set the element's new position
    const newTop = element.offsetTop - pos2;
    const newLeft = element.offsetLeft - pos1;
    
    // Ensure the timer stays within the viewport
    const maxX = window.innerWidth - element.offsetWidth;
    const maxY = window.innerHeight - element.offsetHeight;
    
    element.style.top = `${Math.max(0, Math.min(newTop, maxY))}px`;
    element.style.left = `${Math.max(0, Math.min(newLeft, maxX))}px`;
  }
  
  function closeDragElement() {
    // Stop moving when mouse button is released
    document.onmouseup = null;
    document.onmousemove = null;
    
    // Save the position
    chrome.storage.local.set({ 
      floatingTimerPosition: {
        top: parseInt(element.style.top),
        left: parseInt(element.style.left)
      }
    });
  }
}

// Update the timer display with the current state
function updateTimerDisplay(pomodoroState) {
  if (!pomodoroState) return;
  
  const timerDisplay = document.getElementById('timemap-timer-display');
  const startButton = document.getElementById('timemap-timer-start');
  const pauseButton = document.getElementById('timemap-timer-pause');
  const modeButtons = document.querySelectorAll('.timemap-mode-btn');
  
  // Update timer text
  if (timerDisplay) {
    const minutes = Math.floor(pomodoroState.timeLeft / 60);
    const seconds = pomodoroState.timeLeft % 60;
    timerDisplay.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
  
  // Update buttons state
  if (startButton && pauseButton) {
    startButton.disabled = pomodoroState.isRunning;
    pauseButton.disabled = !pomodoroState.isRunning;
  }
  
  // Update mode buttons
  if (modeButtons) {
    modeButtons.forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-mode') === pomodoroState.mode);
    });
  }
}

// Initialize the floating timer when the content script is loaded
document.addEventListener('DOMContentLoaded', initFloatingTimer);

// Add a reveal button to show the timer if it was hidden
function addRevealButton() {
  const revealButton = document.createElement('button');
  revealButton.id = 'timemap-reveal-button';
  revealButton.textContent = '⏱️';
  revealButton.title = 'Show TimeMap Timer';
  
  revealButton.addEventListener('click', () => {
    const timer = document.getElementById('timemap-floating-timer');
    if (timer) {
      timer.style.display = 'block';
      chrome.storage.local.set({ floatingTimerVisible: true });
    }
  });
  
  document.body.appendChild(revealButton);
}

// Add the reveal button
document.addEventListener('DOMContentLoaded', addRevealButton);

// If the document is already loaded (common with SPAs), initialize immediately
if (document.readyState === 'interactive' || document.readyState === 'complete') {
  initFloatingTimer();
  addRevealButton();
} 