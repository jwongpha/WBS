# Project Dashboard

This repository contains utilities and a simple web dashboard for managing tasks, issues and milestones.

## Requirements

- **Node.js** v18 or higher
- **npm** (comes with Node)
- A modern web browser to view `index.html`

## Installation

Install dependencies once after cloning the repository:

```bash
npm install
```

## Running Tests

Before running tests, install all project dependencies:

```bash
npm install
```

Unit tests are implemented with Jest and require the packages listed in
`package.json`. After installing dependencies, run:

```bash
npm test
```

## Using the Dashboard

Open `index.html` in your web browser. Required libraries are included in the
`vendor` folder so the dashboard works even without internet access.

### Importing Data

Project tasks can be imported from a CSV file. A sample file `sample_project_data.csv`
is included and shows the required columns. When exporting project data, the
resulting CSV also contains a `DETAILS` column which maps to the internal
`Progress Detail` field.

### Exporting to PDF

Use the **Export Data as PDF** button in the File & Data menu to generate a PDF
version of the current task list. The PDF export now includes priority,
progress percentage and the DETAILS column so you get a more complete snapshot
of each task. The PDF is created client-side using jsPDF, so no additional
setup is required.

Use **Export Gantt as PDF** to save the timeline. The Gantt chart is rendered
with Mermaid and converted to a PDF using the svg2pdf.js plugin.

### Duplicating Tasks

Select one or more rows in the task table and click the copy icon that appears
above the table to create duplicates. This works the same as the
"Duplicate Selected Items" button in the Item Management menu.

### Gantt Chart View

Use the drop-down next to the Gantt zoom buttons to switch between Month,
Week, Day, Half Day and Quarter Day view modes.

The Gantt focus mode now also features its own drop-down so you can adjust the
view while working in the enlarged chart.

You can pan the chart by dragging with the mouse. Toggle Edit Mode using the
hand icon next to the baseline control. When Edit Mode is enabled, you can drag
a bar to move the task along the timeline or drag its edges to adjust the start
or end date. To reposition the chart while editing, drag on empty space between
tasks. All changes are saved automatically.

The **Show Baselines** checkbox lets you toggle visibility of dashed baseline
bars for each task. The setting is saved so your preference persists when you
reopen the dashboard.

Click any bar in the Gantt chart to highlight the corresponding row in the task
table. The row's select checkbox is checked automatically and previous
selections are cleared so only one row stays selected.

### Kanban Board

Use the **Switch View** button to display tasks on a Kanban board. Column
headers now show how many tasks are in each status and cards include a colored
priority border so you can quickly gauge workload.


