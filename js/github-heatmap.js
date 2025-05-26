// GitHub-style heatmap implementation for TimeMap extension

// DOM elements
const heatmapContainer = document.querySelector('.gh-heatmap');
const loadingElement = document.querySelector('.heatmap-loading');

// Variables to store data and settings
let yearData = {};
let heatmapConfig = {
  shape: 'square',
  size: 3,
  intensity: 3
};

// Initialize the heatmap when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('Initializing GitHub-style heatmap...');
  
  // Get saved settings
  chrome.storage.sync.get(['colorIntensity', 'dotShape', 'dotSize'], (settings) => {
    if (settings.colorIntensity) {
      heatmapConfig.intensity = parseInt(settings.colorIntensity, 10);
      applyIntensityLevels(heatmapConfig.intensity);
    }
    
    if (settings.dotShape) {
      heatmapConfig.shape = settings.dotShape;
    }
    
    if (settings.dotSize) {
      heatmapConfig.size = parseInt(settings.dotSize, 10);
    }
    
    // Generate data and render the heatmap
    generateHeatmapData();
    renderGitHubHeatmap();
    
    // Update year statistics
    updateYearStats();
  });
});

// Function to generate sample data for the heatmap
function generateHeatmapData() {
  const now = new Date();
  const currentYear = now.getFullYear();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  yearData = {}; // Reset data
  
  // Generate data for the entire year
  const startDate = new Date(currentYear, 0, 1);
  const endDate = new Date(currentYear, 11, 31);
  
  // Only generate data up to today
  const maxDate = today > endDate ? endDate : today;
  
  for (let d = new Date(startDate); d <= maxDate; d.setDate(d.getDate() + 1)) {
    const dateStr = formatDate(d);
    const isWeekend = d.getDay() === 0 || d.getDay() === 6;
    
    // Generate random activity value (more activity on weekdays)
    let value = 0;
    if (dateStr !== formatDate(today)) { // Past days
      value = isWeekend 
        ? Math.floor(Math.random() * 3) // 0-2 for weekends
        : Math.floor(Math.random() * 5) + 1; // 1-5 for weekdays
    } else { // Today
      value = 3; // Medium activity for today
    }
    
    yearData[dateStr] = value;
  }
  
  console.log(`Generated ${Object.keys(yearData).length} data points for heatmap`);
}

// Helper function to format date as YYYY-MM-DD
function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Function to render the GitHub-style heatmap
function renderGitHubHeatmap() {
  if (!heatmapContainer) return;
  
  // Clear existing content
  heatmapContainer.innerHTML = '';
  
  // Hide loading message
  if (loadingElement) {
    loadingElement.style.display = 'none';
  }
  
  // Apply shape and size classes
  heatmapContainer.className = `gh-heatmap ${heatmapConfig.shape} size-${heatmapConfig.size}`;
  
  // Get current year
  const now = new Date();
  const currentYear = now.getFullYear();
  
  // Create 12 months
  for (let month = 0; month < 12; month++) {
    const monthElement = document.createElement('div');
    monthElement.className = 'gh-calendar-month';
    
    // Add month label
    const monthLabel = document.createElement('div');
    monthLabel.className = 'gh-month-label';
    monthLabel.textContent = new Date(currentYear, month, 1).toLocaleDateString('en-US', { month: 'short' });
    monthElement.appendChild(monthLabel);
    
    // Create days container
    const daysContainer = document.createElement('div');
    daysContainer.className = 'gh-calendar-days';
    
    // Get the first day of the month
    const firstDay = new Date(currentYear, month, 1);
    const firstDayOfWeek = firstDay.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    // Add empty cells for days before the first day of month
    for (let i = 0; i < firstDayOfWeek; i++) {
      const emptyDay = document.createElement('div');
      emptyDay.className = 'gh-calendar-day empty';
      daysContainer.appendChild(emptyDay);
    }
    
    // Get the last day of the month
    const lastDay = new Date(currentYear, month + 1, 0).getDate();
    
    // Add days of the month
    for (let day = 1; day <= lastDay; day++) {
      const dayElement = document.createElement('div');
      dayElement.className = 'gh-calendar-day';
      
      // Format date string
      const dateObj = new Date(currentYear, month, day);
      const dateStr = formatDate(dateObj);
      
      // Get activity level for the day
      const activityLevel = yearData[dateStr] || 0;
      
      // Set data attributes for tooltips
      dayElement.setAttribute('data-date', dateStr);
      dayElement.setAttribute('data-activity', activityLevel);
      
      // Apply activity level class
      dayElement.classList.add(`level-${activityLevel}`);
      
      // Set background color based on activity level
      const colors = [
        'var(--dot-empty)',
        'var(--dot-level-1)',
        'var(--dot-level-2)',
        'var(--dot-level-3)',
        'var(--dot-level-4)'
      ];
      dayElement.style.backgroundColor = colors[activityLevel] || colors[0];
      
      // Add tooltip on hover
      dayElement.title = `${dateObj.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })}: ${activityLevel} activities`;
      
      daysContainer.appendChild(dayElement);
    }
    
    monthElement.appendChild(daysContainer);
    heatmapContainer.appendChild(monthElement);
  }
}

// Update the year statistics
function updateYearStats() {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const endOfYear = new Date(now.getFullYear(), 11, 31);
  
  const millisecondsPerDay = 24 * 60 * 60 * 1000;
  const daysPassed = Math.floor((now - startOfYear) / millisecondsPerDay);
  const daysRemaining = Math.floor((endOfYear - now) / millisecondsPerDay);
  const totalDays = Math.floor((endOfYear - startOfYear) / millisecondsPerDay) + 1;
  const progress = Math.floor((daysPassed / totalDays) * 100);
  
  // Update the stats elements
  const daysPassedElement = document.getElementById('days-passed');
  const daysRemainingElement = document.getElementById('days-remaining');
  const yearProgressElement = document.getElementById('year-progress');
  
  if (daysPassedElement) daysPassedElement.textContent = daysPassed;
  if (daysRemainingElement) daysRemainingElement.textContent = daysRemaining;
  if (yearProgressElement) yearProgressElement.textContent = `${progress}%`;
}

// Apply different intensity levels based on settings
function applyIntensityLevels(intensity) {
  const root = document.documentElement;
  switch (parseInt(intensity, 10)) {
    case 1: // Subtle
      root.style.setProperty('--dot-level-1', '#e6f5d0');
      root.style.setProperty('--dot-level-2', '#b8e186');
      root.style.setProperty('--dot-level-3', '#7fbc41');
      root.style.setProperty('--dot-level-4', '#4d9221');
      break;
    case 2:
      root.style.setProperty('--dot-level-1', '#d3eecd');
      root.style.setProperty('--dot-level-2', '#a2d88a');
      root.style.setProperty('--dot-level-3', '#5bb146');
      root.style.setProperty('--dot-level-4', '#3a8c2e');
      break;
    case 3: // Default
      root.style.setProperty('--dot-level-1', '#c6e48b');
      root.style.setProperty('--dot-level-2', '#7bc96f');
      root.style.setProperty('--dot-level-3', '#49af5d');
      root.style.setProperty('--dot-level-4', '#2e8540');
      break;
    case 4:
      root.style.setProperty('--dot-level-1', '#b4e07b');
      root.style.setProperty('--dot-level-2', '#6cba5f');
      root.style.setProperty('--dot-level-3', '#3aa04d');
      root.style.setProperty('--dot-level-4', '#1f7630');
      break;
    case 5: // Intense
      root.style.setProperty('--dot-level-1', '#9cd96b');
      root.style.setProperty('--dot-level-2', '#5cab50');
      root.style.setProperty('--dot-level-3', '#2c933e');
      root.style.setProperty('--dot-level-4', '#105020');
      break;
  }
  
  // Re-render the heatmap if it exists
  if (heatmapContainer) {
    renderGitHubHeatmap();
  }
}

// Apply dot shape changes
function applyDotShape(shape) {
  heatmapConfig.shape = shape;
  if (heatmapContainer) {
    heatmapContainer.className = `gh-heatmap ${shape} size-${heatmapConfig.size}`;
  }
}

// Apply dot size changes
function applyDotSize(size) {
  heatmapConfig.size = parseInt(size, 10);
  if (heatmapContainer) {
    heatmapContainer.className = `gh-heatmap ${heatmapConfig.shape} size-${heatmapConfig.size}`;
  }
}

// Listen for settings changes
chrome.storage.onChanged.addListener((changes) => {
  if (changes.colorIntensity) {
    applyIntensityLevels(changes.colorIntensity.newValue);
  }
  if (changes.dotShape) {
    applyDotShape(changes.dotShape.newValue);
  }
  if (changes.dotSize) {
    applyDotSize(changes.dotSize.newValue);
  }
}); 