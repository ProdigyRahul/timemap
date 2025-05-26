// Heatmap generation for TimeMap extension

function generateHeatmap() {
  const heatmap = document.getElementById('heatmap');
  const monthLabelsContainer = document.getElementById('month-labels');
  
  // Clear existing content
  heatmap.innerHTML = '';
  monthLabelsContainer.innerHTML = '';
  
  const now = new Date();
  const currentYear = now.getFullYear();
  const startOfYear = new Date(currentYear, 0, 1);
  
  // Calculate the first day of the week for the start of the year
  // 0 = Sunday, 1 = Monday, etc.
  const firstDayOfWeek = startOfYear.getDay();
  
  // Check if the current year is a leap year
  const isLeapYear = (year) => {
    return ((year % 4 === 0) && (year % 100 !== 0)) || (year % 400 === 0);
  };
  
  // Total days in the year
  const daysInYear = isLeapYear(currentYear) ? 366 : 365;
  
  // Generate month labels first
  generateMonthLabels(firstDayOfWeek);

  // Create empty cells for alignment (to match the day of the week)
  for (let i = 0; i < firstDayOfWeek; i++) {
    const emptyCell = document.createElement('div');
    emptyCell.classList.add('heatmap-cell', 'empty');
    heatmap.appendChild(emptyCell);
  }
  
  // Create cells for each day of the year
  for (let dayOfYear = 0; dayOfYear < daysInYear; dayOfYear++) {
    const date = new Date(startOfYear);
    date.setDate(date.getDate() + dayOfYear);
    
    const cell = document.createElement('div');
    cell.classList.add('heatmap-cell');
    
    // Set data attributes for tooltip and interaction
    cell.dataset.date = formatDate(date);
    cell.dataset.dayOfYear = dayOfYear + 1;
    
    // Calculate if the day is in the past, present, or future
    if (dayOfYear < getDayOfYear(now)) {
      // Past days - filled with color
      cell.classList.add('level-4'); // Highest intensity for passed days
    } else if (dayOfYear === getDayOfYear(now)) {
      // Today - highlight specially
      cell.classList.add('level-2');
      cell.classList.add('today');
    }
    
    // Add tooltip with date information
    cell.title = formatDateForTooltip(date);
    
    // Add cell to the heatmap
    heatmap.appendChild(cell);
  }
  
  // Add hover effect to show detailed information
  setupCellHoverEffects();
}

// Generate month labels above the heatmap
function generateMonthLabels(firstDayOfWeek) {
  const monthLabelsContainer = document.getElementById('month-labels');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  // Create labels for each month and position them correctly
  const year = new Date().getFullYear();
  let currentPosition = 0;
  
  for (let month = 0; month < 12; month++) {
    // Calculate days in this month
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    // Calculate the width of this month in cells
    let monthStartPosition = new Date(year, month, 1).getDay();
    
    // For January, adjust based on the first day of the year
    if (month === 0) {
      monthStartPosition = firstDayOfWeek;
    }
    
    // Create the month label
    const label = document.createElement('div');
    label.classList.add('month-label');
    label.textContent = months[month];
    
    // Set the width to span the number of days in the month
    // In a grid of 53 columns, each month gets width based on its days
    label.style.width = `${daysInMonth * 18}px`; // 15px cell + 3px gap
    
    monthLabelsContainer.appendChild(label);
    
    currentPosition += daysInMonth;
  }
}

// Helper function to format date as YYYY-MM-DD
function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Format date for tooltip display
function formatDateForTooltip(date) {
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  return date.toLocaleDateString(undefined, options);
}

// Calculate the day of the year (1-366)
function getDayOfYear(date) {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date - start;
  const oneDay = 24 * 60 * 60 * 1000;
  return Math.floor(diff / oneDay) - 1; // -1 because we want 0-indexed
}

// Set up hover effects and interaction for heatmap cells
function setupCellHoverEffects() {
  const cells = document.querySelectorAll('.heatmap-cell:not(.empty)');
  
  cells.forEach(cell => {
    cell.addEventListener('mouseover', () => {
      // Display date information when hovering
      const date = cell.dataset.date;
      const dayOfYear = cell.dataset.dayOfYear;
      // You could show this info in a tooltip or status bar
    });
    
    cell.addEventListener('click', () => {
      // Potential future functionality for clicking on a day
      // e.g., adding notes, setting goals, etc.
    });
  });
}

// Apply different intensity levels based on settings
function applyIntensityLevels(intensity) {
  // Update CSS variables for dot colors based on intensity setting
  const root = document.documentElement;
  
  // Adjust the color intensity
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
}

// Call generateHeatmap when the script loads
document.addEventListener('DOMContentLoaded', () => {
  generateHeatmap();
  
  // Listen for settings changes
  chrome.storage.sync.get(['colorIntensity'], (result) => {
    if (result.colorIntensity) {
      applyIntensityLevels(result.colorIntensity);
    }
  });
}); 