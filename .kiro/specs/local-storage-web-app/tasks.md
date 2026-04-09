# Implementation Plan: Local Storage Web App

## Overview

Build a single-page personal productivity dashboard using plain HTML, CSS, and Vanilla JavaScript. All modules are inlined in `js/app.js`. Data persists via `localStorage`. Implementation proceeds module-by-module, each wired into the bootstrap sequence before moving on.

## Tasks

- [x] 1. Scaffold project structure and HTML skeleton
  - Create `index.html` with semantic sections for each widget: greeting, timer, todos, links
  - Add `<link>` to `css/styles.css` and `<script defer>` to `js/app.js`
  - Include a `data-theme` attribute placeholder on `<html>`
  - Add a hidden `#error-banner` element for storage warnings
  - Create empty `css/styles.css` and `js/app.js` files
  - _Requirements: 7.1, 7.3, 7.4_

- [x] 2. Implement `storage` module
  - [x] 2.1 Write the `storage` IIFE in `app.js` with `load(key)`, `save(key, value)`, and `isAvailable()` methods
    - Wrap all `localStorage` calls in `try/catch`
    - `load` returns parsed JSON or `null` on failure
    - `save` serialises to JSON; on failure shows the `#error-banner` singleton (once per session)
    - `isAvailable` probes with a test write/delete
    - _Requirements: 6.1, 6.4, 6.5_
  - [x] 2.2 Write unit tests for `storage` module in `tests/storage.test.js`
    - Test `load` returns `null` when key absent
    - Test `load` returns parsed value when key present
    - Test `save` then `load` round-trip
    - Test banner is shown (and only once) when `localStorage` throws
    - _Requirements: 6.4, 6.5_

- [x] 3. Implement `theme` module
  - [x] 3.1 Write the `theme` IIFE in `app.js` with `init()`, `toggle()`, `apply(value)`, and `getCurrent()` methods
    - `init`: reads `dashboard_theme` from storage; falls back to `prefers-color-scheme`; calls `apply()`
    - `apply`: sets `document.documentElement.setAttribute('data-theme', value)` and updates toggle button state
    - `toggle`: flips current value, saves to `dashboard_theme`, calls `apply()`
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_
  - [ ]* 3.2 Write property test for theme toggle involution in `tests/theme.test.js`
    - **Property 17: Theme toggle is an involution**
    - **Validates: Requirements 8.2, 8.3**
  - [ ]* 3.3 Write property test for theme restore round-trip in `tests/theme.test.js`
    - **Property 18: Theme restore round-trip**
    - **Validates: Requirements 8.4**

- [x] 4. Implement `greeting` module
  - [x] 4.1 Write the `greeting` IIFE in `app.js` with `init()`, `setName(name)`, `getGreetingText(hour, name)`, `formatTime(date)`, and `formatDate(date)` methods
    - `getGreetingText`: pure function mapping hour → prefix string, appends `, name` when name is non-empty
    - `formatTime`: returns zero-padded `HH:MM` string
    - `formatDate`: returns e.g. `"Monday, July 14, 2025"` using `toLocaleDateString`
    - `init`: loads `dashboard_userName`, renders greeting + time + date, starts `setInterval` every 60 s
    - `setName`: trims input, saves to `dashboard_userName`, re-renders greeting
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 1.10_
  - [ ]* 4.2 Write property test for greeting text in `tests/greeting.test.js`
    - **Property 1: Greeting text matches time period**
    - **Validates: Requirements 1.3, 1.4, 1.5, 1.6**
  - [ ]* 4.3 Write property test for time/date format in `tests/greeting.test.js`
    - **Property 2: Time display format is always HH:MM**
    - **Property 3: Date format contains required components**
    - **Validates: Requirements 1.1, 1.2**
  - [ ]* 4.4 Write property test for user name round-trip in `tests/greeting.test.js`
    - **Property 4: User name round-trip**
    - **Validates: Requirements 1.8, 1.9**

- [x] 5. Implement `timer` module
  - [x] 5.1 Write the `timer` IIFE in `app.js` with `init()`, `start()`, `stop()`, `reset()`, and `formatTime(seconds)` methods
    - In-memory state: `{ remaining: 300, running: false, intervalId: null }`
    - `formatTime`: pure function returning zero-padded `MM:SS`
    - `start`: no-op if `remaining === 0`; sets 1 s interval that decrements `remaining`, re-renders, auto-stops at 0 with completion indicator
    - `stop`: clears interval, sets `running = false`
    - `reset`: clears interval, sets `remaining = 300`, `running = false`, re-renders
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7_
  - [ ]* 5.2 Write property test for timer format in `tests/timer.test.js`
    - **Property 2: Time display format is always MM:SS**
    - **Validates: Requirements 2.7**
  - [ ]* 5.3 Write property test for timer reset idempotence in `tests/timer.test.js`
    - **Property 5: Timer reset is always idempotent to initial state**
    - **Validates: Requirements 2.5**

- [x] 6. Checkpoint — Ensure storage, theme, greeting, and timer pass their tests
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Implement `todos` module
  - [x] 7.1 Write the `todos` IIFE in `app.js` with `init()`, `add(label)`, `edit(id, newLabel)`, `toggle(id)`, `remove(id)`, and `render()` methods
    - In-memory state: `tasks[]` array of `{ id, label, completed }`
    - ID generation: `crypto.randomUUID()` with fallback
    - `add`: trims label, rejects empty/whitespace with inline validation message, appends task, saves, re-renders
    - `edit`: trims new label, rejects empty/whitespace (restores previous label), updates task, saves, re-renders
    - `toggle`: flips `completed`, saves, re-renders
    - `remove`: filters out task by id, saves, re-renders
    - `render`: rebuilds todo list DOM; completed tasks get a visual distinction class
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_
  - [ ]* 7.2 Write property test for task addition round-trip in `tests/todos.test.js`
    - **Property 6: Task addition round-trip**
    - **Validates: Requirements 3.2, 3.4**
  - [ ]* 7.3 Write property test for whitespace rejection on add in `tests/todos.test.js`
    - **Property 7: Whitespace task labels are rejected on add**
    - **Validates: Requirements 3.3**
  - [ ]* 7.4 Write property test for task edit round-trip in `tests/todos.test.js`
    - **Property 8: Task edit round-trip**
    - **Validates: Requirements 4.2**
  - [ ]* 7.5 Write property test for whitespace rejection on edit in `tests/todos.test.js`
    - **Property 9: Whitespace task labels are rejected on edit**
    - **Validates: Requirements 4.3**
  - [ ]* 7.6 Write property test for toggle involution in `tests/todos.test.js`
    - **Property 10: Task completion toggle is an involution**
    - **Validates: Requirements 4.4**
  - [ ]* 7.7 Write property test for task deletion in `tests/todos.test.js`
    - **Property 11: Task deletion removes from list and storage**
    - **Validates: Requirements 4.5**
  - [ ]* 7.8 Write property test for task list restore round-trip in `tests/todos.test.js`
    - **Property 12: Task list restore round-trip**
    - **Validates: Requirements 4.6, 6.3**

- [x] 8. Implement `links` module
  - [x] 8.1 Write the `links` IIFE in `app.js` with `init()`, `add(label, url)`, `remove(id)`, `render()`, and `isValidUrl(url)` methods
    - In-memory state: `entries[]` array of `{ id, label, url }`
    - `isValidUrl`: pure function using `new URL(url)` constructor; accepts only `http:` and `https:` protocols
    - `add`: trims label, validates URL, rejects invalid input with inline validation message, appends entry, saves, re-renders
    - `remove`: filters out entry by id, saves, re-renders
    - `render`: rebuilds links DOM; each entry is a button/anchor opening URL in new tab with a delete control
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_
  - [ ]* 8.2 Write property test for link addition round-trip in `tests/links.test.js`
    - **Property 13: Link addition round-trip**
    - **Validates: Requirements 5.2, 5.5**
  - [ ]* 8.3 Write property test for invalid link input rejection in `tests/links.test.js`
    - **Property 14: Invalid link inputs are rejected**
    - **Validates: Requirements 5.3**
  - [ ]* 8.4 Write property test for link deletion in `tests/links.test.js`
    - **Property 15: Link deletion removes from list and storage**
    - **Validates: Requirements 5.4**
  - [ ]* 8.5 Write property test for link list restore round-trip in `tests/links.test.js`
    - **Property 16: Link list restore round-trip**
    - **Validates: Requirements 5.6, 6.3**

- [x] 9. Checkpoint — Ensure todos and links modules pass their tests
  - Ensure all tests pass, ask the user if questions arise.

- [x] 10. Write CSS in `css/styles.css`
  - Define CSS custom properties for colours, spacing, and typography on `:root` (light mode defaults)
  - Add `[data-theme="dark"]` overrides for all colour custom properties
  - Style layout: responsive grid/flex for widget cards
  - Style each widget: greeting, timer, todos, links
  - Style the theme toggle button, error banner, inline validation messages, and completed task visual distinction
  - _Requirements: 7.1, 7.3, 8.1, 8.2_

- [x] 11. Wire bootstrap sequence in `app.js`
  - At the bottom of `app.js`, add a `DOMContentLoaded` listener that calls:
    1. `storage.isAvailable()` — show banner if false
    2. `theme.init()`
    3. `greeting.init()`
    4. `timer.init()`
    5. `todos.init()`
    6. `links.init()`
  - Attach all UI event listeners (toggle button, name settings form, timer controls, todo form, links form)
  - _Requirements: 6.3, 7.4_

- [x] 12. Final checkpoint — Full integration verification
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Property tests use **fast-check** (`npm install --save-dev fast-check`) with a minimum of 100 runs each
- Each property test file tags tests with `// Feature: local-storage-web-app, Property N: <title>`
- All modules are written as IIFEs inside `js/app.js` — no ES module syntax, no bundler required
- Timer state is intentionally not persisted to localStorage
