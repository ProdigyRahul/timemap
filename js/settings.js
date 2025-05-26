// Settings management for TimeMap extension

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const themeSelect = document.getElementById('theme-select');
  const themePreviews = document.querySelectorAll('.theme-preview');
  const dotShapeSelect = document.getElementById('dot-shape');
  const dotSizeInput = document.getElementById('dot-size');
  const colorIntensityInput = document.getElementById('color-intensity');
  const showQuotesSelect = document.getElementById('show-quotes');
  const showTasksSelect = document.getElementById('show-tasks');
  const exportDataBtn = document.getElementById('export-data');
  const importDataBtn = document.getElementById('import-data');
  const resetSettingsBtn = document.getElementById('reset-settings');
  
  // Load and initialize settings
  loadSettings();
  
  // Event listeners
  if (themeSelect) themeSelect.addEventListener('change', saveThemeSetting);
  if (dotShapeSelect) dotShapeSelect.addEventListener('change', saveDotShapeSetting);
  if (dotSizeInput) dotSizeInput.addEventListener('input', saveDotSizeSetting);
  if (colorIntensityInput) colorIntensityInput.addEventListener('input', saveColorIntensitySetting);
  if (showQuotesSelect) showQuotesSelect.addEventListener('change', saveQuotesSetting);
  if (showTasksSelect) showTasksSelect.addEventListener('change', saveTasksSetting);
  if (exportDataBtn) exportDataBtn.addEventListener('click', exportData);
  if (importDataBtn) importDataBtn.addEventListener('click', importData);
  if (resetSettingsBtn) resetSettingsBtn.addEventListener('click', resetSettings);
  
  // Theme preview event listeners
  themePreviews.forEach(preview => {
    preview.addEventListener('click', () => {
      const theme = preview.getAttribute('data-theme');
      themeSelect.value = theme;
      saveThemeSetting({ target: { value: theme } });
      updateActiveThemePreview();
    });
  });
  
  // Add event listener for theme changes from system
  const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  darkModeMediaQuery.addEventListener('change', handleThemeChange);
  
  // Functions
  function loadSettings() {
    chrome.storage.sync.get({
      // Default settings
      theme: 'auto',
      dotShape: 'square',
      dotSize: 3,
      colorIntensity: 3,
      showQuotes: 'daily',
      showTasks: 'true'
    }, (settings) => {
      // Apply settings to UI
      if (themeSelect) themeSelect.value = settings.theme;
      if (dotShapeSelect) dotShapeSelect.value = settings.dotShape;
      if (dotSizeInput) dotSizeInput.value = settings.dotSize;
      if (colorIntensityInput) colorIntensityInput.value = settings.colorIntensity;
      if (showQuotesSelect) showQuotesSelect.value = settings.showQuotes;
      if (showTasksSelect) showTasksSelect.value = settings.showTasks;
      
      // Update active theme preview
      updateActiveThemePreview();
      
      // Apply color intensity
      if (typeof applyIntensityLevels === 'function') {
        applyIntensityLevels(settings.colorIntensity);
      }
      
      // Update quote and tasks visibility
      updateQuoteVisibility(settings.showQuotes);
      updateTaskVisibility(settings.showTasks);
    });
  }
  
  function saveThemeSetting(e) {
    const theme = e.target.value;
    chrome.storage.sync.set({ theme: theme });
    
    // Apply theme immediately
    document.body.classList.remove('light-theme', 'dark-theme', 'blue-theme', 'purple-theme', 'sunset-theme', 'high-contrast-theme');
    
    if (theme === 'auto') {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.body.classList.add(isDark ? 'dark-theme' : 'light-theme');
    } else {
      document.body.classList.add(`${theme}-theme`);
    }
  }
  
  function saveDotShapeSetting(e) {
    const shape = e.target.value;
    chrome.storage.sync.set({ dotShape: shape });
    
    const heatmap = document.getElementById('heatmap');
    if (heatmap) {
      heatmap.classList.remove('shape-square', 'shape-circle', 'shape-rounded', 'shape-hexagon');
      heatmap.classList.add(`shape-${shape}`);
    }
  }
  
  function saveDotSizeSetting(e) {
    const size = e.target.value;
    chrome.storage.sync.set({ dotSize: size });
    
    // Update dot size in CSS
    document.documentElement.style.setProperty('--dot-size', `${size * 5}px`);
  }
  
  function saveColorIntensitySetting(e) {
    const intensity = e.target.value;
    chrome.storage.sync.set({ colorIntensity: intensity });
    
    // Apply intensity immediately if function exists
    if (typeof applyIntensityLevels === 'function') {
      applyIntensityLevels(intensity);
    }
  }
  
  function saveQuotesSetting(e) {
    const quoteSetting = e.target.value;
    chrome.storage.sync.set({ showQuotes: quoteSetting });
    
    // Update quote visibility immediately
    updateQuoteVisibility(quoteSetting);
  }
  
  function saveTasksSetting(e) {
    const tasksSetting = e.target.value;
    chrome.storage.sync.set({ showTasks: tasksSetting });
    
    // Update tasks visibility immediately
    updateTaskVisibility(tasksSetting);
  }
  
  function updateQuoteVisibility(setting) {
    const quoteSection = document.querySelector('.quote-section');
    if (quoteSection) {
      quoteSection.style.display = setting === 'never' ? 'none' : 'block';
      
      // If setting is 'always', refresh the quote
      if (setting === 'always' && window.loadQuote) {
        window.loadQuote('always');
      }
    }
  }
  
  function updateTaskVisibility(setting) {
    const tasksSection = document.querySelector('.tasks-section');
    if (tasksSection) {
      tasksSection.style.display = setting === 'false' ? 'none' : 'block';
    }
  }
  
  function handleThemeChange(e) {
    // Only update if the current theme is set to 'auto'
    chrome.storage.sync.get(['theme'], (result) => {
      if (result.theme === 'auto') {
        const themeClass = e.matches ? 'dark-theme' : 'light-theme';
        
        // Remove all theme classes
        document.body.classList.remove('light-theme', 'dark-theme');
        
        // Add the appropriate theme class
        document.body.classList.add(themeClass);
      }
    });
  }
  
  function updateActiveThemePreview() {
    // Remove active class from all previews
    themePreviews.forEach(preview => {
      preview.classList.remove('active');
    });
    
    // Add active class to current theme
    const currentTheme = themeSelect ? themeSelect.value : 'auto';
    const activePreview = document.querySelector(`.theme-preview[data-theme="${currentTheme}"]`);
    if (activePreview) {
      activePreview.classList.add('active');
    }
  }
  
  function exportData() {
    chrome.storage.sync.get(null, (settings) => {
      const dataStr = JSON.stringify(settings, null, 2);
      const dataBlob = new Blob([dataStr], {type: 'application/json'});
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.download = 'timemap_settings.json';
      link.href = url;
      link.click();
      
      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 100);
    });
  }
  
  function importData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    
    input.addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        const reader = new FileReader();
        
        reader.onload = (event) => {
          try {
            const settings = JSON.parse(event.target.result);
            chrome.storage.sync.set(settings, () => {
              // Reload the page to apply imported settings
              window.location.reload();
            });
          } catch (err) {
            console.error('Error parsing settings file:', err);
            alert('Error importing settings. Please check the file format.');
          }
        };
        
        reader.readAsText(e.target.files[0]);
      }
    });
    
    input.click();
  }
  
  function resetSettings() {
    if (confirm('Are you sure you want to reset all settings to default?')) {
      const defaultSettings = {
        theme: 'auto',
        dotShape: 'square',
        dotSize: 3,
        colorIntensity: 3,
        showQuotes: 'daily',
        showTasks: 'true'
      };
      
      chrome.storage.sync.set(defaultSettings, () => {
        // Reload the page to apply default settings
        window.location.reload();
      });
    }
  }
}); 