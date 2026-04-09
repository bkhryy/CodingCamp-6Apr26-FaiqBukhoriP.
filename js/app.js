// js/app.js — Personal Dashboard

// ---------------------------------------------------------------------------
// storage module
// Thin wrapper around localStorage with try/catch and a singleton error banner.
// ---------------------------------------------------------------------------
const storage = (function () {
  let bannerShown = false;

  function showBanner(msg) {
    if (bannerShown) return;
    bannerShown = true;
    const banner = document.getElementById('error-banner');
    const message = document.getElementById('error-banner-message');
    if (banner && message) {
      message.textContent = msg || 'localStorage is unavailable — your data will not be saved.';
      banner.hidden = false;
    }
  }

  function load(key) {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return null;
      return JSON.parse(raw);
    } catch (_) {
      return null;
    }
  }

  function save(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (_) {
      showBanner('Unable to save data — localStorage is full or unavailable.');
    }
  }

  function isAvailable() {
    const TEST_KEY = '__storage_test__';
    try {
      localStorage.setItem(TEST_KEY, '1');
      localStorage.removeItem(TEST_KEY);
      return true;
    } catch (_) {
      return false;
    }
  }

  return { load, save, isAvailable };
}());

// ---------------------------------------------------------------------------
// theme module
// Manages light/dark theme: reads from storage, detects system preference,
// applies data-theme attribute to <html>, and updates the toggle button.
// ---------------------------------------------------------------------------
const theme = (function () {
  const STORAGE_KEY = 'dashboard_theme';
  const state = { current: 'light' };

  function apply(value) {
    state.current = value;
    document.documentElement.setAttribute('data-theme', value);
    const btn = document.getElementById('theme-toggle');
    if (btn) {
      btn.textContent = value === 'dark' ? '☀️' : '🌙';
      btn.setAttribute('aria-label', value === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
    }
  }

  function init() {
    const stored = storage.load(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') {
      apply(stored);
    } else {
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      apply(prefersDark ? 'dark' : 'light');
    }
  }

  function toggle() {
    const next = state.current === 'dark' ? 'light' : 'dark';
    storage.save(STORAGE_KEY, next);
    apply(next);
  }

  function getCurrent() {
    return state.current;
  }

  return { init, toggle, apply, getCurrent };
}());

// ---------------------------------------------------------------------------
// greeting module
// Manages time-based greeting, clock display, date display, and user name.
// ---------------------------------------------------------------------------
const greeting = (function () {
  const STORAGE_KEY = 'dashboard_userName';
  const state = { userName: null, intervalId: null };

  function getGreetingText(hour, name) {
    let prefix;
    if (hour >= 5 && hour <= 11) {
      prefix = 'Good morning';
    } else if (hour >= 12 && hour <= 17) {
      prefix = 'Good afternoon';
    } else if (hour >= 18 && hour <= 21) {
      prefix = 'Good evening';
    } else {
      prefix = 'Good night';
    }
    const trimmedName = (name && typeof name === 'string') ? name.trim() : '';
    return trimmedName.length > 0 ? prefix + ', ' + trimmedName : prefix;
  }

  function formatTime(date) {
    const hh = String(date.getHours()).padStart(2, '0');
    const mm = String(date.getMinutes()).padStart(2, '0');
    return hh + ':' + mm;
  }

  function formatDate(date) {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  function render() {
    const now = new Date();
    const greetingEl = document.getElementById('greeting-message');
    const timeEl = document.getElementById('greeting-time');
    const dateEl = document.getElementById('greeting-date');
    if (greetingEl) greetingEl.textContent = getGreetingText(now.getHours(), state.userName);
    if (timeEl) timeEl.textContent = formatTime(now);
    if (dateEl) dateEl.textContent = formatDate(now);
  }

  function init() {
    const stored = storage.load(STORAGE_KEY);
    state.userName = (stored && typeof stored === 'string') ? stored : null;
    render();
    if (state.intervalId !== null) clearInterval(state.intervalId);
    state.intervalId = setInterval(render, 60000);
  }

  function setName(name) {
    const trimmed = (name && typeof name === 'string') ? name.trim() : '';
    state.userName = trimmed.length > 0 ? trimmed : null;
    storage.save(STORAGE_KEY, state.userName);
    render();
  }

  return { init, setName, getGreetingText, formatTime, formatDate };
}());

// ---------------------------------------------------------------------------
// timer module
// Manages a 5-minute (300 s) countdown timer with start, stop, and reset.
// Timer state is intentionally NOT persisted to localStorage.
// ---------------------------------------------------------------------------
const timer = (function () {
  const state = { remaining: 300, running: false, intervalId: null };

  function formatTime(seconds) {
    const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
    const ss = String(seconds % 60).padStart(2, '0');
    return mm + ':' + ss;
  }

  function render() {
    const display = document.getElementById('timer-display');
    if (display) display.textContent = formatTime(state.remaining);
  }

  function showComplete() {
    const status = document.getElementById('timer-status');
    if (status) {
      status.textContent = 'Time\'s up!';
      status.hidden = false;
    }
  }

  function hideComplete() {
    const status = document.getElementById('timer-status');
    if (status) {
      status.textContent = '';
      status.hidden = true;
    }
  }

  function stop() {
    if (state.intervalId !== null) {
      clearInterval(state.intervalId);
      state.intervalId = null;
    }
    state.running = false;
  }

  function start() {
    if (state.remaining === 0) return;
    if (state.running) return;
    state.running = true;
    state.intervalId = setInterval(function () {
      state.remaining -= 1;
      render();
      if (state.remaining === 0) {
        stop();
        showComplete();
      }
    }, 1000);
  }

  function reset() {
    stop();
    state.remaining = 300;
    state.running = false;
    hideComplete();
    render();
  }

  function init() {
    render();
    hideComplete();

    const startBtn = document.getElementById('timer-start');
    const stopBtn = document.getElementById('timer-stop');
    const resetBtn = document.getElementById('timer-reset');

    if (startBtn) startBtn.addEventListener('click', start);
    if (stopBtn) stopBtn.addEventListener('click', stop);
    if (resetBtn) resetBtn.addEventListener('click', reset);
  }

  return { init, start, stop, reset, formatTime };
}());

// ---------------------------------------------------------------------------
// todos module
// Manages task CRUD: add, edit, toggle completion, remove, and render.
// State is persisted to localStorage under 'dashboard_todos'.
// ---------------------------------------------------------------------------
const todos = (function () {
  const STORAGE_KEY = 'dashboard_todos';
  let tasks = [];

  function generateId() {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    return Date.now().toString() + '-' + Math.random().toString(36).slice(2);
  }

  function save() {
    storage.save(STORAGE_KEY, tasks);
  }

  function render() {
    const list = document.getElementById('todo-list');
    if (!list) return;

    list.innerHTML = '';

    tasks.forEach(function (task) {
      const li = document.createElement('li');
      if (task.completed) li.classList.add('completed');

      // Label / editable span
      const labelSpan = document.createElement('span');
      labelSpan.className = 'todo-label';
      labelSpan.textContent = task.label;

      // Toggle (complete) button
      const toggleBtn = document.createElement('button');
      toggleBtn.type = 'button';
      toggleBtn.className = 'todo-toggle';
      toggleBtn.setAttribute('aria-label', task.completed ? 'Mark incomplete' : 'Mark complete');
      toggleBtn.textContent = task.completed ? '↩' : '✓';
      toggleBtn.addEventListener('click', function () {
        todos.toggle(task.id);
      });

      // Edit button
      const editBtn = document.createElement('button');
      editBtn.type = 'button';
      editBtn.className = 'todo-edit';
      editBtn.setAttribute('aria-label', 'Edit task');
      editBtn.textContent = '✏️';
      editBtn.addEventListener('click', function () {
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'todo-edit-input';
        input.value = task.label;

        const confirmBtn = document.createElement('button');
        confirmBtn.type = 'button';
        confirmBtn.className = 'todo-edit-confirm';
        confirmBtn.textContent = 'Save';

        const cancelBtn = document.createElement('button');
        cancelBtn.type = 'button';
        cancelBtn.className = 'todo-edit-cancel';
        cancelBtn.textContent = 'Cancel';

        confirmBtn.addEventListener('click', function () {
          todos.edit(task.id, input.value);
        });

        cancelBtn.addEventListener('click', function () {
          render();
        });

        li.innerHTML = '';
        li.appendChild(input);
        li.appendChild(confirmBtn);
        li.appendChild(cancelBtn);
        input.focus();
      });

      // Remove button
      const removeBtn = document.createElement('button');
      removeBtn.type = 'button';
      removeBtn.className = 'todo-remove';
      removeBtn.setAttribute('aria-label', 'Delete task');
      removeBtn.textContent = '🗑️';
      removeBtn.addEventListener('click', function () {
        todos.remove(task.id);
      });

      li.appendChild(toggleBtn);
      li.appendChild(labelSpan);
      li.appendChild(editBtn);
      li.appendChild(removeBtn);
      list.appendChild(li);
    });
  }

  function init() {
    const stored = storage.load(STORAGE_KEY);
    tasks = Array.isArray(stored) ? stored : [];
    render();

    const form = document.getElementById('todo-form');
    if (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        const input = document.getElementById('todo-input');
        if (input) {
          todos.add(input.value);
          input.value = '';
        }
      });
    }
  }

  function add(label) {
    const trimmed = (label && typeof label === 'string') ? label.trim() : '';
    const validation = document.getElementById('todo-validation');

    if (trimmed.length === 0) {
      if (validation) validation.textContent = 'Task label cannot be empty.';
      return;
    }

    if (validation) validation.textContent = '';

    tasks.push({ id: generateId(), label: trimmed, completed: false });
    save();
    render();
  }

  function edit(id, newLabel) {
    const trimmed = (newLabel && typeof newLabel === 'string') ? newLabel.trim() : '';
    if (trimmed.length === 0) {
      // Reject empty/whitespace — restore previous label by re-rendering
      render();
      return;
    }

    const task = tasks.find(function (t) { return t.id === id; });
    if (task) {
      task.label = trimmed;
      save();
    }
    render();
  }

  function toggle(id) {
    const task = tasks.find(function (t) { return t.id === id; });
    if (task) {
      task.completed = !task.completed;
      save();
    }
    render();
  }

  function remove(id) {
    tasks = tasks.filter(function (t) { return t.id !== id; });
    save();
    render();
  }

  function getTasks() {
    return tasks;
  }

  return { init, add, edit, toggle, remove, render, getTasks };
}());

// ---------------------------------------------------------------------------
// links module
// Manages quick-link CRUD: add, remove, and render.
// State is persisted to localStorage under 'dashboard_links'.
// ---------------------------------------------------------------------------
const links = (function () {
  const STORAGE_KEY = 'dashboard_links';
  let entries = [];

  function generateId() {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    return Date.now().toString() + '-' + Math.random().toString(36).slice(2);
  }

  function isValidUrl(url) {
    try {
      const u = new URL(url);
      return u.protocol === 'http:' || u.protocol === 'https:';
    } catch (_) {
      return false;
    }
  }

  function save() {
    storage.save(STORAGE_KEY, entries);
  }

  function render() {
    const list = document.getElementById('links-list');
    if (!list) return;

    list.innerHTML = '';

    entries.forEach(function (entry) {
      const item = document.createElement('div');
      item.className = 'link-item';

      const anchor = document.createElement('a');
      anchor.href = entry.url;
      anchor.target = '_blank';
      anchor.rel = 'noopener noreferrer';
      anchor.textContent = entry.label;
      anchor.className = 'link-anchor';

      const removeBtn = document.createElement('button');
      removeBtn.type = 'button';
      removeBtn.className = 'link-remove';
      removeBtn.setAttribute('aria-label', 'Delete link ' + entry.label);
      removeBtn.textContent = '🗑️';
      removeBtn.addEventListener('click', function () {
        links.remove(entry.id);
      });

      item.appendChild(anchor);
      item.appendChild(removeBtn);
      list.appendChild(item);
    });
  }

  function add(label, url) {
    const trimmedLabel = (label && typeof label === 'string') ? label.trim() : '';
    const trimmedUrl = (url && typeof url === 'string') ? url.trim() : '';
    const validation = document.getElementById('links-validation');

    if (trimmedLabel.length === 0 || !isValidUrl(trimmedUrl)) {
      if (validation) {
        validation.textContent = trimmedLabel.length === 0
          ? 'Label cannot be empty.'
          : 'Please enter a valid http or https URL.';
      }
      return;
    }

    if (validation) validation.textContent = '';

    entries.push({ id: generateId(), label: trimmedLabel, url: trimmedUrl });
    save();
    render();
  }

  function remove(id) {
    entries = entries.filter(function (e) { return e.id !== id; });
    save();
    render();
  }

  function init() {
    const stored = storage.load(STORAGE_KEY);
    entries = Array.isArray(stored) ? stored : [];
    render();

    const form = document.getElementById('links-form');
    if (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        const labelInput = document.getElementById('link-label-input');
        const urlInput = document.getElementById('link-url-input');
        if (labelInput && urlInput) {
          links.add(labelInput.value, urlInput.value);
          labelInput.value = '';
          urlInput.value = '';
        }
      });
    }
  }

  function getEntries() {
    return entries;
  }

  return { init, add, remove, render, isValidUrl, getEntries };
}());

// ---------------------------------------------------------------------------
// Bootstrap — wire everything up on DOMContentLoaded
// ---------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', function () {
  if (!storage.isAvailable()) {
    const banner = document.getElementById('error-banner');
    const message = document.getElementById('error-banner-message');
    if (banner && message) {
      message.textContent = 'localStorage is unavailable — your data will not be saved.';
      banner.hidden = false;
    }
  }

  theme.init();
  greeting.init();
  timer.init();
  todos.init();
  links.init();

  const themeToggleBtn = document.getElementById('theme-toggle');
  if (themeToggleBtn) themeToggleBtn.addEventListener('click', theme.toggle);

  const nameForm = document.getElementById('name-form');
  if (nameForm) {
    nameForm.addEventListener('submit', function (e) {
      e.preventDefault();
      const input = document.getElementById('name-input');
      if (input) greeting.setName(input.value);
    });
  }
});
