# Project Dashboard Architecture Specification

## 1. Overview
This project is a client-side, single-page web application (SPA) designed as a project management dashboard. Users can import project data from a CSV file and visualize it through interactive components including Key Performance Indicators (KPIs), a Gantt chart, a work breakdown structure table, and a Kanban board.

The application runs entirely in the browser with no backend server. All data processing, rendering, and business logic execute client-side. Data persistence is provided via IndexedDB, allowing the dashboard to retain data between sessions.

## 2. Frontend Architecture
The frontend uses standard web technologies:

- **HTML** (`dashboard.html`) defines the application's structure, layout, and modal dialogs.
- **CSS** (`dashboard.css`) provides styling with a pastel theme, responsive layout, and dark mode support.
- **JavaScript** (`dashboard.js`) contains the core logic for DOM manipulation, event handling, state management, and integration with external libraries.

## 3. Data Layer
Project data is imported from CSV files using PapaParse, processed by `processRawData` in `dashboard.js`, and stored in IndexedDB through the `idb-keyval` library. Data processing includes duplicate removal, categorization into tasks/issues/milestones, and building a hierarchical structure with `buildHierarchy`. The utility module `removeDuplicates.js` helps ensure clean data.

## 4. Business Logic
The main dashboard logic resides in `dashboard.js` alongside helper modules in the `src` directory. Responsibilities include:

- Rendering UI components such as KPIs, the Gantt chart, task table, and Kanban board.
- Handling user actions (adding/editing/deleting items, filtering, importing/exporting data, managing comments).
- Managing modals and dialogs for user input and confirmations.

Utility modules provide additional functionality:

- `csvUtils.js` – export data and comments to CSV, import comments from CSV.
- `parseId.js` – parse task IDs into type and number.
- `removeDuplicates.js` – remove duplicate entries from imported data.
- `sortHierarchy.js` – sort hierarchical data while keeping parent‑child relationships intact.

### Architecture Diagram

```mermaid
flowchart TD
    csv[CSV File]
    csv -->|import| dashboard[dashboard.js]
    subgraph helpers [Helper Modules (src/)]
        rd[removeDuplicates.js]
        pid[parseId.js]
        sh[sortHierarchy.js]
        csvu[csvUtils.js]
    end
    dashboard --> rd
    dashboard --> pid
    dashboard --> sh
    dashboard --> csvu
    rd --> dashboard
    pid --> dashboard
    sh --> dashboard
    csvu --> dashboard
    dashboard -->|save/load| db[(IndexedDB)]
    db --> dashboard
    dashboard --> ui[UI Components]
    ui --> dashboard
```

The diagram illustrates how imported CSV data flows through the main script and
helper modules, persists to IndexedDB, and updates UI components such as the
KPIs, Gantt chart, task table and Kanban board.

## 5. External Libraries and Dependencies
Key libraries loaded via CDN in `dashboard.html` include:

- **Chart.js** – used for Gantt and donut charts.
- **PapaParse** – CSV parsing.
- **idb-keyval** – wrapper over IndexedDB for persistent storage.
- **Quill** – rich text editor for task descriptions.
- **Jest** and **jsdom** – used for unit testing the utility modules.

## 6. Testing
Unit tests reside in the `tests` directory and are executed with Jest (`npm test`). Tests cover the utility functions such as CSV import/export, ID parsing, duplicate removal, and hierarchy sorting.
