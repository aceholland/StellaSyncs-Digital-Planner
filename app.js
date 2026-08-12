/* ==========================================================================
   AuraPlanner Application Logic
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  // Select DOM Elements
  const plannerPage = document.getElementById('planner-page');
  const themeCards = document.querySelectorAll('.theme-card');
  const fontSelector = document.getElementById('font-adjust');
  const lineStyleSelector = document.getElementById('line-style');
  const showTimeCheckbox = document.getElementById('show-time-sec');
  const showWaterCheckbox = document.getElementById('show-water-sec');
  const showMoodCheckbox = document.getElementById('show-mood-sec');
  const showMealCheckbox = document.getElementById('show-meal-sec');
  const printBtn = document.getElementById('btn-print');
  const resetBtn = document.getElementById('btn-reset');
  const hamburgerBtn = document.getElementById('btn-hamburger');
  const appContainer = document.querySelector('.app-container');
  const startSelect = document.getElementById('schedule-start');
  const endSelect = document.getElementById('schedule-end');
  const scheduleContainer = document.getElementById('schedule-rows-container');
  
  // Weekday select elements
  const dayDots = document.querySelectorAll('.day-dot');
  
  // Water icons
  const cupIcons = document.querySelectorAll('.cup-icon');
  
  // Mood buttons
  const moodBtns = document.querySelectorAll('.mood-btn');

  // Input fields for autosave
  const editableFields = document.querySelectorAll('[contenteditable="true"]:not(.schedule-input)');

  // LocalStorage keys
  const STORAGE_KEYS = {
    theme: 'auraplanner_theme',
    font: 'auraplanner_font',
    lineStyle: 'auraplanner_linestyle',
    showSchedule: 'auraplanner_showschedule',
    showWater: 'auraplanner_showwater',
    showMood: 'auraplanner_showmood',
    showMeals: 'auraplanner_showmeals',
    selectedDay: 'auraplanner_selectedday',
    selectedMood: 'auraplanner_selectedmood',
    waterLevel: 'auraplanner_waterlevel',
    fieldData: 'auraplanner_fielddata',
    taskStates: 'auraplanner_taskstates'
  };

  /* ==========================================================================
     1. Theme Switcher Logic
     ========================================================================== */
  function applyTheme(themeName) {
    // Remove previous theme classes
    const themes = [
      'theme-concentric-hearts', 'theme-pink-wave', 'theme-coquette',
      'theme-retro-brutalist', 'theme-leopard', 'theme-amor-minimal',
      'theme-sage-gingham', 'theme-brown-wave', 'theme-latte-hearts',
      'theme-starry-night', 'theme-blue-wave', 'theme-blue-gingham',
      'theme-crimson-wave', 'theme-cherry-jam', 'theme-rustic-red-gingham',
      'theme-dark-academia', 'theme-burgundy-script', 'theme-indie-collage',
      'theme-midnight-lily', 'theme-mono-leopard', 'theme-paris-night',
      'theme-noir-coquette'
    ];
    themes.forEach(t => plannerPage.classList.remove(t));
    
    // Add current theme class
    plannerPage.classList.add(`theme-${themeName}`);
    plannerPage.setAttribute('data-theme', themeName);

    // Update active state in Sidebar UI
    themeCards.forEach(card => {
      if (card.dataset.theme === themeName) {
        card.classList.add('active');
      } else {
        card.classList.remove('active');
      }
    });

    // Save to localStorage
    localStorage.setItem(STORAGE_KEYS.theme, themeName);
  }

  themeCards.forEach(card => {
    card.addEventListener('click', () => {
      const theme = card.dataset.theme;
      applyTheme(theme);
    });
  });

  /* ==========================================================================
     2. Layout Customization Logic
     ========================================================================== */
  
  // Font Customization
  fontSelector.addEventListener('change', (e) => {
    const selectedFont = e.target.value;
    applyFont(selectedFont);
  });

  function applyFont(fontName) {
    const fonts = [
      'font-retro-serif', 'font-modern-sans', 'font-vintage-typewriter',
      'font-brutalist-syne', 'font-coquette-script', 'font-playful-round',
      'font-editorial-bodoni', 'font-casual-handwritten'
    ];
    fonts.forEach(f => plannerPage.classList.remove(f));
    
    if (fontName !== 'theme-default') {
      plannerPage.classList.add(fontName);
    }
    fontSelector.value = fontName;
    localStorage.setItem(STORAGE_KEYS.font, fontName);
  }

  // Line Style Customization
  lineStyleSelector.addEventListener('change', (e) => {
    const style = e.target.value;
    applyLineStyle(style);
  });

  function applyLineStyle(styleName) {
    const styles = ['style-lined', 'style-dotted', 'style-blank'];
    styles.forEach(s => plannerPage.classList.remove(s));
    plannerPage.classList.add(styleName);
    
    lineStyleSelector.value = styleName;
    localStorage.setItem(STORAGE_KEYS.lineStyle, styleName);
  }

  // Visibility Toggles
  showTimeCheckbox.addEventListener('change', (e) => {
    toggleSection('schedule', e.target.checked);
  });

  showWaterCheckbox.addEventListener('change', (e) => {
    toggleSection('water', e.target.checked);
  });

  showMoodCheckbox.addEventListener('change', (e) => {
    toggleSection('mood', e.target.checked);
  });

  showMealCheckbox.addEventListener('change', (e) => {
    toggleSection('meals', e.target.checked);
  });

  function toggleSection(section, show) {
    const className = `hide-${section}`;
    if (show) {
      plannerPage.classList.remove(className);
    } else {
      plannerPage.classList.add(className);
    }
    
    // Update checkboxes
    if (section === 'schedule') {
      showTimeCheckbox.checked = show;
      localStorage.setItem(STORAGE_KEYS.showSchedule, show);
    } else if (section === 'water') {
      showWaterCheckbox.checked = show;
      localStorage.setItem(STORAGE_KEYS.showWater, show);
    } else if (section === 'mood') {
      showMoodCheckbox.checked = show;
      localStorage.setItem(STORAGE_KEYS.showMood, show);
    } else if (section === 'meals') {
      showMealCheckbox.checked = show;
      localStorage.setItem(STORAGE_KEYS.showMeals, show);
    }
  }

  /* ==========================================================================
     3. Weekday, Water & Mood Interactions
     ========================================================================== */
  
  // Weekday selection (Single choice)
  dayDots.forEach(dot => {
    dot.addEventListener('click', () => {
      const isSelected = dot.classList.contains('selected');
      dayDots.forEach(d => d.classList.remove('selected'));
      
      if (!isSelected) {
        dot.classList.add('selected');
        localStorage.setItem(STORAGE_KEYS.selectedDay, dot.dataset.day);
      } else {
        localStorage.removeItem(STORAGE_KEYS.selectedDay);
      }
    });
  });

  // Water tracker clicks
  cupIcons.forEach((cup, idx) => {
    cup.addEventListener('click', () => {
      const wasFilled = cup.classList.contains('filled');
      
      // If clicking already filled cup, clear cups from this level upwards
      // Else fill cups up to this level
      if (wasFilled) {
        for (let i = idx; i < cupIcons.length; i++) {
          cupIcons[i].classList.remove('filled');
        }
      } else {
        for (let i = 0; i <= idx; i++) {
          cupIcons[i].classList.add('filled');
        }
      }
      
      // Save water count
      const filledCount = document.querySelectorAll('.cup-icon.filled').length;
      localStorage.setItem(STORAGE_KEYS.waterLevel, filledCount);
    });
  });

  // Mood selector buttons
  moodBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const isSelected = btn.classList.contains('selected');
      moodBtns.forEach(b => b.classList.remove('selected'));
      
      if (!isSelected) {
        btn.classList.add('selected');
        localStorage.setItem(STORAGE_KEYS.selectedMood, btn.dataset.mood);
      } else {
        localStorage.removeItem(STORAGE_KEYS.selectedMood);
      }
    });
  });

  // Task rows completion toggle
  const taskRows = document.querySelectorAll('.task-row');
  taskRows.forEach((row, idx) => {
    const checkbox = row.querySelector('.task-checkbox');
    checkbox.addEventListener('click', () => {
      const isCompleted = row.classList.toggle('completed');
      checkbox.classList.toggle('checked', isCompleted);
      saveTaskStates();
    });
  });

  function saveTaskStates() {
    const states = [];
    taskRows.forEach(row => {
      states.push(row.classList.contains('completed'));
    });
    localStorage.setItem(STORAGE_KEYS.taskStates, JSON.stringify(states));
  }

  function loadTaskStates() {
    const saved = localStorage.getItem(STORAGE_KEYS.taskStates);
    if (saved) {
      try {
        const states = JSON.parse(saved);
        taskRows.forEach((row, idx) => {
          if (states[idx]) {
            row.classList.add('completed');
            row.querySelector('.task-checkbox').classList.add('checked');
          }
        });
      } catch (e) {
        console.error("Error parsing task states", e);
      }
    }
  }

  /* ==========================================================================
     4. Content persistence (Auto-save in localStorage)
     ========================================================================== */
  
  // Attach keyup and blur listeners to all editable content fields
  editableFields.forEach((field, index) => {
    // Generate a unique identifier for each field using index
    field.setAttribute('data-field-idx', index);
    
    field.addEventListener('input', () => {
      saveFieldData();
    });
  });

  function saveFieldData() {
    const fieldData = {};
    editableFields.forEach(field => {
      const idx = field.getAttribute('data-field-idx');
      fieldData[idx] = field.innerText;
    });
    localStorage.setItem(STORAGE_KEYS.fieldData, JSON.stringify(fieldData));
  }

  function loadFieldData() {
    const saved = localStorage.getItem(STORAGE_KEYS.fieldData);
    if (saved) {
      try {
        const fieldData = JSON.parse(saved);
        editableFields.forEach(field => {
          const idx = field.getAttribute('data-field-idx');
          if (fieldData[idx] !== undefined) {
            field.innerText = fieldData[idx];
          }
        });
      } catch (e) {
        console.error("Error loading field data", e);
      }
    }
  }

  /* ==========================================================================
     5. Reset & Print Functionality
     ========================================================================== */
  
  // Print Daily Planner
  printBtn.addEventListener('click', () => {
    window.print();
  });

  // Drawer Collapse Toggle logic
  hamburgerBtn.addEventListener('click', () => {
    appContainer.classList.toggle('menu-open');
  });

  // Close menu drawer if clicking on the background overlay
  appContainer.addEventListener('click', (e) => {
    const isMenuOpen = appContainer.classList.contains('menu-open');
    if (isMenuOpen && !e.target.closest('.sidebar') && !e.target.closest('.hamburger-btn')) {
      appContainer.classList.remove('menu-open');
    }
  });

  // Dynamic Hour Range Schedule Generation
  function formatHourLabel(hourValue) {
    const normalizedHour = hourValue % 24;
    const isPM = hourValue >= 12 && hourValue < 24;
    const displayHour = normalizedHour === 0 ? 12 : (normalizedHour > 12 ? normalizedHour - 12 : normalizedHour);
    const amampm = hourValue >= 12 && hourValue < 24 ? 'PM' : 'AM';
    return `${displayHour}:00 ${amampm}`;
  }

  function renderSchedule() {
    if (!scheduleContainer) return;
    
    const startHour = parseInt(startSelect.value, 10);
    const endHour = parseInt(endSelect.value, 10);
    
    // Auto-correct invalid ranges
    if (startHour >= endHour) {
      endSelect.value = Math.min(startHour + 4, 26).toString();
      renderSchedule();
      return;
    }
    
    localStorage.setItem('auraplanner_sched_start', startSelect.value);
    localStorage.setItem('auraplanner_sched_end', endSelect.value);
    
    let savedEntries = {};
    try {
      savedEntries = JSON.parse(localStorage.getItem('auraplanner_sched_entries') || '{}');
    } catch(e) {}
    
    scheduleContainer.innerHTML = '';
    
    for (let h = startHour; h <= endHour; h++) {
      const timeLabel = formatHourLabel(h);
      const savedText = savedEntries[timeLabel] || '';
      
      const row = document.createElement('div');
      row.className = 'schedule-row';
      
      const labelSpan = document.createElement('span');
      labelSpan.className = 'time-label';
      labelSpan.textContent = timeLabel;
      
      const inputDiv = document.createElement('div');
      inputDiv.className = 'editable-text schedule-input';
      inputDiv.contentEditable = 'true';
      inputDiv.setAttribute('placeholder', '...');
      inputDiv.setAttribute('data-time', timeLabel);
      inputDiv.textContent = savedText;
      
      // Bind inline autosave for schedule row
      inputDiv.addEventListener('input', () => {
        savedEntries[timeLabel] = inputDiv.textContent;
        localStorage.setItem('auraplanner_sched_entries', JSON.stringify(savedEntries));
      });
      
      row.appendChild(labelSpan);
      row.appendChild(inputDiv);
      scheduleContainer.appendChild(row);
    }
  }

  startSelect.addEventListener('change', renderSchedule);
  endSelect.addEventListener('change', renderSchedule);

  // Reset planner fields and controls
  resetBtn.addEventListener('click', () => {
    if (confirm("Are you sure you want to clear all your planner entries?")) {
      // Clear fields text
      editableFields.forEach(field => {
        field.innerText = '';
      });
      
      // Deselect weekdays
      dayDots.forEach(dot => dot.classList.remove('selected'));
      
      // Clear water cups
      cupIcons.forEach(cup => cup.classList.remove('filled'));
      
      // Clear mood selection
      moodBtns.forEach(btn => btn.classList.remove('selected'));
      
      // Clear task states
      taskRows.forEach(row => {
        row.classList.remove('completed');
        row.querySelector('.task-checkbox').classList.remove('checked');
      });

      // Clear schedule range entries
      localStorage.removeItem('auraplanner_sched_entries');
      renderSchedule();

      // Clear related localStorage items
      localStorage.removeItem(STORAGE_KEYS.selectedDay);
      localStorage.removeItem(STORAGE_KEYS.selectedMood);
      localStorage.removeItem(STORAGE_KEYS.waterLevel);
      localStorage.removeItem(STORAGE_KEYS.fieldData);
      localStorage.removeItem(STORAGE_KEYS.taskStates);
    }
  });

  /* ==========================================================================
     6. Load Initial Configuration from LocalStorage
     ========================================================================== */
  function initializeApp() {
    // 1. Theme
    const savedTheme = localStorage.getItem(STORAGE_KEYS.theme) || 'concentric-hearts';
    applyTheme(savedTheme);

    // 2. Font
    const savedFont = localStorage.getItem(STORAGE_KEYS.font) || 'theme-default';
    applyFont(savedFont);

    // 3. Line Style
    const savedLineStyle = localStorage.getItem(STORAGE_KEYS.lineStyle) || 'style-lined';
    applyLineStyle(savedLineStyle);

    // Load schedule start and end configurations
    const savedStart = localStorage.getItem('auraplanner_sched_start') || '6';
    const savedEnd = localStorage.getItem('auraplanner_sched_end') || '22';
    startSelect.value = savedStart;
    endSelect.value = savedEnd;
    renderSchedule();

    // 4. Section Visibilities
    const showSchedule = localStorage.getItem(STORAGE_KEYS.showSchedule) !== 'false';
    toggleSection('schedule', showSchedule);
    
    const showWater = localStorage.getItem(STORAGE_KEYS.showWater) !== 'false';
    toggleSection('water', showWater);

    const showMood = localStorage.getItem(STORAGE_KEYS.showMood) !== 'false';
    toggleSection('mood', showMood);

    const showMeals = localStorage.getItem(STORAGE_KEYS.showMeals) !== 'false';
    toggleSection('meals', showMeals);

    // 5. Selected Day
    const savedDay = localStorage.getItem(STORAGE_KEYS.selectedDay);
    if (savedDay) {
      const dot = document.querySelector(`.day-dot[data-day="${savedDay}"]`);
      if (dot) dot.classList.add('selected');
    }

    // 6. Selected Water Level
    const savedWater = parseInt(localStorage.getItem(STORAGE_KEYS.waterLevel) || '0', 10);
    for (let i = 0; i < savedWater; i++) {
      if (cupIcons[i]) cupIcons[i].classList.add('filled');
    }

    // 7. Selected Mood
    const savedMood = localStorage.getItem(STORAGE_KEYS.selectedMood);
    if (savedMood) {
      const btn = document.querySelector(`.mood-btn[data-mood="${savedMood}"]`);
      if (btn) btn.classList.add('selected');
    }

    // 8. Field Data Content
    loadFieldData();

    // 9. Task Checkbox States
    loadTaskStates();
  }

  initializeApp();
});
