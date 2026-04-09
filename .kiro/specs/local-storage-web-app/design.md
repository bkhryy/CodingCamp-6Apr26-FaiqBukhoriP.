# Design Document: Local Storage Web App

## Overview

A personal productivity dashboard delivered as a single HTML page with no build step, no framework, and no backend. The entire app is a static file that can be opened directly from disk. All state lives in the browser's `localStorage`. The UI is composed of four independent widgets — Greeting, Focus Timer, To-Do List, and Quick Links — each managed by a dedicated JavaScript module that reads/writes its own localStorage key.

The architecture follows a simple **module-per-widget** pattern: each widget owns its DOM subtree, its data model, and its persistence logic. A thin `app.js` entry point bootstraps all widgets on `DOMContentLoaded`.

---

## Architecture

```
index.html
├── css/
│   └── styles.css          (single stylesheet)
└── js/
    └── app.js              (single JS file — all modules inlined or concatenated)
```

Because the constraint is exactly one JS file, all widget logic is written as plain IIFE/module-pattern objects inside `app.js` and wired together at the bottom of the file.

### High-Level Data Flow

```mermaid
graph TD
    A[Browser loads index.html] --> B[DOMContentLoaded]
    B --> C[storage.load()]
    C --> D[greeting.init()]
    C --> E[timer.init()]
    C --> F[todos.init()]
    C --> G[links.init()]
    C --> N[theme.init()]
    D & E & F & G & N --> H[Render UI]
    H --> I[User Interaction]
    I --> J[Widget handler]
    J --> K[Update in-memory state]
    K --> L[Re-render widget DOM]
    L --> M[storage.save(key, data)]
```

### Module Responsibilities

| Module | Responsibility |
|---|---|
| `storage` | Thin wrapper around `localStorage` with try/catch and error banner |
| `greeting` | Clock tick, date/time display, name settings |
| `timer` | Countdown logic, interval management, completion state |
| `todos` | Task CRUD, inline editing, completion toggle |
| `links` | Link CRUD, URL validation, new-tab navigation |
| `theme` | Light/dark toggle, system preference detection, persistence |

---

## Components and Interfaces

### `storage` module

```js
storage.load(key)           // → parsed value or null
storage.save(key, value)    // → void; shows banner on failure
storage.isAvailable()       // → boolean
```

Error handling: both `load` and `save` are wrapped in `try/catch`. On failure, a singleton warning banner is injected into the DOM (once per session).

### `greeting` module

```js
greeting.init()             // reads userName from storage, starts clock tick
greeting.setName(name)      // validates, saves, re-renders
greeting.getGreetingText(hour, name)  // pure function → string
greeting.formatTime(date)   // pure function → "HH:MM"
greeting.formatDate(date)   // pure function → "Monday, July 14, 2025"
```

Clock tick: `setInterval` fires every 60 seconds and updates the time/greeting display.

### `timer` module

```js
timer.init()                // renders initial 05:00 state
timer.start()               // starts setInterval (1 s)
timer.stop()                // clears interval, preserves remaining
timer.reset()               // clears interval, restores 300 s
timer.formatTime(seconds)   // pure function → "MM:SS"
```

State: `{ remaining: 300, running: false }` — held in memory only (timer state is not persisted).

### `todos` module

```js
todos.init()                // loads from storage, renders list
todos.add(label)            // validates, appends task, saves, re-renders
todos.edit(id, newLabel)    // validates, updates task, saves, re-renders
todos.toggle(id)            // flips completed, saves, re-renders
todos.remove(id)            // removes task, saves, re-renders
todos.render()              // rebuilds DOM from in-memory array
```

### `links` module

```js
links.init()                // loads from storage, renders list
links.add(label, url)       // validates, appends entry, saves, re-renders
links.remove(id)            // removes entry, saves, re-renders
links.render()              // rebuilds DOM from in-memory array
links.isValidUrl(url)       // pure function → boolean
```

### `theme` module

```js
theme.init()                // reads stored theme or detects system preference, applies it
theme.toggle()              // switches between 'light' and 'dark', saves, applies
theme.apply(value)          // sets data-theme attribute on <html>, updates toggle icon
theme.getCurrent()          // pure function → 'light' | 'dark'
```

Theme is applied by setting a `data-theme="light"` or `data-theme="dark"` attribute on the `<html>` element. CSS custom properties scoped to `[data-theme="dark"]` override the default light-mode values.

---

## Data Models

### localStorage Keys

| Key | Type | Description |
|---|---|---|
| `dashboard_userName` | `string` | User's display name |
| `dashboard_todos` | `Task[]` | Serialised task array |
| `dashboard_links` | `LinkEntry[]` | Serialised link array |
| `dashboard_theme` | `'light' \| 'dark'` | User's theme preference |

### Task

```js
{
  id: string,          // crypto.randomUUID() or Date.now().toString()
  label: string,       // non-empty, trimmed
  completed: boolean   // default false
}
```

### LinkEntry

```js
{
  id: string,          // crypto.randomUUID() or Date.now().toString()
  label: string,       // non-empty, trimmed
  url: string          // validated via URL constructor
}
```

### Greeting State (in-memory only)

```js
{
  userName: string | null,
  intervalId: number | null
}
```

### Timer State (in-memory only)

```js
{
  remaining: number,   // seconds, 0–300
  running: boolean,
  intervalId: number | null
}
```

### Theme State (in-memory only)

```js
{
  current: 'light' | 'dark'
}
```

---

## Key Algorithms and Logic Flows

### Time-Based Greeting

```
hour = new Date().getHours()
if 5  <= hour <= 11 → "Good morning"
if 12 <= hour <= 17 → "Good afternoon"
if 18 <= hour <= 21 → "Good evening"
else                → "Good night"
```

Appends `, [name]` when `userName` is a non-empty string.

### URL Validation

```js
function isValidUrl(url) {
  try {
    const u = new URL(url);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}
```

### Task / Link ID Generation

Uses `crypto.randomUUID()` where available, falls back to `Date.now().toString() + Math.random()`.

### localStorage Write Strategy

Every mutating operation (add/edit/toggle/delete) calls `storage.save(key, array)` synchronously before returning. This ensures the persisted state is always consistent with the in-memory state after each operation.

### Dashboard Load Sequence

```
1. DOMContentLoaded fires
2. storage.isAvailable() check → show banner if false
3. theme.init()     → load theme or detect system preference, apply to <html>
4. greeting.init()  → load userName, render, start clock
5. timer.init()     → render 05:00
6. todos.init()     → load tasks, render list
7. links.init()     → load links, render list
```

### Theme Detection and Application

```
1. Read storage.load('dashboard_theme')
2. If value is 'light' or 'dark' → use it
3. Else → check window.matchMedia('(prefers-color-scheme: dark)').matches
   - true  → use 'dark'
   - false → use 'light'
4. Set document.documentElement.setAttribute('data-theme', value)
5. Update toggle button icon/label to reflect current state
```

---


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Greeting text matches time period

*For any* hour value in [0, 23] and any non-empty user name, `getGreetingText(hour, name)` SHALL return a string beginning with "Good morning" when hour ∈ [5, 11], "Good afternoon" when hour ∈ [12, 17], "Good evening" when hour ∈ [18, 21], and "Good night" otherwise — and the returned string SHALL contain the name.

**Validates: Requirements 1.3, 1.4, 1.5, 1.6**

---

### Property 2: Time display format is always MM:SS / HH:MM

*For any* integer seconds value in [0, 300], `timer.formatTime(seconds)` SHALL return a string matching the pattern `^\d{2}:\d{2}$` where the minutes part is in [0, 5] and the seconds part is in [0, 59]. Equivalently, *for any* `Date` object, `greeting.formatTime(date)` SHALL return a string matching `^\d{2}:\d{2}$` with hours in [0, 23] and minutes in [0, 59].

**Validates: Requirements 1.1, 2.7**

---

### Property 3: Date format contains required components

*For any* `Date` object, `greeting.formatDate(date)` SHALL return a string that contains a full weekday name, a full month name, a numeric day, and a four-digit year.

**Validates: Requirements 1.2**

---

### Property 4: User name round-trip

*For any* non-empty, non-whitespace string used as a user name, calling `greeting.setName(name)` SHALL result in `storage.load('dashboard_userName')` returning that exact name AND the greeting DOM element containing that name. Subsequently calling `greeting.init()` with that value pre-populated in storage SHALL also render the greeting with that name.

**Validates: Requirements 1.8, 1.9**

---

### Property 5: Timer reset is always idempotent to initial state

*For any* timer state (any `remaining` value in [0, 300], any `running` boolean), calling `timer.reset()` SHALL always result in `remaining === 300` and `running === false`, regardless of how many times it is called.

**Validates: Requirements 2.5**

---

### Property 6: Task addition round-trip

*For any* non-empty, non-whitespace string used as a task label, calling `todos.add(label)` SHALL result in the in-memory task list containing exactly one new task with that label and `completed === false`, AND `storage.load('dashboard_todos')` SHALL contain a task with that label.

**Validates: Requirements 3.2, 3.4**

---

### Property 7: Whitespace task labels are rejected on add

*For any* string composed entirely of whitespace characters (spaces, tabs, newlines), calling `todos.add(label)` SHALL leave the task list length unchanged and SHALL NOT write a new task to storage.

**Validates: Requirements 3.3**

---

### Property 8: Task edit round-trip

*For any* existing task and any non-empty, non-whitespace string as the new label, calling `todos.edit(id, newLabel)` SHALL update the task's label in the in-memory list AND in `storage.load('dashboard_todos')`, while leaving all other task fields unchanged.

**Validates: Requirements 4.2**

---

### Property 9: Whitespace task labels are rejected on edit

*For any* existing task and any string composed entirely of whitespace characters, calling `todos.edit(id, whitespaceLabel)` SHALL leave the task's label unchanged in both the in-memory list and storage.

**Validates: Requirements 4.3**

---

### Property 10: Task completion toggle is an involution

*For any* task with any initial `completed` state, calling `todos.toggle(id)` SHALL flip the `completed` field. Calling `todos.toggle(id)` a second time SHALL restore the original `completed` value. The toggle SHALL be reflected in storage after each call.

**Validates: Requirements 4.4**

---

### Property 11: Task deletion removes from list and storage

*For any* non-empty task list and any task id present in that list, calling `todos.remove(id)` SHALL result in no task with that id appearing in the in-memory list, AND `storage.load('dashboard_todos')` SHALL contain no task with that id.

**Validates: Requirements 4.5**

---

### Property 12: Task list restore round-trip

*For any* array of valid Task objects written to `storage.save('dashboard_todos', tasks)`, calling `todos.init()` SHALL produce an in-memory task list that is deeply equal to the stored array.

**Validates: Requirements 4.6, 6.3**

---

### Property 13: Link addition round-trip

*For any* non-empty label and valid `http`/`https` URL, calling `links.add(label, url)` SHALL result in the in-memory link list containing exactly one new entry with that label and URL, AND `storage.load('dashboard_links')` SHALL contain that entry.

**Validates: Requirements 5.2, 5.5**

---

### Property 14: Invalid link inputs are rejected

*For any* input where the label is empty/whitespace OR the URL is not a valid `http`/`https` URL, calling `links.add(label, url)` SHALL leave the link list length unchanged and SHALL NOT write a new entry to storage.

**Validates: Requirements 5.3**

---

### Property 15: Link deletion removes from list and storage

*For any* non-empty link list and any link id present in that list, calling `links.remove(id)` SHALL result in no entry with that id in the in-memory list, AND `storage.load('dashboard_links')` SHALL contain no entry with that id.

**Validates: Requirements 5.4**

---

### Property 16: Link list restore round-trip

*For any* array of valid LinkEntry objects written to `storage.save('dashboard_links', links)`, calling `links.init()` SHALL produce an in-memory link list that is deeply equal to the stored array.

**Validates: Requirements 5.6, 6.3**

---

### Property 17: Theme toggle is an involution

*For any* initial theme value (`'light'` or `'dark'`), calling `theme.toggle()` SHALL switch to the opposite value. Calling `theme.toggle()` a second time SHALL restore the original value. After each call, `storage.load('dashboard_theme')` SHALL reflect the current theme AND `document.documentElement.getAttribute('data-theme')` SHALL equal the current theme.

**Validates: Requirements 8.2, 8.3**

---

### Property 18: Theme restore round-trip

*For any* theme value (`'light'` or `'dark'`) written to `storage.save('dashboard_theme', value)`, calling `theme.init()` SHALL apply that theme to the `<html>` element and set the in-memory current value to match.

**Validates: Requirements 8.4**

---

## Error Handling

### localStorage Unavailability

The `storage` module wraps every `localStorage` call in `try/catch`. On any error:

- A singleton warning banner is injected at the top of the page (only once per session to avoid spam).
- On read failure: the module returns `null`, and the calling widget initialises with an empty default state.
- On write failure: the module silently swallows the error after showing the banner; the in-memory state remains valid for the current session.

### Input Validation Errors

- Empty/whitespace task labels: an inline validation message is shown adjacent to the input; the list is not modified.
- Empty label or invalid URL for links: an inline validation message is shown; the list is not modified.
- Empty/whitespace edit label: the edit is cancelled and the previous label is restored.

### Timer Edge Cases

- If `reset()` is called while the timer is running, the interval is cleared before resetting state.
- If `start()` is called when `remaining === 0`, it is a no-op (timer is already complete).

### ID Generation Fallback

`crypto.randomUUID()` is used where available. In environments where it is not (very old browsers), the fallback `Date.now().toString() + '-' + Math.random().toString(36).slice(2)` is used. Collision probability is negligible for personal-use data volumes.

---

## Testing Strategy

### PBT Applicability Assessment

This feature contains significant pure-function logic (greeting text generation, time/date formatting, URL validation, task/link CRUD with validation) that is well-suited to property-based testing. The core business logic is isolated from the DOM and from `localStorage` via the `storage` module, making it straightforward to test with mocked dependencies.

### Dual Testing Approach

**Unit / Example Tests** (for specific scenarios):
- Timer initialises to 05:00
- Timer start/stop/complete behavior with fake timers
- localStorage unavailability shows warning banner (mock `localStorage` to throw)
- DOM structural checks (input fields, buttons exist)

**Property-Based Tests** (for universal properties):
- All 16 correctness properties above are implemented as property-based tests
- Library: **fast-check** (JavaScript) — `npm install --save-dev fast-check`
- Minimum **100 iterations** per property test
- Each test is tagged with a comment referencing the design property

Tag format:
```js
// Feature: local-storage-web-app, Property 6: Task addition round-trip
```

### Property Test Configuration

```js
import fc from 'fast-check';

// Example: Property 6
test('task addition round-trip', () => {
  // Feature: local-storage-web-app, Property 6: Task addition round-trip
  fc.assert(
    fc.property(
      fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
      (label) => {
        const mockStorage = createMockStorage();
        const todoModule = createTodos(mockStorage);
        todoModule.init();
        todoModule.add(label);
        const tasks = mockStorage.load('dashboard_todos');
        return tasks.some(t => t.label === label.trim() && t.completed === false);
      }
    ),
    { numRuns: 100 }
  );
});
```

### Test File Structure

All tests live in a `tests/` directory alongside the source:

```
tests/
  greeting.test.js    — Properties 1, 2, 3, 4
  timer.test.js       — Properties 2 (formatTime), 5
  todos.test.js       — Properties 6, 7, 8, 9, 10, 11, 12
  links.test.js       — Properties 13, 14, 15, 16
  theme.test.js       — Properties 17, 18
  storage.test.js     — Edge cases: unavailability, error handling
```

### Integration / Smoke Tests

- Open `index.html` directly in each target browser and verify all four widgets render and function correctly.
- Verify no network requests are made (DevTools Network tab should be empty).
- Verify data persists across page refresh.
