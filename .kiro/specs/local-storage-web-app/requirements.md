# Requirements Document

## Introduction

A personal productivity dashboard built as a standalone web app using HTML, CSS, and Vanilla JavaScript. The app runs entirely in the browser with no backend. It displays a personalised time-aware greeting with the user's name, a 5-minute focus timer, a persistent to-do list, and a set of user-defined quick links. All user data is stored in the browser's Local Storage.

## Glossary

- **Dashboard**: The single-page web application presented to the user.
- **Greeting_Widget**: The UI section that displays the current time, date, a time-based greeting message, and the user's name.
- **User_Name**: The display name entered by the user, shown as part of the greeting (e.g., "Good morning, Lia Pujianti").
- **Focus_Timer**: The countdown timer component set to 25 minutes by default.
- **Todo_List**: The task management component where users can add, edit, complete, and delete tasks.
- **Quick_Links**: The component that displays user-defined shortcut buttons to external URLs.
- **Local_Storage**: The browser's built-in `localStorage` API used for client-side data persistence.
- **Task**: A single to-do item with a text label and a completion state.
- **Link_Entry**: A user-defined record consisting of a display label and a URL.
- **Theme**: The visual colour scheme of the Dashboard, either "light" or "dark".

---

## Requirements

### Requirement 1: Greeting Widget

**User Story:** As a user, I want to see the current time, date, and a personalised greeting with my name based on the time of day, so that the dashboard feels personal and contextually relevant.

#### Acceptance Criteria

1. THE Greeting_Widget SHALL display the current time in HH:MM format, updated every minute.
2. THE Greeting_Widget SHALL display the current date in a human-readable format (e.g., "Monday, July 14, 2025").
3. WHEN the local time is between 05:00 and 11:59, THE Greeting_Widget SHALL display the message "Good morning, [User_Name]".
4. WHEN the local time is between 12:00 and 17:59, THE Greeting_Widget SHALL display the message "Good afternoon, [User_Name]".
5. WHEN the local time is between 18:00 and 21:59, THE Greeting_Widget SHALL display the message "Good evening, [User_Name]".
6. WHEN the local time is between 22:00 and 04:59, THE Greeting_Widget SHALL display the message "Good night, [User_Name]".
7. THE Dashboard SHALL provide a settings control that allows the user to enter or update their User_Name.
8. WHEN the user saves a User_Name, THE Dashboard SHALL persist it to Local_Storage and immediately reflect it in the greeting.
9. WHEN the Dashboard loads and a User_Name is stored in Local_Storage, THE Greeting_Widget SHALL use that name in the greeting.
10. WHEN no User_Name has been set, THE Greeting_Widget SHALL display the greeting without a name (e.g., "Good morning").

---

### Requirement 2: Focus Timer

**User Story:** As a user, I want a 5-minute countdown timer with start, stop, and reset controls, so that I can manage focused work sessions.

#### Acceptance Criteria

1. THE Focus_Timer SHALL initialise with a countdown value of 5 minutes (300 seconds).
2. WHEN the user activates the start control, THE Focus_Timer SHALL begin counting down in one-second intervals.
3. WHILE the Focus_Timer is counting down, THE Focus_Timer SHALL update the displayed time every second.
4. WHEN the user activates the stop control, THE Focus_Timer SHALL pause the countdown at the current value.
5. WHEN the user activates the reset control, THE Focus_Timer SHALL return the countdown value to 5 minutes and stop any active countdown.
6. WHEN the countdown reaches 00:00, THE Focus_Timer SHALL stop automatically and display a visual or textual completion indicator.
7. THE Focus_Timer SHALL display the remaining time in MM:SS format at all times.

---

### Requirement 3: To-Do List — Task Creation

**User Story:** As a user, I want to add tasks to a list, so that I can track what I need to do.

#### Acceptance Criteria

1. THE Todo_List SHALL provide a text input field and a submit control for adding new tasks.
2. WHEN the user submits a non-empty task label, THE Todo_List SHALL add a new Task with that label and a default completion state of false.
3. IF the user submits an empty or whitespace-only task label, THEN THE Todo_List SHALL reject the submission and display an inline validation message.
4. WHEN a Task is added, THE Todo_List SHALL persist all tasks to Local_Storage.

---

### Requirement 4: To-Do List — Task Management

**User Story:** As a user, I want to edit, complete, and delete tasks, so that I can keep my list accurate and up to date.

#### Acceptance Criteria

1. WHEN the user activates the edit control on a Task, THE Todo_List SHALL allow the user to modify the task label inline.
2. WHEN the user confirms an edit with a non-empty label, THE Todo_List SHALL update the Task label and persist the change to Local_Storage.
3. IF the user confirms an edit with an empty or whitespace-only label, THEN THE Todo_List SHALL reject the change and restore the previous label.
4. WHEN the user activates the complete control on a Task, THE Todo_List SHALL toggle the Task's completion state and apply a visual distinction to completed tasks.
5. WHEN the user activates the delete control on a Task, THE Todo_List SHALL remove the Task from the list and persist the updated list to Local_Storage.
6. WHEN the Dashboard loads, THE Todo_List SHALL restore all previously saved tasks from Local_Storage.

---

### Requirement 5: Quick Links

**User Story:** As a user, I want to save and access shortcut buttons to my favourite websites, so that I can open them quickly from the dashboard.

#### Acceptance Criteria

1. THE Quick_Links component SHALL provide controls for adding a new Link_Entry consisting of a display label and a URL.
2. WHEN the user submits a Link_Entry with a non-empty label and a valid URL, THE Quick_Links component SHALL add a clickable button that opens the URL in a new browser tab.
3. IF the user submits a Link_Entry with an empty label or an invalid URL, THEN THE Quick_Links component SHALL reject the submission and display an inline validation message.
4. WHEN the user activates the delete control on a Link_Entry, THE Quick_Links component SHALL remove that entry from the list and persist the updated list to Local_Storage.
5. WHEN a Link_Entry is added or removed, THE Quick_Links component SHALL persist all Link_Entry records to Local_Storage.
6. WHEN the Dashboard loads, THE Quick_Links component SHALL restore all previously saved Link_Entry records from Local_Storage.

---

### Requirement 6: Data Persistence

**User Story:** As a user, I want my tasks and quick links to survive page refreshes, so that I don't lose my data between sessions.

#### Acceptance Criteria

1. THE Dashboard SHALL use the browser Local_Storage API as the sole data persistence mechanism.
2. WHEN any Task or Link_Entry is created, updated, or deleted, THE Dashboard SHALL write the updated state to Local_Storage before the operation is considered complete.
3. WHEN the Dashboard loads, THE Dashboard SHALL read all persisted data from Local_Storage and restore the UI state before displaying content to the user.
4. IF Local_Storage is unavailable or throws an error on read, THEN THE Dashboard SHALL display a warning message and continue operating with an empty state.
5. IF Local_Storage is unavailable or throws an error on write, THEN THE Dashboard SHALL display a warning message indicating that data will not be saved.

---

### Requirement 8: Light / Dark Mode

**User Story:** As a user, I want to toggle between light and dark mode, so that I can use the dashboard comfortably in different lighting conditions.

#### Acceptance Criteria

1. THE Dashboard SHALL provide a visible toggle control to switch between light and dark Theme.
2. WHEN the user activates the toggle, THE Dashboard SHALL immediately apply the selected Theme to the entire page.
3. WHEN the user saves a Theme preference, THE Dashboard SHALL persist it to Local_Storage.
4. WHEN the Dashboard loads and a Theme preference is stored in Local_Storage, THE Dashboard SHALL apply that Theme before displaying content.
5. WHEN no Theme preference has been stored, THE Dashboard SHALL default to the user's system colour scheme preference (`prefers-color-scheme`).

---

### Requirement 7: Technical Constraints

**User Story:** As a developer, I want the app to be built with plain HTML, CSS, and Vanilla JavaScript, so that it requires no build tools, frameworks, or backend.

#### Acceptance Criteria

1. THE Dashboard SHALL be implemented using HTML, CSS, and Vanilla JavaScript with no external frameworks or libraries.
2. THE Dashboard SHALL load and operate correctly in the latest stable versions of Chrome, Firefox, Edge, and Safari.
3. THE Dashboard SHALL consist of exactly one CSS file located in the `css/` directory and exactly one JavaScript file located in the `js/` directory.
4. THE Dashboard SHALL function as a standalone web app openable directly from the file system without a backend server.
