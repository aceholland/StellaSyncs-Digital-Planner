/* ==========================================================================
   StellaSyncs Application Logic
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
  
  // Date Picker
  const datePicker = document.getElementById('sidebar-date-picker');

  // LocalStorage keys for global configurations
  const GLOBAL_KEYS = {
    theme: 'stellasyncs_theme',
    font: 'stellasyncs_font',
    lineStyle: 'stellasyncs_linestyle',
    showSchedule: 'stellasyncs_showschedule',
    showWater: 'stellasyncs_showwater',
    showMood: 'stellasyncs_showmood',
    showMeals: 'stellasyncs_showmeals'
  };

  // Active Date State
  let currentDate = '';

  /* ==========================================================================
     1. Local Date Handling (Preventing Timezone Shift)
     ========================================================================== */
  function parseLocalDate(dateStr) {
    const parts = dateStr.split('-');
    return new Date(parts[0], parts[1] - 1, parts[2]);
  }

  function formatLocalDate(dateObj) {
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
    const d = String(dateObj.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  function formatDateLong(dateStr) {
    const d = parseLocalDate(dateStr);
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return d.toLocaleDateString('en-US', options);
  }

  /* ==========================================================================
     2. Weekday Navigation Mapping
     ========================================================================== */
  function getWeekDays(dateStr) {
    const d = parseLocalDate(dateStr);
    const day = d.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
    const dayIndex = day === 0 ? 6 : day - 1; // Map Sun to 6, Mon to 0
    
    const monday = new Date(d);
    monday.setDate(d.getDate() - dayIndex);
    
    const weekDates = [];
    for (let i = 0; i < 7; i++) {
      const temp = new Date(monday);
      temp.setDate(monday.getDate() + i);
      weekDates.push(formatLocalDate(temp));
    }
    return weekDates;
  }

  function updateWeekdayDots() {
    const weekDates = getWeekDays(currentDate);
    dayDots.forEach((dot, idx) => {
      const dotDate = weekDates[idx];
      dot.setAttribute('data-date', dotDate);
      if (dotDate === currentDate) {
        dot.classList.add('selected');
      } else {
        dot.classList.remove('selected');
      }
    });
  }

  // Bind Weekday Dot clicks
  dayDots.forEach(dot => {
    dot.addEventListener('click', () => {
      const targetDate = dot.getAttribute('data-date');
      if (targetDate && targetDate !== currentDate) {
        saveCurrentDayData();
        currentDate = targetDate;
        datePicker.value = currentDate;
        localStorage.setItem('stellasyncs_active_date', currentDate);
        loadDayData(currentDate);
        updateWeekdayDots();
      }
    });
  });

  /* ==========================================================================
     3. DOM Element Creator Helpers (Supports Dynamic Addition)
     ========================================================================== */
  function createPriorityRow(num, text = '') {
    const row = document.createElement('div');
    row.className = 'priority-row';
    
    const span = document.createElement('span');
    span.className = 'number';
    span.textContent = num;
    
    const input = document.createElement('div');
    input.className = 'editable-text line-input';
    input.contentEditable = 'true';
    input.setAttribute('placeholder', 'Priority focus...');
    input.textContent = text;
    
    row.appendChild(span);
    row.appendChild(input);
    return row;
  }

  function createTaskRow(text = '', completed = false) {
    const row = document.createElement('div');
    row.className = 'task-row';
    if (completed) row.classList.add('completed');
    
    const btn = document.createElement('button');
    btn.className = 'task-checkbox';
    if (completed) btn.classList.add('checked');
    btn.addEventListener('click', () => {
      const isCompleted = row.classList.toggle('completed');
      btn.classList.toggle('checked', isCompleted);
      saveCurrentDayData();
    });
    
    const input = document.createElement('div');
    input.className = 'editable-text task-input';
    input.contentEditable = 'true';
    input.setAttribute('placeholder', 'Add a new task...');
    input.textContent = text;
    
    row.appendChild(btn);
    row.appendChild(input);
    return row;
  }

  function createMealBlock(label, text = '') {
    const block = document.createElement('div');
    block.className = 'meal-block';
    
    const span = document.createElement('span');
    span.className = 'meal-label';
    span.textContent = label;
    
    const input = document.createElement('div');
    input.className = 'editable-text meal-input';
    input.contentEditable = 'true';
    input.setAttribute('placeholder', 'Meal item...');
    input.textContent = text;
    
    block.appendChild(span);
    block.appendChild(input);
    return block;
  }

  function createWaterCup(num, filled = false) {
    const cup = document.createElement('span');
    cup.className = 'cup-icon';
    if (filled) cup.classList.add('filled');
    cup.setAttribute('data-cup', num);
    cup.setAttribute('title', `Glass ${num}`);
    
    cup.addEventListener('click', () => {
      const cupIcons = document.querySelectorAll('.cup-icon');
      const idx = num - 1;
      const wasFilled = cup.classList.contains('filled');
      
      if (wasFilled) {
        for (let i = idx; i < cupIcons.length; i++) {
          cupIcons[i].classList.remove('filled');
        }
      } else {
        for (let i = 0; i <= idx; i++) {
          cupIcons[i].classList.add('filled');
        }
      }
      saveCurrentDayData();
    });
    return cup;
  }

  function createMoodBtn(mood, selected = false) {
    const btn = document.createElement('button');
    btn.className = 'mood-btn';
    if (selected) btn.classList.add('selected');
    btn.setAttribute('data-mood', mood);
    btn.setAttribute('title', mood.charAt(0).toUpperCase() + mood.slice(1));
    btn.textContent = mood.charAt(0).toUpperCase() + mood.slice(1);
    
    btn.addEventListener('click', () => {
      const isSelected = btn.classList.contains('selected');
      document.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('selected'));
      if (!isSelected) {
        btn.classList.add('selected');
      }
      saveCurrentDayData();
    });
    return btn;
  }

  function createGratitudeRow(text = '') {
    const input = document.createElement('div');
    input.className = 'editable-text gratitude-input';
    input.contentEditable = 'true';
    input.setAttribute('placeholder', 'Start writing something positive...');
    input.textContent = text;
    return input;
  }

  /* ==========================================================================
     4. Save / Load Day-Specific Diary Data
     ========================================================================== */
  function saveCurrentDayData() {
    if (!currentDate) return;

    // Fetch Priorities
    const priorities = [];
    document.querySelectorAll('.section-priorities .priority-row .line-input').forEach(input => {
      priorities.push(input.textContent);
    });

    // Fetch Tasks
    const tasks = [];
    document.querySelectorAll('.section-tasks .task-row').forEach(row => {
      const text = row.querySelector('.task-input').textContent;
      const completed = row.classList.contains('completed');
      tasks.push({ text, completed });
    });

    // Fetch Meals
    const meals = [];
    document.querySelectorAll('.section-meals .meal-block').forEach(block => {
      const label = block.querySelector('.meal-label').textContent;
      const text = block.querySelector('.meal-input').textContent;
      meals.push({ label, text });
    });

    // Fetch Water cups
    const cups = document.querySelectorAll('.cup-icon');
    const totalWaterCups = cups.length;
    let waterLevel = 0;
    cups.forEach((cup, idx) => {
      if (cup.classList.contains('filled')) {
        waterLevel = idx + 1;
      }
    });

    // Fetch Mood
    const moods = [];
    document.querySelectorAll('.mood-btn').forEach(btn => {
      moods.push(btn.dataset.mood);
    });
    const selectedMoodBtn = document.querySelector('.mood-btn.selected');
    const selectedMood = selectedMoodBtn ? selectedMoodBtn.dataset.mood : '';

    // Fetch Gratitude rows
    const gratitude = [];
    document.querySelectorAll('.section-gratitude .gratitude-input').forEach(input => {
      gratitude.push(input.textContent);
    });

    // Header Title and Footer
    const title = document.querySelector('.editable-title').textContent;
    const dateText = document.querySelector('.editable-date').textContent;
    const footer = document.querySelector('.planner-footer .footer-text').textContent;

    // Schedule ranges and texts
    const schedStart = parseInt(startSelect.value, 10);
    const schedEnd = parseInt(endSelect.value, 10);
    const schedEntries = {};
    document.querySelectorAll('.schedule-inputs .schedule-input').forEach(input => {
      const time = input.getAttribute('data-time');
      schedEntries[time] = input.textContent;
    });

    const dayObj = {
      title,
      dateText,
      priorities,
      tasks,
      meals,
      waterLevel,
      totalWaterCups,
      moods,
      selectedMood,
      gratitude,
      footer,
      schedStart,
      schedEnd,
      schedEntries
    };

    localStorage.setItem('stellasyncs_diary_' + currentDate, JSON.stringify(dayObj));
  }

  function loadDayData(dateString) {
    const saved = localStorage.getItem('stellasyncs_diary_' + dateString);
    let data = null;
    
    if (saved) {
      try {
        data = JSON.parse(saved);
      } catch (e) {
        console.error("Error parsing diary entry for " + dateString, e);
      }
    }

    // Default configuration if no entry exists
    if (!data) {
      data = {
        title: 'daily planner',
        dateText: formatDateLong(dateString),
        priorities: ['', '', ''],
        tasks: [
          { text: '', completed: false },
          { text: '', completed: false },
          { text: '', completed: false },
          { text: '', completed: false },
          { text: '', completed: false },
          { text: '', completed: false },
          { text: '', completed: false },
          { text: '', completed: false }
        ],
        meals: [
          { label: 'B', text: '' },
          { label: 'L', text: '' },
          { label: 'D', text: '' },
          { label: 'S', text: '' }
        ],
        waterLevel: 0,
        totalWaterCups: 8,
        moods: ['great', 'good', 'neutral', 'tired', 'stressed'],
        selectedMood: '',
        gratitude: [''],
        footer: 'Create a life you love. \u2022 StellaSyncs Design',
        schedStart: 6,
        schedEnd: 22,
        schedEntries: {}
      };
    }

    // Populate standard headers
    document.querySelector('.editable-title').textContent = data.title || 'daily planner';
    document.querySelector('.editable-date').textContent = data.dateText || formatDateLong(dateString);
    document.querySelector('.planner-footer .footer-text').textContent = data.footer || 'Create a life you love. \u2022 StellaSyncs Design';

    // Populate Priorities
    const prioritiesContainer = document.querySelector('.section-priorities .box-content');
    prioritiesContainer.innerHTML = '';
    (data.priorities || ['', '', '']).forEach((p, idx) => {
      prioritiesContainer.appendChild(createPriorityRow(idx + 1, p));
    });

    // Populate Tasks
    const tasksContainer = document.querySelector('.section-tasks .box-content');
    tasksContainer.innerHTML = '';
    (data.tasks || []).forEach(t => {
      tasksContainer.appendChild(createTaskRow(t.text, t.completed));
    });

    // Populate Meals
    const mealsContainer = document.querySelector('.section-meals .box-content');
    mealsContainer.innerHTML = '';
    (data.meals || []).forEach(m => {
      mealsContainer.appendChild(createMealBlock(m.label, m.text));
    });

    // Populate Water
    const cupGrid = document.querySelector('.cup-grid');
    cupGrid.innerHTML = '';
    const totalCups = data.totalWaterCups || 8;
    for (let i = 1; i <= totalCups; i++) {
      cupGrid.appendChild(createWaterCup(i, i <= data.waterLevel));
    }

    // Populate Moods
    const moodGrid = document.querySelector('.mood-grid');
    moodGrid.innerHTML = '';
    (data.moods || ['great', 'good', 'neutral', 'tired', 'stressed']).forEach(m => {
      moodGrid.appendChild(createMoodBtn(m, m === data.selectedMood));
    });

    // Populate Gratitude
    const gratitudeContainer = document.querySelector('.section-gratitude .box-content');
    gratitudeContainer.innerHTML = '';
    (data.gratitude || ['']).forEach(g => {
      gratitudeContainer.appendChild(createGratitudeRow(g));
    });

    // Populate Schedule Start/End selections
    startSelect.value = (data.schedStart !== undefined) ? data.schedStart.toString() : '6';
    endSelect.value = (data.schedEnd !== undefined) ? data.schedEnd.toString() : '22';

    // Render Schedule rows
    renderSchedule(data.schedEntries || {});
  }

  /* ==========================================================================
     5. Schedule Generation Logic
     ========================================================================== */
  function formatHourLabel(hourValue) {
    const normalizedHour = hourValue % 24;
    const isPM = hourValue >= 12 && hourValue < 24;
    const displayHour = normalizedHour === 0 ? 12 : (normalizedHour > 12 ? normalizedHour - 12 : normalizedHour);
    const amampm = hourValue >= 12 && hourValue < 24 ? 'PM' : 'AM';
    return `${displayHour}:00 ${amampm}`;
  }

  function renderSchedule(savedEntries = null) {
    if (!scheduleContainer) return;

    const startHour = parseInt(startSelect.value, 10);
    const endHour = parseInt(endSelect.value, 10);

    // Correct invalid range
    if (startHour >= endHour) {
      endSelect.value = Math.min(startHour + 4, 26).toString();
      renderSchedule(savedEntries);
      return;
    }

    // Grab currently entered schedule values from DOM before replacing, if savedEntries not provided
    if (!savedEntries) {
      savedEntries = {};
      document.querySelectorAll('.schedule-inputs .schedule-input').forEach(input => {
        const time = input.getAttribute('data-time');
        savedEntries[time] = input.textContent;
      });
    }

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

      // Inline save binding
      inputDiv.addEventListener('input', () => {
        saveCurrentDayData();
      });

      row.appendChild(labelSpan);
      row.appendChild(inputDiv);
      scheduleContainer.appendChild(row);
    }
  }

  startSelect.addEventListener('change', () => {
    renderSchedule();
    saveCurrentDayData();
  });
  
  endSelect.addEventListener('change', () => {
    renderSchedule();
    saveCurrentDayData();
  });

  /* ==========================================================================
     6. Heading '+' Dynamic Expansion Click Handlers
     ========================================================================== */
  document.getElementById('add-priority').addEventListener('click', () => {
    const container = document.querySelector('.section-priorities .box-content');
    const num = container.children.length + 1;
    const newRow = createPriorityRow(num);
    container.appendChild(newRow);
    newRow.querySelector('.line-input').focus();
    saveCurrentDayData();
  });

  document.getElementById('add-schedule-hour').addEventListener('click', () => {
    let endHour = parseInt(endSelect.value, 10);
    if (endHour < 26) {
      endHour++;
      endSelect.value = endHour.toString();
      renderSchedule();
      saveCurrentDayData();
    } else {
      alert("Maximum schedule end hour is 2:00 AM!");
    }
  });

  document.getElementById('add-task').addEventListener('click', () => {
    const container = document.querySelector('.section-tasks .box-content');
    const newRow = createTaskRow();
    container.appendChild(newRow);
    newRow.querySelector('.task-input').focus();
    saveCurrentDayData();
  });

  document.getElementById('add-meal').addEventListener('click', () => {
    const container = document.querySelector('.section-meals .box-content');
    const labels = ['B', 'L', 'D', 'S'];
    const idx = container.children.length;
    const label = idx < labels.length ? labels[idx] : `S${idx - labels.length + 2}`;
    const newBlock = createMealBlock(label);
    container.appendChild(newBlock);
    newBlock.querySelector('.meal-input').focus();
    saveCurrentDayData();
  });

  document.getElementById('add-water').addEventListener('click', () => {
    const container = document.querySelector('.cup-grid');
    const num = container.children.length + 1;
    const newCup = createWaterCup(num);
    container.appendChild(newCup);
    saveCurrentDayData();
  });

  document.getElementById('add-mood').addEventListener('click', () => {
    const customMood = prompt("Enter custom mood name:");
    if (customMood && customMood.trim()) {
      const moodClean = customMood.trim().toLowerCase();
      // Check if exists
      if (document.querySelector(`.mood-btn[data-mood="${moodClean}"]`)) {
        alert("Mood already exists!");
        return;
      }
      const container = document.querySelector('.mood-grid');
      const newBtn = createMoodBtn(moodClean);
      container.appendChild(newBtn);
      saveCurrentDayData();
    }
  });

  document.getElementById('add-gratitude').addEventListener('click', () => {
    const container = document.querySelector('.section-gratitude .box-content');
    const newRow = createGratitudeRow();
    container.appendChild(newRow);
    newRow.focus();
    saveCurrentDayData();
  });

  /* ==========================================================================
     7. Theme Selector Logic
     ========================================================================== */
  function applyTheme(themeName) {
    const themes = [
      'theme-graph-bw', 'theme-graph-black',
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
    
    plannerPage.classList.add(`theme-${themeName}`);
    plannerPage.setAttribute('data-theme', themeName);

    themeCards.forEach(card => {
      if (card.dataset.theme === themeName) {
        card.classList.add('active');
      } else {
        card.classList.remove('active');
      }
    });

    localStorage.setItem(GLOBAL_KEYS.theme, themeName);
  }

  themeCards.forEach(card => {
    card.addEventListener('click', () => {
      const theme = card.dataset.theme;
      applyTheme(theme);
    });
  });

  /* ==========================================================================
     8. Layout Customization Logic (Global)
     ========================================================================== */
  fontSelector.addEventListener('change', (e) => {
    applyFont(e.target.value);
  });

  function applyFont(fontName) {
    const fonts = [
      'font-retro-serif', 'font-modern-sans', 'font-vintage-typewriter',
      'font-brutalist-syne', 'font-coquette-script', 'font-playful-round',
      'font-editorial-bodoni', 'font-casual-handwritten', 'font-dancing-script',
      'font-pacifico', 'font-playpen', 'font-poppins', 'font-lora',
      'font-cormorant', 'font-sketchy'
    ];
    fonts.forEach(f => plannerPage.classList.remove(f));
    
    if (fontName !== 'theme-default') {
      plannerPage.classList.add(fontName);
    }
    fontSelector.value = fontName;
    localStorage.setItem(GLOBAL_KEYS.font, fontName);
  }

  lineStyleSelector.addEventListener('change', (e) => {
    applyLineStyle(e.target.value);
  });

  function applyLineStyle(styleName) {
    const styles = ['style-lined', 'style-dotted', 'style-grid', 'style-dashed', 'style-underlined', 'style-blank'];
    styles.forEach(s => plannerPage.classList.remove(s));
    plannerPage.classList.add(styleName);
    
    lineStyleSelector.value = styleName;
    localStorage.setItem(GLOBAL_KEYS.lineStyle, styleName);
  }

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
    
    if (section === 'schedule') {
      showTimeCheckbox.checked = show;
      localStorage.setItem(GLOBAL_KEYS.showSchedule, show);
    } else if (section === 'water') {
      showWaterCheckbox.checked = show;
      localStorage.setItem(GLOBAL_KEYS.showWater, show);
    } else if (section === 'mood') {
      showMoodCheckbox.checked = show;
      localStorage.setItem(GLOBAL_KEYS.showMood, show);
    } else if (section === 'meals') {
      showMealCheckbox.checked = show;
      localStorage.setItem(GLOBAL_KEYS.showMeals, show);
    }
  }

  /* ==========================================================================
     9. Global Print, Drawer Collapse & Autosave Events
     ========================================================================== */
  printBtn.addEventListener('click', () => {
    window.print();
  });

  hamburgerBtn.addEventListener('click', () => {
    appContainer.classList.toggle('menu-open');
  });

  appContainer.addEventListener('click', (e) => {
    const isMenuOpen = appContainer.classList.contains('menu-open');
    if (isMenuOpen && !e.target.closest('.sidebar') && !e.target.closest('.hamburger-btn')) {
      appContainer.classList.remove('menu-open');
    }
  });

  // Event Delegation for Contenteditable Inputs
  plannerPage.addEventListener('input', (e) => {
    if (e.target.matches('[contenteditable="true"]')) {
      saveCurrentDayData();
    }
  });

  // Date picker listener
  datePicker.addEventListener('change', (e) => {
    const newDate = e.target.value;
    if (newDate) {
      saveCurrentDayData();
      currentDate = newDate;
      localStorage.setItem('stellasyncs_active_date', currentDate);
      loadDayData(currentDate);
      updateWeekdayDots();
    }
  });

  // Reset planner fields
  resetBtn.addEventListener('click', () => {
    if (confirm("Are you sure you want to clear all planner entries for the selected date?")) {
      localStorage.removeItem('stellasyncs_diary_' + currentDate);
      loadDayData(currentDate);
    }
  });

  /* ==========================================================================
     10. Initialize Application
     ========================================================================== */
  function initializeApp() {
    // Determine active date
    const savedActiveDate = localStorage.getItem('stellasyncs_active_date');
    const todayStr = formatLocalDate(new Date());
    currentDate = savedActiveDate || todayStr;
    
    // Set date picker value
    datePicker.value = currentDate;

    // Load theme (default: graph-bw)
    const savedTheme = localStorage.getItem(GLOBAL_KEYS.theme) || 'graph-bw';
    applyTheme(savedTheme);

    // Load font (default: theme-default)
    const savedFont = localStorage.getItem(GLOBAL_KEYS.font) || 'theme-default';
    applyFont(savedFont);

    // Load note styling (default: style-lined)
    const savedLineStyle = localStorage.getItem(GLOBAL_KEYS.lineStyle) || 'style-lined';
    applyLineStyle(savedLineStyle);

    // Load section visibilities
    const showSchedule = localStorage.getItem(GLOBAL_KEYS.showSchedule) !== 'false';
    toggleSection('schedule', showSchedule);
    
    const showWater = localStorage.getItem(GLOBAL_KEYS.showWater) !== 'false';
    toggleSection('water', showWater);

    const showMood = localStorage.getItem(GLOBAL_KEYS.showMood) !== 'false';
    toggleSection('mood', showMood);

    const showMeals = localStorage.getItem(GLOBAL_KEYS.showMeals) !== 'false';
    toggleSection('meals', showMeals);

    // Load diary entries and schedule for current date
    loadDayData(currentDate);

    // Update weekday dots
    updateWeekdayDots();
  }

  initializeApp();
});
