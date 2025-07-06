# Interactive Project Dashboard Specification

## Goal
As a Project Manager, I want a comprehensive dashboard to manage and visualize tasks, issues and milestones.

## Functional Requirements
- **KPIs Overview**: Show progress, task status, at‑risk items and upcoming milestones.
- **Gantt Chart**: Interactive view of project timeline with zooming, panning and baseline toggle.
- **Work Breakdown Table**: Editable task hierarchy with sorting and filtering.
- **Kanban Board**: Drag and drop tasks between statuses.
- **CSV Import/Export**: Support project data exchange in CSV format.
- **Item Management**: Add, edit and delete tasks, issues and milestones via forms.
- **Comments**: Add, import and export task comments for collaboration.
- **Custom Columns**: Toggle visibility and reorder columns in the task table.
- **Filtering**: Filter data by project, owner, status and date range.
- **Maintenance Tools**: Remove duplicate entries and reset all data.

## Interaction Flow
```mermaid
sequenceDiagram
    participant U as User
    participant B as Browser
    participant JS as dashboard.js
    participant DB as IndexedDB

    %% Initial Load
    U->>B: Open index.html
    B->>JS: DOMContentLoaded
    JS->>DB: get(projectData)
    alt Data exists
        DB-->>JS: return data
    else No data
        DB-->>JS: empty dataset
    end
    JS->>JS: processRawData()
    JS->>B: renderDashboard()
    B-->>U: show dashboard

    %% Continuous Interactions
    loop while dashboard active
        U->>B: choose action
        alt Import CSV
            B->>JS: file input change
            JS->>JS: parse CSV
            JS->>DB: save projectData
            JS->>B: refresh UI
        else Apply filters
            B->>JS: filter change
            JS->>JS: applyFilters()
            JS->>B: refresh UI
        else Add/Edit item
            B->>JS: open modal or inline edit
            JS->>JS: update data
            JS->>DB: save projectData
            JS->>B: refresh UI
        else Export CSV
            B->>JS: click Export
            JS->>JS: exportDataToCsv()
            JS->>B: trigger download
        end
    end
```
