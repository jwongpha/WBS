// Default data for first-time use
const defaultCsvData = ``; // Made defaultCsvData empty

document.addEventListener('DOMContentLoaded', () => {
const { get, set, del } = idbKeyval; // Destructure 'del' from idbKeyval

  // ----------------- Accessibility Enhancements -----------------
  // Ensure <details> elements expose open/closed state via aria-expanded
  document.querySelectorAll('details').forEach(detail => {
    // Set initial state based on presence of the "open" attribute
    detail.setAttribute('aria-expanded', detail.hasAttribute('open'));
    // Update aria-expanded whenever the element is toggled
    detail.addEventListener('toggle', () => {
      detail.setAttribute('aria-expanded', detail.open);
    });
  });


// --- Custom Plugin to draw Issue Icons ---
const issueIconPlugin = {
id: 'issueIconPlugin',
afterDatasetsDraw(chart) {
const { ctx, scales: { x, y } } = chart;
const data = chart.config.data.sortedData || [];
const issues = data.filter(item => item.Type === 'Issue');
if (issues.length === 0) return;

ctx.save();
ctx.globalCompositeOperation = 'destination-over';
ctx.font = "20px 'Material Icons'";
ctx.textAlign = 'center';
ctx.textBaseline = 'middle';
ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--status-at-risk').trim();

const chartLeft = chart.chartArea.left;
issues.forEach((issue) => {
const index = data.findIndex(d => d.TaskID === issue.TaskID);
if (index === -1) return;
const yPos = y.getPixelForValue(index);
const startDate = parseDateLocal(issue['Start Date']);
const xPos = x.getPixelForValue(startDate) - 12;
if (xPos > chartLeft) {
ctx.fillText('bug_report', xPos, yPos);
}
});

ctx.restore();
}
};

// --- Custom Plugin to draw Delay Icons ---
const delayIconPlugin = {
id: 'delayIconPlugin',
afterDatasetsDraw(chart) {
const { ctx, scales: { x, y } } = chart;
const data = chart.config.data.sortedData || [];
if (data.length === 0) return;

const today = new Date();
today.setHours(0,0,0,0);

ctx.save();
ctx.globalCompositeOperation = 'destination-over';
ctx.font = "20px 'Material Icons'";
ctx.textAlign = 'left';
ctx.textBaseline = 'middle';
ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--status-at-risk').trim();

const iconOffset = 12;

const chartLeft = chart.chartArea.left;
data.forEach((task, index) => {
const endDate = parseDateLocal(task['End Date']);
if (endDate && endDate < today && task.Status !== 'Done' && task.Status !== 'Resolved') {
const yPos = y.getPixelForValue(index);
const xPos = x.getPixelForValue(endDate) + iconOffset;
if (xPos > chartLeft) {
ctx.fillText('schedule', xPos, yPos);
}
}
});

ctx.restore();
}
};

// --- Custom Plugin to draw separators for main tasks ---
const taskSeparatorPlugin = {
id: 'taskSeparator',
afterDatasetsDraw(chart) {
const meta = chart.getDatasetMeta(0);
if (!meta) return;
const tasks = chart.config.data.sortedData || [];
const ctx = chart.ctx;
ctx.save();
ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--divider-color').trim() || '#e0e0e0';
ctx.lineWidth = 2;
tasks.forEach((task, index) => {
const level = parseInt(task.Level || 1);
if (level === 1 && index !== 0) {
const bar = meta.data[index];
if (bar) {
const top = bar.y - bar.height / 2;
ctx.beginPath();
ctx.moveTo(chart.chartArea.left, top);
ctx.lineTo(chart.chartArea.right, top);
ctx.stroke();
}
}
});
ctx.restore();
}
};

// --- Custom Plugin to draw dependency arrows ---
const dependencyPlugin = {
id: 'dependencyPlugin',
afterDatasetsDraw(chart) {
const data = chart.config.data.sortedData || [];
if (data.length === 0) return;
const { ctx, scales: { x, y } } = chart;

const arrowColor = getComputedStyle(document.documentElement)
.getPropertyValue('--dependency-arrow-color').trim() || '#888';

const drawArrow = (fromX, fromY, toX, toY) => {
ctx.strokeStyle = arrowColor;
ctx.lineWidth = 1;
ctx.setLineDash([2, 3]);
ctx.beginPath();
ctx.moveTo(fromX, fromY);
ctx.lineTo(toX, toY);
ctx.stroke();
ctx.setLineDash([]);
const headlen = 6;
const angle = Math.atan2(toY - fromY, toX - fromX);
ctx.fillStyle = arrowColor;
ctx.beginPath();
ctx.moveTo(toX, toY);
ctx.lineTo(toX - headlen * Math.cos(angle - Math.PI / 6),
toY - headlen * Math.sin(angle - Math.PI / 6));
ctx.lineTo(toX - headlen * Math.cos(angle + Math.PI / 6),
toY - headlen * Math.sin(angle + Math.PI / 6));
ctx.closePath();
ctx.fill();
};

ctx.save();
data.forEach((task, idx) => {
if (!Array.isArray(task.Predecessors)) return;
task.Predecessors.forEach(predId => {
const predIndex = data.findIndex(t => t.TaskID === predId);
if (predIndex === -1) return;
const predTask = data[predIndex];
const fromX = x.getPixelForValue(parseDateLocal(predTask['End Date']));
const toX = x.getPixelForValue(parseDateLocal(task['Start Date']));
const fromY = y.getPixelForValue(predIndex);
const toY = y.getPixelForValue(idx);
drawArrow(fromX, fromY, toX, toY);
});
});
ctx.restore();
}
};

// --- Removed Gantt Dragging Plugin ---
Chart.register(issueIconPlugin, delayIconPlugin, taskSeparatorPlugin, dependencyPlugin, ChartDataLabels);


// DOM Elements
const drawerToggle = document.getElementById('drawerToggle');
const themeToggle = document.getElementById('themeToggle');
const navigationDrawer = document.getElementById('navigation-drawer');
const mainContainer = document.getElementById('main-container');
const drawerStateCursor = document.createElement('div');
drawerStateCursor.id = 'drawer-state-cursor';
navigationDrawer.appendChild(drawerStateCursor);

  // Start with the sidebar collapsed
  navigationDrawer.classList.add('collapsed');
  mainContainer.classList.add('collapsed');
  drawerToggle.classList.add('collapsed');
const taskFileInput = document.getElementById('taskFile');
const taskFileNameSpan = document.getElementById('taskFileName');
const taskMatrixTable = document.getElementById('taskMatrixTable'); // Changed to get the table directly
const taskMatrixTableBody = taskMatrixTable.querySelector('tbody');
const taskMatrixTableHeadRow = taskMatrixTable.querySelector('thead tr'); // Get the head row for dragging
const startDateFilter = document.getElementById('startDateFilter');
const endDateFilter = document.getElementById('endDateFilter');
const projectFilter = document.getElementById('projectFilter');
const ownerFilter = document.getElementById('ownerFilter');
const statusFilter = document.getElementById('statusFilter');
const situationFilter = document.getElementById('situationFilter');
const typeFilter = document.getElementById('typeFilter');
const issueTypeFilter = document.getElementById('issueTypeFilter');
const filterButton = document.getElementById('filterButton');
const clearFiltersButton = document.getElementById('clearFiltersButton');
const resetButton = document.getElementById('resetButton');
const exportCsvButton = document.getElementById('exportCsvButton');
const exportPdfButton = document.getElementById('exportPdfButton');
const exportGanttPdfButton = document.getElementById('exportGanttPdfButton');
const importCommentsBtn = document.getElementById('importCommentsBtn');
const exportCommentsBtn = document.getElementById('exportCommentsBtn');
const commentsCsvFile = document.getElementById('commentsCsvFile');
const typeSwitchCheckboxes = document.querySelectorAll('input[name="typeSwitch"]');
const addNewItemBtn = document.getElementById('addNewItemBtn');
const addNewItemTableBtn = document.getElementById('addNewItemTableBtn');
const addItemModal = document.getElementById('addItemModal');
const closeModalBtn = document.getElementById('closeModalBtn');
const addItemForm = document.getElementById('addItemForm');
const saveCloseBtn = document.getElementById('saveCloseBtn');
const confirmModal = document.getElementById('confirmModal');
const confirmMessage = document.getElementById('confirmMessage');
const confirmYesBtn = document.getElementById('confirmYesBtn');
const confirmNoBtn = document.getElementById('confirmNoBtn');
const confirmCloseBtn = document.getElementById('confirmCloseBtn');
const commentsModal = document.getElementById('commentsModal');
const closeCommentsBtn = document.getElementById('closeCommentsBtn');
const commentsList = document.getElementById('commentsList');
const newCommentText = document.getElementById('newCommentText');
const newCommentAuthor = document.getElementById('newCommentAuthor');
const addCommentBtn = document.getElementById('addCommentBtn');
const cancelEditCommentBtn = document.getElementById('cancelEditCommentBtn');
const itemCommentsSection = document.getElementById('itemCommentsSection');
const itemCommentsList = document.getElementById('itemCommentsList');
const itemCommentText = document.getElementById('itemCommentText');
const itemCommentAuthor = document.getElementById('itemCommentAuthor');
const itemAddCommentBtn = document.getElementById('itemAddCommentBtn');
const itemCancelEditCommentBtn = document.getElementById('itemCancelEditCommentBtn');
const ganttZoomIn = document.getElementById('ganttZoomIn');
const ganttZoomOut = document.getElementById('ganttZoomOut');
const openGanttModalBtn = document.getElementById('openGanttModalBtn');
const toggleGanttCardBtn = document.getElementById('toggleGanttCardBtn');
const ganttModal = document.getElementById('ganttModal');
const closeGanttModalBtn = document.getElementById('closeGanttModalBtn');
const ganttContainer = document.querySelector('.gantt-container');
const ganttContainers = document.querySelectorAll('.gantt-container');
const tableContainer = document.querySelector('.table-container');
const ganttScrollLeft = document.getElementById('ganttScrollLeft');
const ganttScrollRight = document.getElementById('ganttScrollRight');
const ganttScrollUp = document.getElementById('ganttScrollUp');
const ganttScrollDown = document.getElementById('ganttScrollDown');
const ganttFirstTaskBtn = document.getElementById('ganttFirstTaskBtn');
const ganttViewModeSelect = document.getElementById('ganttViewModeSelect');
const ganttViewModeModalSelect = document.getElementById('ganttViewModeModalSelect');
const tableZoomIn = document.getElementById('tableZoomIn');
const tableZoomOut = document.getElementById('tableZoomOut');
const tableTextColorPicker = document.getElementById('tableTextColorPicker');
const applyTextColorBtn = document.getElementById('applyTextColorBtn');
const cellTextColorPicker = document.getElementById('cellTextColorPicker');
const applyCellTextColorBtn = document.getElementById('applyCellTextColorBtn');
const ganttLabelColorPicker = document.getElementById('ganttLabelColorPicker');
const applyGanttLabelColorBtn = document.getElementById('applyGanttLabelColorBtn');
const itemTypeSelect = document.getElementById('itemType'); // Get the itemType select element
const itemSituationField = document.getElementById('itemSituationField'); // Get the situation form field
const itemSituationSelect = document.getElementById('itemSituation'); // Get the situation select element

const STATUS_OPTIONS = {
'Task': ['Not Started', 'In Progress', 'On Hold', 'At Risk', 'Done'],
'Issue': ['Open', 'In Progress', 'At Risk', 'Resolved'],
'Vehicle Milestone': ['Not Started', 'In Progress', 'Done']
};

function updateStatusOptions(type, current) {
const statusSelect = document.getElementById('itemStatus');
const opts = STATUS_OPTIONS[type] || [];
statusSelect.innerHTML = opts.map(s => `<option value="${s}">${s}</option>`).join('');
if (current && opts.includes(current)) {
statusSelect.value = current;
} else if (opts.length > 0) {
statusSelect.value = opts[0];
}
}

// New DOM elements for column visibility
const toggleColumnsBtn = document.getElementById('toggleColumnsBtn');
const columnDropdown = document.getElementById('columnDropdown');
const removeDuplicatesBtn = document.getElementById('removeDuplicatesBtn'); // New button element
const deleteSelectedBtn = document.getElementById('deleteSelectedBtn');
const duplicateSelectedBtn = document.getElementById('duplicateSelectedBtn');
const selectedActionsGroup = document.getElementById('selectedActionsGroup');
const deleteAllBtn = document.getElementById('deleteAllBtn');
const switchKanbanBtn = document.getElementById('switchKanbanBtn');
const baselineToggle = document.getElementById('baselineToggle');
const toggleBaselineBtn = document.getElementById('toggleBaselineBtn');
const toggleGanttEditBtn = document.getElementById('toggleGanttEditBtn');
const toggleGanttModalEditBtn = document.getElementById('toggleGanttModalEditBtn');
loadBaselineVisibilityState();
const kanbanContainer = document.getElementById('kanbanContainer');
const tableSearchInput = document.getElementById('tableSearchInput');
const editProjectInfoBtn = document.getElementById('editProjectInfoBtn');
const headerEditProjectInfoBtn = document.getElementById('headerEditProjectInfoBtn');
const projectInfoModal = document.getElementById('projectInfoModal');
const closeProjectInfoBtn = document.getElementById('closeProjectInfoBtn');
const projectNameDisplay = document.getElementById('projectNameDisplay');
const projectDescriptionDisplay = document.getElementById('projectDescriptionDisplay');
const projectNameInput = document.getElementById('projectNameInput');
const projectDescriptionInput = document.getElementById('projectDescriptionInput');
const saveProjectInfoBtn = document.getElementById('saveProjectInfoBtn');
const ganttCard = document.querySelector('.gantt-container').closest('.card');
const tableCard = document.getElementById('tableCard');
const openTableModalBtn = document.getElementById('openTableModalBtn');
const tableModal = document.getElementById('tableModal');
const closeTableModalBtn = document.getElementById('closeTableModalBtn');
const tableModalContainer = document.getElementById('tableModalContainer');
const kpiCard = document.getElementById('kpiCard');
const openKpiModalBtn = document.getElementById('openKpiModalBtn');
const toggleKpiCardBtn = document.getElementById('toggleKpiCardBtn');
const kpiModal = document.getElementById('kpiModal');
const closeKpiModalBtn = document.getElementById('closeKpiModalBtn');
const kpiModalContainer = document.getElementById('kpiModalContainer');
const toggleTableCardBtn = document.getElementById('toggleTableCardBtn');
const toggleKanbanCardBtn = document.getElementById('toggleKanbanCardBtn');
const openKanbanModalBtn = document.getElementById('openKanbanModalBtn');
const kanbanModal = document.getElementById('kanbanModal');
const closeKanbanModalBtn = document.getElementById('closeKanbanModalBtn');
const kanbanModalContainer = document.getElementById('kanbanModalContainer');
const kanbanTypeSelect = document.getElementById('kanbanTypeSelect');
const tableActionIcons = document.getElementById('tableActionIcons');
const tableEditIcon = document.getElementById('tableEditIcon');
const tableDeleteIcon = document.getElementById('tableDeleteIcon');
const tableCopyIcon = document.getElementById('tableCopyIcon');

function updateSelectedActionsVisibility() {
    const selected = taskMatrixTableBody.querySelectorAll('.task-select:checked').length;
    if (selected > 0) {
        deleteSelectedBtn.classList.remove('hidden');
        tableDeleteIcon.classList.remove('hidden');
        tableCopyIcon.classList.remove('hidden');
    } else {
        deleteSelectedBtn.classList.add('hidden');
        tableDeleteIcon.classList.add('hidden');
        tableCopyIcon.classList.add('hidden');
    }
    if (selected === 1) {
        tableEditIcon.classList.remove('hidden');
    } else {
        tableEditIcon.classList.add('hidden');
    }
    if (selected === 0) {
        tableActionIcons.classList.add('hidden');
    } else {
        tableActionIcons.classList.remove('hidden');
    }
    selectedActionsGroup.classList.toggle('hidden', selected === 0);
}

const storedTheme = localStorage.getItem('theme');
if (storedTheme === 'dark') {
    document.body.classList.add('dark-mode');
}
let isKanbanVisible = false;
themeToggle.innerHTML = `<span class="material-icons">${document.body.classList.contains('dark-mode') ? 'light_mode' : 'dark_mode'}</span>`;
tableTextColorPicker.value = getComputedStyle(document.documentElement).getPropertyValue('--table-text-color').trim() || '#000000';

  function updateDrawerStateCursor(summaryEl) {
    const rect = summaryEl.getBoundingClientRect();
    drawerStateCursor.style.top = summaryEl.offsetTop + 'px';
    drawerStateCursor.style.height = rect.height + 'px';
  }

  navigationDrawer.querySelectorAll('details.menu > summary').forEach(summary => {
    summary.addEventListener('click', (e) => {
      const parentDetails = summary.parentElement;
      if (navigationDrawer.classList.contains('collapsed')) {
        e.preventDefault();
        navigationDrawer.classList.remove('collapsed');
        mainContainer.classList.remove('collapsed');
        drawerToggle.classList.remove('collapsed');
        parentDetails.setAttribute('open', '');
        setTimeout(() => updateDrawerStateCursor(summary), 0);
      } else {
        setTimeout(() => updateDrawerStateCursor(summary), 0);
      }
    });
    summary.addEventListener('focus', () => updateDrawerStateCursor(summary));
  });

  const initialSummary = navigationDrawer.querySelector('details.menu[open] > summary');
  if (initialSummary) updateDrawerStateCursor(initialSummary);

// Data store for original full dataset
window.allTaskData = [];
let charts = {};
let currentTableFontSize = 14;
let baselineVisible = true;
let ganttEditMode = false;
let ganttTotalDateRange = { min: null, max: null };
let editingTaskId = null;
let toggleColumnsClickHandler = null;
let columnDropdownDocumentClickHandler = null;
window.columnVisibility = {}; // Global object to store column visibility state
window.columnOrder = []; // Global array to store column display order
window.typeSwitchValues = ['all'];

window.tableSortState = { column: null, ascending: true };
// Preset order for Kanban status columns
const KANBAN_STATUS_ORDER = ['Not Started', 'In Progress', 'On Hold', 'At Risk', 'Done', 'Open', 'Resolved'];
// Map from data field name to display name for headers and checkboxes
const COLUMN_DISPLAY_NAMES = {
'TaskID': 'TaskID',
'Type Icon': 'Type',
'Task Name': 'Task Name',
'Owner': 'Owner',
'Sub Owner': 'Sub Owner',
'Priority': 'Priority',
'Baseline Start Date': 'Baseline Start',
'Start Date': 'Start Date',
'End Date': 'End Date',
'Baseline End Date': 'Baseline End',
'Overdue': 'Overdue?',
'Progress (%)': 'Progress',
'Status': 'Status',
'Situation': 'Situation',
'Predecessors': 'Predecessors',
'Successors': 'Successors',
'Comments': 'Comments',
  'Is Milestone?': 'Milestone?',
  'Progress Detail': 'DETAILS',
  'Actions': 'Actions'
};

function updateGanttRange(data) {
const allDates = data.flatMap(t => [
    parseDateLocal(t['Start Date']),
    parseDateLocal(t['End Date']),
    parseDateLocal(t['Baseline Start Date']),
    parseDateLocal(t['Baseline End Date'])
]).filter(d => !isNaN(d));

if (allDates.length > 0) {
ganttTotalDateRange.min = new Date(Math.min(...allDates));
ganttTotalDateRange.max = new Date(Math.max(...allDates));
} else {
ganttTotalDateRange = { min: null, max: null };
}
}

function selectBestViewMode(tasks) {
    if (!tasks || tasks.length === 0) return 'Day';
    let min = null;
    let max = null;
    tasks.forEach(t => {
        const s = parseDateLocal(t.start);
        const e = parseDateLocal(t.end);
        if (!isNaN(s) && (min === null || s < min)) min = s;
        if (!isNaN(e) && (max === null || e > max)) max = e;
    });
    if (!min || !max) return 'Day';
    const diffDays = (max - min) / (1000 * 60 * 60 * 24);
    if (diffDays <= 2) return 'Quarter Day';
    if (diffDays <= 4) return 'Half Day';
    if (diffDays <= 30) return 'Day';
    if (diffDays <= 180) return 'Week';
    return 'Month';
}

function parseDateLocal(input) {
    if (input instanceof Date) {
        return new Date(input.getFullYear(), input.getMonth(), input.getDate());
    }
    if (typeof input === 'string') {
        const [y, m, d] = input.split('-').map(Number);
        if (y && m && d) {
            return new Date(y, m - 1, d);
        }
    }
    const date = new Date(input);
    return isNaN(date) ? date : new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function formatDateLocal(d) {
    const date = parseDateLocal(d);
    if (isNaN(date)) return '';
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

function adjustDependentTaskDates(task, oldStart, oldEnd) {
const parse = d => parseDateLocal(d);
const format = d => formatDateLocal(d);
const oldStartDate = parse(oldStart);
const oldEndDate = parse(oldEnd);
const newStartDate = parse(task['Start Date']);
const newEndDate = parse(task['End Date']);
const deltaStart = newStartDate - oldStartDate;
const deltaEnd = newEndDate - oldEndDate;
const delta = deltaEnd !== 0 ? deltaEnd : deltaStart;
if (!delta) return;

const visited = new Set();
const shift = predId => {
window.allTaskData.forEach(t => {
if (Array.isArray(t.Predecessors) && t.Predecessors.includes(predId)) {
if (visited.has(t.TaskID)) return;
visited.add(t.TaskID);
const s = parse(t['Start Date']);
const e = parse(t['End Date']);
t['Start Date'] = format(s.getTime() + delta);
t['End Date'] = format(e.getTime() + delta);
shift(t.TaskID);
}
});
};
shift(task.TaskID);
}

async function onGanttDateChange(ganttTask, start, end) {
  const task = window.allTaskData.find(t => String(t.TaskID) === String(ganttTask.id));
  if (!task) return;
  const format = d => formatDateLocal(d);
  const oldStart = task['Start Date'];
  const oldEnd = task['End Date'];
  task['Start Date'] = format(start);
  task['End Date'] = format(end);
  adjustDependentTaskDates(task, oldStart, oldEnd);
  await saveProjectData();
}

// Define default column order (using data field names)
const DEFAULT_COLUMN_ORDER = [
'TaskID', 'Type Icon', 'Task Name', 'Owner', 'Sub Owner', 'Priority',
'Baseline Start Date', 'Start Date', 'End Date', 'Overdue', 'Baseline End Date',
'Progress (%)', 'Status', 'Situation', 'Predecessors', 'Successors', 'Comments', 'Is Milestone?', 'Progress Detail', 'Actions'
];


// --- Data Persistence Functions ---
async function saveProjectData() {
if (window.allTaskData && window.allTaskData.length > 0) {
try {
await set('projectData', window.allTaskData);
console.log('Project data saved successfully.');
checkDueTasks();
} catch (error) {
console.error('Failed to save project data:', error);
}
}
}

// Function to load column order and visibility from IndexedDB
async function loadColumnOrderAndVisibilityState() {
try {
const storedOrder = await get('columnOrder');
if (storedOrder && Array.isArray(storedOrder) && storedOrder.length > 0) {
window.columnOrder = storedOrder;
console.log('Column order loaded from IndexedDB.');
} else {
window.columnOrder = [...DEFAULT_COLUMN_ORDER];
console.log('Column order initialized to default.');
}

if (!window.columnOrder.includes('Type Icon')) {
const taskIdIndex = window.columnOrder.indexOf('TaskID');
if (taskIdIndex !== -1) {
window.columnOrder.splice(taskIdIndex + 1, 0, 'Type Icon');
} else {
window.columnOrder.unshift('Type Icon');
}
}

if (!window.columnOrder.includes('Comments')) {
const actionsIndex = window.columnOrder.indexOf('Actions');
if (actionsIndex !== -1) {
window.columnOrder.splice(actionsIndex, 0, 'Comments');
} else {
window.columnOrder.push('Comments');
}
}

const storedVisibility = await get('columnVisibility');
if (storedVisibility) {
window.columnVisibility = storedVisibility;
console.log('Column visibility loaded from IndexedDB.');
} else {
// Initialize with all columns visible if no stored state
window.columnVisibility = {};
DEFAULT_COLUMN_ORDER.forEach(colName => {
window.columnVisibility[colName] = true;
});
console.log('Column visibility initialized to default (all visible).');
}

if (window.columnVisibility['Type Icon'] === undefined) {
window.columnVisibility['Type Icon'] = true;
}
if (window.columnVisibility['Comments'] === undefined) {
window.columnVisibility['Comments'] = true;
}
} catch (error) {
console.error('Failed to load column states:', error);
// Fallback to default if loading fails
window.columnOrder = [...DEFAULT_COLUMN_ORDER];
window.columnVisibility = {};
DEFAULT_COLUMN_ORDER.forEach(colName => {
window.columnVisibility[colName] = true;
});
}
}

// Function to save column order and visibility to IndexedDB
async function saveColumnOrderAndVisibilityState() {
try {
await set('columnOrder', window.columnOrder);
await set('columnVisibility', window.columnVisibility);
console.log('Column order and visibility saved successfully.');
} catch (error) {
console.error('Failed to save column states:', error);
}
}

// Load persisted baseline visibility flag
async function loadBaselineVisibilityState() {
    try {
        const stored = await get('baselineVisible');
        if (typeof stored === 'boolean') {
            baselineVisible = stored;
            updateBaselineButton();
        }
    } catch (error) {
        console.error('Failed to load baseline state:', error);
    }
}

// Persist current baseline visibility flag
async function saveBaselineVisibilityState() {
    try {
        await set('baselineVisible', baselineVisible);
    } catch (error) {
        console.error('Failed to save baseline state:', error);
    }
}

function updateBaselineButton() {
    if (!toggleBaselineBtn) return;
    if (baselineVisible) {
        toggleBaselineBtn.title = 'Hide Baselines';
        toggleBaselineBtn.innerHTML = '<span class="material-icons">visibility_off</span>';
    } else {
        toggleBaselineBtn.title = 'Show Baselines';
        toggleBaselineBtn.innerHTML = '<span class="material-icons">visibility</span>';
    }
    if (baselineToggle) baselineToggle.checked = baselineVisible;
}

function updateGanttEditButtons() {
    const enableTitle = 'Enable Edit Mode';
    const disableTitle = 'Disable Edit Mode';
    ganttContainers.forEach(c => {
        if (ganttEditMode) {
            c.classList.add('edit-mode');
        } else {
            c.classList.remove('edit-mode');
        }
    });
    if (toggleGanttEditBtn) {
        toggleGanttEditBtn.title = ganttEditMode ? disableTitle : enableTitle;
        toggleGanttEditBtn.innerHTML = ganttEditMode ?
            '<span class="material-icons">edit</span>' :
            '<span class="material-icons">pan_tool</span>';
    }
    if (toggleGanttModalEditBtn) {
        toggleGanttModalEditBtn.title = ganttEditMode ? disableTitle : enableTitle;
        toggleGanttModalEditBtn.innerHTML = ganttEditMode ?
            '<span class="material-icons">edit</span>' :
            '<span class="material-icons">pan_tool</span>';
    }
}

// --- Core Functions ---

function destroyCharts() {
  Object.values(charts).forEach(chart => {
    if (chart && typeof chart.destroy === 'function') {
      chart.destroy();
    }
  });
  charts = {};
}

function updateDashboard(combinedData) {
  destroyCharts();
  if (!combinedData) return;

  // keep latest filtered dataset for kanban updates
  window.currentDashboardData = combinedData;

updateGanttRange(window.allTaskData);

// --- 1. Calculate and Render KPIs ---
updateKpiCards(combinedData);

// --- 2. Create Gantt Chart ---
const visibleData = getVisibleTasks(combinedData);
charts.gantt = createGanttChart('ganttChart', visibleData, 'Task Name', 'Start Date', 'End Date');

// --- 3. Populate Task Table ---
populateTaskMatrix(combinedData);
updateKanbanBoard(combinedData);
// Apply column visibility after populating the table
applyColumnVisibilityToTable();
}

// --- KPI CARD FUNCTIONS ---
function createKpiDonutChart(canvasId, data, colors, labels = []) {
const canvas = document.getElementById(canvasId);
if (!canvas) return null;
const ctx = canvas.getContext('2d');

return new Chart(ctx, {
type: 'doughnut',
data: {
labels: labels,
datasets: [{
data: data,
backgroundColor: colors,
borderColor: getComputedStyle(document.documentElement).getPropertyValue('--card-background').trim() || '#FFFFFF',
borderWidth: 2,
cutout: '75%',
}]
},
options: {
responsive: true,
maintainAspectRatio: false,
plugins: {
legend: { display: false },
tooltip: {
enabled: true,
callbacks: {
label: (context) => {
const label = context.label || '';
const value = context.parsed;
return label ? `${label}: ${value}` : value;
}
}
},
datalabels: {
anchor: 'end',
align: 'end',
clamp: true,
color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary').trim() || '#666',
font: { size: 8 },
formatter: (value, ctx) => {
const label = ctx.chart.data.labels?.[ctx.dataIndex];
return label ? `${label}: ${value}` : value;
}
}
}
}
});
}

function updateKpiCards(data) {
const tasksOnly = data.filter(d => d.Type === 'Task');
const issuesOnly = data.filter(d => d.Type === 'Issue');

// Card 1: Overall Progress
const totalProgress = tasksOnly.length > 0 ? tasksOnly.reduce((sum, task) => sum + parseInt(task['Progress (%)'] || 0), 0) / tasksOnly.length : 0;
const progressPercent = Math.round(totalProgress);
document.getElementById('kpi-progress-value').textContent = `${progressPercent}%`;
charts.progressDonut = createKpiDonutChart('progressDonutChart',
[progressPercent, 100 - progressPercent],
[getComputedStyle(document.documentElement).getPropertyValue('--status-in-progress').trim(), '#E0E0E0'],
['Complete', 'Remaining']
);

// Card 2: Task Status
const statusCounts = tasksOnly.reduce((acc, task) => {
const status = task.Status || 'Unknown';
acc[status] = (acc[status] || 0) + 1;
return acc;
}, {});
const statusOrder = ['Done', 'In Progress', 'At Risk', 'On Hold', 'Not Started'];
const statusChartData = statusOrder.map(s => statusCounts[s] || 0);
const statusColors = statusOrder.map(s => {
const statusClass = s.toLowerCase().replace(/ /g, '-');
return getComputedStyle(document.documentElement).getPropertyValue(`--status-${statusClass}`).trim();
});
document.getElementById('kpi-total-tasks').textContent = `${tasksOnly.length} Tasks`;
charts.statusDonut = createKpiDonutChart('statusDonutChart', statusChartData, statusColors, statusOrder);

// Card 3: At-Risk Items
const today = new Date();
today.setHours(0, 0, 0, 0);
const overdueTasksCount = tasksOnly.filter(task => {
const endDate = parseDateLocal(task['End Date']);
return endDate < today && task.Status !== 'Done';
}).length;
const highPriorityIssuesCount = issuesOnly.filter(issue => issue.Priority === 'High' && issue.Status !== 'Resolved').length;
const totalAtRisk = overdueTasksCount + highPriorityIssuesCount;

document.getElementById('atRiskCount').textContent = totalAtRisk;
document.querySelector('#overdueTasksKpi span:last-child').textContent = overdueTasksCount;
document.querySelector('#highPriorityIssuesKpi span:last-child').textContent = highPriorityIssuesCount;


// Card 4: Upcoming Milestone
const upcomingMilestones = data.filter(item => {
const isMilestone = item['Is Milestone?']?.toLowerCase() === 'yes';
const endDate = parseDateLocal(item['End Date']);
return isMilestone && !isNaN(endDate) && endDate >= today;
}).sort((a, b) => parseDateLocal(a['End Date']) - parseDateLocal(b['End Date']));

const nextMilestone = upcomingMilestones[0];
const milestoneNameEl = document.getElementById('nextMilestoneName');
const milestoneDateEl = document.getElementById('nextMilestoneDate');
const milestoneDaysLeftEl = document.getElementById('milestoneDaysLeft');

if (nextMilestone) {
const milestoneDate = parseDateLocal(nextMilestone['End Date']);
const daysLeft = Math.ceil((milestoneDate - today) / (1000 * 60 * 60 * 24));
const name = nextMilestone['Task Name'].replace('[Milestone] ', '');

milestoneNameEl.textContent = name;
milestoneNameEl.title = name;
milestoneDateEl.textContent = milestoneDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
milestoneDaysLeftEl.textContent = `${daysLeft} Days`;
} else {
milestoneNameEl.textContent = 'No data available';
milestoneNameEl.title = 'No data available';
milestoneDateEl.textContent = '-';
milestoneDaysLeftEl.textContent = '-';
}

// NEW KPI Card 5: Tasks by Priority
const priorityCounts = tasksOnly.reduce((acc, task) => {
const priority = task.Priority || 'Unknown';
acc[priority] = (acc[priority] || 0) + 1;
return acc;
}, {});
const priorityOrder = ['High', 'Medium', 'Low'];
const priorityChartData = priorityOrder.map(p => priorityCounts[p] || 0);
const priorityColors = priorityOrder.map(p => {
const priorityClass = p.toLowerCase().replace(/ /g, '-');
return getComputedStyle(document.documentElement).getPropertyValue(`--priority-${priorityClass}`).trim();
});
document.getElementById('kpi-total-priority-tasks').textContent = `${tasksOnly.length} Tasks`;
charts.priorityDonut = createKpiDonutChart('priorityDonutChart', priorityChartData, priorityColors, priorityOrder);

// NEW KPI Card 6: Total Issues
const totalIssues = issuesOnly.length;
const openIssues = issuesOnly.filter(issue => issue.Status === 'Open' || issue.Status === 'At Risk').length;
const resolvedIssues = issuesOnly.filter(issue => issue.Status === 'Resolved').length;

document.getElementById('totalIssuesCount').textContent = totalIssues;
document.querySelector('#openIssuesKpi span:last-child').textContent = openIssues;
document.querySelector('#resolvedIssuesKpi span:last-child').textContent = resolvedIssues;
}

function checkDueTasks() {
const today = new Date();
today.setHours(0, 0, 0, 0);
const upcoming = new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000);
const overdue = window.allTaskData.filter(t => {
const end = parseDateLocal(t['End Date']);
return !isNaN(end) && end < today && t.Status !== 'Done';
}).length;
const dueSoon = window.allTaskData.filter(t => {
const end = parseDateLocal(t['End Date']);
return !isNaN(end) && end >= today && end <= upcoming && t.Status !== 'Done';
}).length;
if (overdue > 0) showToast(`${overdue} task(s) overdue`);
if (dueSoon > 0) showToast(`${dueSoon} task(s) nearing due date`);
}

function getSituationIcon(situation) {
if (!situation) return ''; // No icon for "None" or empty situation
const iconMap = {
Sunny: 'sunny',
Cloudy: 'cloud',
Thunderstorm: 'thunderstorm'
};
const colorClass = `situation-${situation.toLowerCase()}`;
const icon = iconMap[situation] || 'help_outline';
return `<span class="material-icons situation-icon ${colorClass}" title="${situation}">${icon}</span>`;
}

function getTypeIcon(type) {
const iconMap = {
'Task': 'assignment',
'Issue': 'bug_report',
'Vehicle Milestone': 'flag'
};
const icon = iconMap[type] || 'help_outline';
return `<span class="material-icons type-icon" title="${type}">${icon}</span>`;
}

/**
 * Adds a specified duration to a date.
 * @param {Date} date The starting date.
 * @param {number} duration The amount of the unit to add.
 * @param {string} unit The unit of duration (e.g., 'hour', 'day', 'month').
 * @returns {Date} The new date.
 */
function addDurationToDate(date, duration, unit) {
    const newDate = new Date(date);
    switch (unit) {
        case 'hour':
            newDate.setHours(newDate.getHours() + duration);
            break;
        case 'day':
            newDate.setDate(newDate.getDate() + duration);
            break;
        case 'week':
            newDate.setDate(newDate.getDate() + duration * 7);
            break;
        case 'month':
            newDate.setMonth(newDate.getMonth() + duration);
            break;
        case 'year':
            newDate.setFullYear(newDate.getFullYear() + duration);
            break;
    }
    return newDate;
}

function rgbToHex(color) {
const nums = color.match(/\d+/g);
if (!nums) return '#000000';
return '#' + nums.slice(0,3).map(x => parseInt(x).toString(16).padStart(2,'0')).join('');
}
function parseId(id) {
if (typeof id !== "string") return null;
const match = /^([AIV])([0-9]{3})$/i.exec(id.trim());
if (!match) return null;
const typeMap = { A: "Task", I: "Issue", V: "Milestone" };
return {
raw: id,
type: typeMap[match[1].toUpperCase()],
number: parseInt(match[2], 10)
};
}


function populateTaskMatrix(tasks) {
// Clear existing table head and body
taskMatrixTable.querySelector('thead tr').innerHTML = '';
taskMatrixTableBody.innerHTML = '';

const selectTh = document.createElement('th');
selectTh.className = 'select-col';
selectTh.innerHTML = 'SELECT <input type="checkbox" id="selectAllTasks">';
taskMatrixTableHeadRow.appendChild(selectTh);

const visibleTasks = getVisibleTasks(tasks);
// No longer need parentIds set here, as root logic is more robust

// Populate table header based on current column order
window.columnOrder.forEach(columnName => {
const th = document.createElement('th');
th.setAttribute('data-field-name', columnName);
th.setAttribute('draggable', 'true'); // Make headers draggable
th.textContent = COLUMN_DISPLAY_NAMES[columnName] || columnName;

// Add specific classes for progress cell if applicable
if (columnName === 'Progress (%)') {
th.classList.add('progress-cell');
}
taskMatrixTableHeadRow.appendChild(th);
th.addEventListener("click", () => {
if (window.tableSortState.column === columnName) {
window.tableSortState.ascending = !window.tableSortState.ascending;
} else {
window.tableSortState.column = columnName;
window.tableSortState.ascending = true;
}
window.applyFilters();
});
});

// Populate table body
visibleTasks.forEach(task => {
const row = document.createElement('tr');
const level = parseInt(task.Level || 1);
row.className = 'task-row' + (task._isCollapsed ? ' collapsed' : '');
row.dataset.taskId = task.TaskID;
row.dataset.level = level;
const endDate = parseDateLocal(task['End Date']);
const today = new Date();
today.setHours(0, 0, 0, 0);
const isOverdue = endDate < today && task.Status !== 'Done';
if (isOverdue) {
row.classList.add('overdue-row');
}
if (level === 1) {
row.classList.add('root-task-row');
}
if (task.ParentID) {
row.dataset.parentId = task.ParentID;
}

const selectCell = document.createElement('td');
selectCell.className = 'select-col';
selectCell.innerHTML = `<input type="checkbox" class="task-select" data-task-id="${task.TaskID}">`;
row.appendChild(selectCell);

window.columnOrder.forEach(columnName => {
const cell = document.createElement('td');
cell.setAttribute('data-field-name', columnName); // Set data-field-name on td for editing

const level = parseInt(task.Level || 1);
const indentation = (level - 1) * 25;

// Handle content for each column based on data field name
        switch (columnName) {
        case 'TaskID':
            cell.textContent = task.TaskID;
            break;
case 'Type Icon':
cell.style.textAlign = 'center';
cell.innerHTML = getTypeIcon(task.Type);
break;
case 'Task Name':
// Check for parent in *allTaskData* for expand/collapse toggle
const isParent = window.allTaskData.some(t => t.ParentID === task.TaskID);
const hasIssues = window.allTaskData.some(i => i.ParentID === task.TaskID && i.Type === 'Issue');
const issueIconHtml = hasIssues ? `<span class="material-icons" style="color: var(--status-at-risk); font-size: 1em; vertical-align: middle;">bug_report</span>` : '';
const delayIconHtml = isOverdue ? `<span class="material-icons" style="color: var(--status-at-risk); font-size: 1em; vertical-align: middle;">schedule</span>` : '';
const expandIcon = isParent ? `<span class="material-icons expand-toggle">${task._isCollapsed ? 'chevron_right' : 'expand_more'}</span>` : `<span style="width: 24px; display: inline-block;"></span>`;
cell.innerHTML = `
<div class="task-name-cell" style="padding-left: ${indentation}px;">
${expandIcon}
<span data-field-name="Task Name">${task['Task Name']}</span>
${issueIconHtml}
${delayIconHtml}
</div>
`;
break;
case 'Owner':
cell.textContent = task.Owner || 'N/A';
break;
case 'Sub Owner':
cell.textContent = task['Sub Owner'] || 'N/A';
break;
case 'Priority':
cell.textContent = task.Priority || 'N/A';
break;
case 'Baseline Start Date':
cell.textContent = task['Baseline Start Date'] || 'N/A';
break;
case 'Start Date':
cell.textContent = task['Start Date'] || 'N/A';
break;
case 'End Date':
cell.textContent = task['End Date'] || 'N/A';
break;
case 'Overdue':
cell.textContent = isOverdue ? 'Yes' : 'No';
break;
case 'Baseline End Date':
cell.textContent = task['Baseline End Date'] || 'N/A';
break;
case 'Progress (%)':
    if (task.Type !== 'Vehicle Milestone') {
        const progress = parseInt(task['Progress (%)'] || 0);
        cell.classList.add('progress-cell');
        cell.innerHTML = `
<div class="progress-bar-container">
    <div class="progress-bar" style="width: ${progress}%;"></div>
    <span class="progress-text">${progress}%</span>
</div>
`;
    } else {
        cell.textContent = ''; // Milestones do not have progress bar
    }
    break;
case 'Status':
const status = task.Status || "";
const statusClass = status ? `status-${status.toLowerCase().replace(/ /g, '-')}` : '';
cell.innerHTML = status ? `<span class="status-badge ${statusClass}">${status}</span>` : '';
break;
case 'Situation':
cell.style.textAlign = 'center';
cell.innerHTML = getSituationIcon(task.Situation);
break;
case 'Comments':
const comments = Array.isArray(task.Comments) ? task.Comments : [];
const unack = comments.filter(c => !c.acknowledged).length;
cell.classList.add('action-cell');
cell.innerHTML = `
<span class="material-icons comment-icon" data-task-id="${task.TaskID}" ${unack > 0 ? 'style="color: var(--primary-color);"' : ''}>comment</span>
${unack > 0 ? `<span class="comment-badge">${unack}</span>` : ''}
`;
break;
case 'Is Milestone?':
cell.textContent = task['Is Milestone?'] || 'No';
break;
case 'Progress Detail':
cell.textContent = task['Progress Detail'] || '';
break;
case 'Description':
cell.classList.add('editable-cell');
cell.innerHTML = task['Description'] || '';
break;
case 'Actions':
cell.classList.add('action-cell');
cell.innerHTML = `<span class="material-icons delete-btn" data-task-id="${task.TaskID}">delete</span>`;
break;
        default:
// This case handles any other data field that might be explicitly added or found
const val = task[columnName];
cell.textContent = Array.isArray(val) ? val.join(", ") : (val !== undefined ? val : "");
}
        const colorMap = task.TextColors || {};
        const textColor = colorMap[columnName];
        if (textColor) {
            if (columnName === 'Task Name') {
                const span = cell.querySelector('span[data-field-name="Task Name"]');
                if (span) span.style.color = textColor; else cell.style.color = textColor;
            } else {
                cell.style.color = textColor;
            }
        }
        row.appendChild(cell);
    });
    const checkbox = row.querySelector('.task-select');
    if (checkbox) {
        checkbox.addEventListener('change', updateSelectedActionsVisibility);
    }
    taskMatrixTableBody.appendChild(row);
});
setTableFontSize(currentTableFontSize);
updateSortIndicators();
const selectAllCheckbox = document.getElementById('selectAllTasks');
    if (selectAllCheckbox) {
        selectAllCheckbox.addEventListener('change', () => {
            const checked = selectAllCheckbox.checked;
            taskMatrixTableBody.querySelectorAll('.task-select').forEach(cb => cb.checked = checked);
            updateSelectedActionsVisibility();
        });
    }
    updateSelectedActionsVisibility();
}

// Function to apply current column visibility to the table
function applyColumnVisibilityToTable() {
// Select all th elements as they are now re-rendered according to columnOrder
const headerCells = taskMatrixTable.querySelectorAll('th');
const rows = taskMatrixTable.querySelectorAll('tbody tr');

headerCells.forEach((th) => {
const columnName = th.dataset.fieldName; // Use data-field-name to identify column
if (!columnName) return; // skip select column
const isVisible = window.columnVisibility[columnName];
const columnIndex = Array.from(th.parentNode.children).indexOf(th); // Get current index of the header

if (isVisible) {
th.classList.remove('hidden-column');
} else {
th.classList.add('hidden-column');
}

rows.forEach(row => {
const cell = row.children[columnIndex]; // Get the cell at the same index
if (cell) {
if (isVisible) {
cell.classList.remove('hidden-column');
} else {
cell.classList.add('hidden-column');
}
}
});
});
}

function updateKanbanBoard(tasks) {
    if (!kanbanContainer) return;
    const typeSelect = document.getElementById('kanbanTypeSelect');
    const selectedType = typeSelect ? typeSelect.value : 'Task';
    const board = document.getElementById('kanbanBoard');
    board.innerHTML = '';

    // Filter tasks by the selected type
    const filtered = tasks.filter(t => (t['Record Type'] || t.Type) === selectedType);
    const visibleTasks = getVisibleTasks(filtered);

    // Determine column order based on type-specific statuses
    const statuses = STATUS_OPTIONS[selectedType] || [];
statuses.forEach(status => {
const column = document.createElement('div');
column.className = 'kanban-column';
column.dataset.status = status;
column.addEventListener('dragover', (e) => {
e.preventDefault();
column.classList.add('drag-over');
});
column.addEventListener('dragleave', () => column.classList.remove('drag-over'));
column.addEventListener('drop', async (e) => {
e.preventDefault();
column.classList.remove('drag-over');
const taskId = e.dataTransfer.getData('text/plain');
if (!taskId) return;
await updateTaskData(taskId, 'Status', status);
if (typeof window.applyFilters === 'function') {
window.applyFilters();
} else if (typeof updateDashboard === 'function' && window.allTaskData) {
updateDashboard(window.allTaskData);
}
});
    const tasksForStatus = visibleTasks.filter(t => t.Status === status);
    const header = document.createElement('h4');
    header.textContent = `${status} (${tasksForStatus.length})`;
    column.appendChild(header);
    tasksForStatus.forEach(task => {
        const card = document.createElement('div');
        card.className = 'kanban-card';
        card.draggable = true;
        card.dataset.taskId = task.TaskID;
        if (task.Priority) {
            card.dataset.priority = task.Priority;
        }
        card.textContent = task['Task Name'];
card.addEventListener('dragstart', (e) => {
card.classList.add('dragging');
e.dataTransfer.setData('text/plain', task.TaskID);
});
card.addEventListener('dragend', () => card.classList.remove('dragging'));
card.addEventListener('click', () => showAddItemModal(task.TaskID));
column.appendChild(card);
});
board.appendChild(column);
});
}
function updateSortIndicators() {
const headers = taskMatrixTableHeadRow.querySelectorAll("th");
headers.forEach(th => {
const field = th.dataset.fieldName;
if (!field) {
th.innerHTML = 'SELECT <input type="checkbox" id="selectAllTasks">';
return;
}
let label = COLUMN_DISPLAY_NAMES[field] || field;
if (window.tableSortState.column === field) {
const icon = window.tableSortState.ascending ? "arrow_drop_up" : "arrow_drop_down";
label += ` <span class="material-icons sort-indicator">${icon}</span>`;
}
th.innerHTML = label;
});
}


function initFrappeGantt(elementId, tasks, viewMode = 'Day') {
    const container = typeof elementId === 'string' ? document.getElementById(elementId) : elementId;
    if (!container) return null;
    container.innerHTML = '';

    // Remove built-in padding so the chart range matches the task range exactly
    if (window.Gantt && Gantt.VIEW_MODE) {
        Object.values(Gantt.VIEW_MODE).forEach(m => m.padding = '0d');
    }

    const popup = (ctx) => {
        ctx.set_title(ctx.task.name);
        const fmt = d => {
            const date = new Date(d);
            return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        };
        const start = fmt(ctx.task._start);
        const end = fmt(new Date(ctx.task._end.getTime() - 1000));
        let details = `${start} - ${end}<br/>Progress: ${Math.floor(ctx.task.progress * 100) / 100}%`;
        if (ctx.task.progress_detail) {
            details += `<br/>DETAILS: ${ctx.task.progress_detail}`;
        }
        ctx.set_details(details);
    };

    return new Gantt(container, tasks, {
        view_mode: viewMode,
        on_date_change: onGanttDateChange,
        on_click: () => {}, // disable single-click editing
        infinite_padding: false,
        readonly: false,
        readonly_dates: false,
        readonly_progress: false,
        popup
    });
}

// Helper function to get CSS variable
function getCssVariable(variable) {
    return getComputedStyle(document.documentElement).getPropertyValue(variable).trim();
}

// Color mapping based on status
const statusColorMapping = {
    'Done': getCssVariable('--status-done'),
    'Resolved': getCssVariable('--status-resolved'),
    'In Progress': getCssVariable('--status-in-progress'),
    'On Hold': getCssVariable('--status-on-hold'),
    'At Risk': getCssVariable('--status-at-risk'),
    'Open': getCssVariable('--status-open'),
    'Not Started': getCssVariable('--status-not-started'),
};

// --- Baseline Helper Functions ---
function diffInUnits(a, b, unit) {
    const ms = a - b;
    switch (unit) {
        case 'hour':
            return ms / 3600000;
        case 'day':
            return ms / 86400000;
        case 'week':
            return ms / 604800000;
        case 'month':
            return (
                (a.getFullYear() - b.getFullYear()) * 12 +
                (a.getMonth() - b.getMonth()) +
                (a.getDate() - b.getDate()) / 30
            );
        case 'year':
            return (
                a.getFullYear() - b.getFullYear() +
                (a.getMonth() - b.getMonth()) / 12
            );
        default:
            return ms / 86400000;
    }
}

function computeXForDate(gantt, date) {
    const diff =
        diffInUnits(date, gantt.gantt_start, gantt.config.unit) / gantt.config.step;
    return diff * gantt.config.column_width;
}

function addBaselineBars(gantt) {
    if (!gantt || !gantt.bars) return;
    gantt.bars.forEach(bar => {
        const existing = bar.group.querySelector('.bar-baseline');
        if (existing) existing.remove();
    });
    if (!baselineVisible) return;
    gantt.bars.forEach(bar => {
        const task = bar.task;
        if (!task || !task.baseline_start || !task.baseline_end) return;
        const start = parseDateLocal(task.baseline_start);
        const end = parseDateLocal(task.baseline_end);
        if (isNaN(start) || isNaN(end)) return;
        const x = computeXForDate(gantt, start);
        const endX = computeXForDate(gantt, end);
        const width = endX - x;
        if (width <= 0) return;
        const y = bar.y + bar.height + 4;
        const height = bar.height / 3;
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('x', x);
        rect.setAttribute('y', y);
        rect.setAttribute('width', width);
        rect.setAttribute('height', height);
        rect.setAttribute('class', 'bar-baseline');
        bar.group.appendChild(rect);
    });
}

function addMilestoneMarkers(gantt) {
    if (!gantt || !gantt.bars) return;
    const milestoneMap = gantt.milestoneMap || new Map();
    // Clear existing markers and reset bars/labels
    gantt.bars.forEach(bar => {
        bar.group.querySelectorAll('.milestone-marker').forEach(m => m.remove());
        bar.group.querySelectorAll('.milestone-label').forEach(m => m.remove());
        if (bar.$bar) bar.$bar.style.display = bar.task.Type === 'MilestoneRow' ? 'none' : '';
        const label = bar.group.querySelector('.bar-label');
        if (label && bar.task.Type !== 'MilestoneRow') {
            label.style.display = '';
            label.classList.remove('milestone-label');
            label.removeAttribute('text-anchor');
            bar.update_label_position && bar.update_label_position();
        }
    });

    // Draw markers on dedicated milestone rows
    gantt.bars.forEach(bar => {
        const task = bar.task;
        if (!task || task.Type !== 'MilestoneRow') return;
        const milestones = milestoneMap.get(task.parentID) || [];
        if (milestones.length === 0) return;
        const y = bar.y + bar.height / 2;
        const size = bar.height / 2;
        milestones.forEach(ms => {
            const date = parseDateLocal(ms.date);
            if (isNaN(date)) return;
            const x = computeXForDate(gantt, date);
            const points = [
                [x, y - size].join(','),
                [x + size, y].join(','),
                [x, y + size].join(','),
                [x - size, y].join(',')
            ].join(' ');
            const diamond = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
            diamond.setAttribute('points', points);
            diamond.setAttribute('class', 'milestone-marker');
            bar.group.appendChild(diamond);

            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('class', 'milestone-label');
            text.textContent = ms.name;
            text.setAttribute('x', x + size + 4);
            text.setAttribute('y', y + 4); // slight offset for vertical centering
            bar.group.appendChild(text);
        });
        // Hide the default label for milestone rows
        const label = bar.group.querySelector('.bar-label');
        if (label) label.style.display = 'none';
    });
}

function attachGanttDoubleClick(gantt) {
    if (!gantt || !gantt.bars) return;
    gantt.bars.forEach(bar => {
        if (!bar.group || !bar.task) return;
        const id = bar.task.id;
        if (!id || String(id).includes('milestones')) return;
        if (bar._dblClickHandler) {
            bar.group.removeEventListener('dblclick', bar._dblClickHandler);
        }
        bar._dblClickHandler = () => showAddItemModal(id);
        bar.group.addEventListener('dblclick', bar._dblClickHandler);
    });
}

function highlightTableRowById(taskId) {
    if (!taskMatrixTableBody) return;
    const rows = taskMatrixTableBody.querySelectorAll('tr');
    rows.forEach(row => {
        const cb = row.querySelector('.task-select');
        if (row.dataset.taskId === String(taskId)) {
            row.classList.add('highlight-row');
            if (cb) cb.checked = true;
            row.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
            row.classList.remove('highlight-row');
            if (cb) cb.checked = false;
        }
    });
    updateSelectedActionsVisibility();
}

function attachGanttClick(gantt) {
    if (!gantt || !gantt.bars) return;
    gantt.bars.forEach(bar => {
        if (!bar.group || !bar.task) return;
        const id = bar.task.id;
        if (!id || String(id).includes('milestones')) return;
        if (bar._clickHandler) {
            bar.group.removeEventListener('click', bar._clickHandler);
        }
        bar._clickHandler = () => {
            // Only highlight the related table row when not in Gantt edit mode
            if (!ganttEditMode) highlightTableRowById(id);
        };
        bar.group.addEventListener('click', bar._clickHandler);
    });
}

function attachGanttLabelContextMenu(gantt) {
    if (!gantt || !gantt.bars) return;
    gantt.bars.forEach(bar => {
        if (!bar.group) return;
        const label = bar.group.querySelector('.bar-label');
        if (!label) return;
        if (bar.task) {
            const color = bar.task.label_color || bar.task.LabelColor;
            if (color) label.style.fill = color;
        }
        if (bar._labelContextMenu) {
            bar.group.removeEventListener('contextmenu', bar._labelContextMenu);
        }
        bar._labelContextMenu = (event) => {
            event.preventDefault();
            currentGanttLabel = label;
            currentGanttTaskId = bar.task && bar.task.id;
            const rect = label.getBoundingClientRect();
            ganttLabelColorPicker.style.left = `${rect.left + window.scrollX}px`;
            ganttLabelColorPicker.style.top = `${rect.top + window.scrollY}px`;
            const computedColor = label.getAttribute('fill') || getComputedStyle(label).fill;
            ganttLabelColorPicker.value = rgbToHex(computedColor);
            selectedGanttLabelColor = ganttLabelColorPicker.value;
            ganttLabelColorPicker.style.display = 'block';
            applyGanttLabelColorBtn.style.left = `${rect.left + window.scrollX + ganttLabelColorPicker.offsetWidth}px`;
            applyGanttLabelColorBtn.style.top = `${rect.top + window.scrollY}px`;
            applyGanttLabelColorBtn.style.display = 'block';
            ganttLabelColorPicker.focus();
        };
        bar.group.addEventListener('contextmenu', bar._labelContextMenu);
    });
}

// Position bar labels to the left of each task bar
function positionGanttLabelsLeft(gantt) {
    if (!gantt || !gantt.bars) return;
    gantt.bars.forEach(bar => {
        if (!bar.group) return;
        const label = bar.group.querySelector('.bar-label');
        if (!label) return;
        const original = bar._originalUpdateLabel || bar.update_label_position;
        bar._originalUpdateLabel = original;
        bar.update_label_position = function() {
            if (original) original.call(this);
            const lbl = this.group.querySelector('.bar-label');
            if (!lbl || !this.$bar) return;
            lbl.setAttribute('text-anchor', 'end');
            lbl.setAttribute('x', this.$bar.getX() - 5);
        };
        bar.update_label_position();
    });
}

// Update CSS variables to match the Gantt chart dimensions
function updateGanttRowHeight(gantt) {
    if (!gantt || !gantt.options) return;
    const height = (gantt.options.bar_height || 0) + (gantt.options.padding || 0);
    document.documentElement.style.setProperty('--gantt-row-height', `${height}px`);
    const header = gantt.options.header_height || 0;
    document.documentElement.style.setProperty('--gantt-header-height', `${header}px`);
}

function createGanttChart(elementId, data, labelKey, startKey, endKey) {
    const container = document.getElementById(elementId);
    if (!container) return null;
    container.innerHTML = '';
    if (!data || data.length === 0) {
        container.textContent = 'No data for the selected period.';
        return null;
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const milestoneMap = new Map();
    data.forEach(t => {
        if (t.Type === 'Vehicle Milestone' && t.ParentID) {
            if (!milestoneMap.has(t.ParentID)) milestoneMap.set(t.ParentID, []);
            milestoneMap.get(t.ParentID).push({
                date: parseDateLocal(t[startKey] || t[endKey]),
                name: t[labelKey]
            });
        }
    });

    const tasks = [];
    const fmt = d => formatDateLocal(d);
    data.forEach(t => {
        if (t.Type === 'Vehicle Milestone') return; // skip individual milestone rows
        const statusClass = (t.Status || 'default').toLowerCase().replace(/ /g, '-');
        const endDate = parseDateLocal(t[endKey]);
        const overdue = endDate && endDate < today && t.Status !== 'Done' && t.Status !== 'Resolved';
        const customClass = overdue ? 'gantt-bar-overdue' : `gantt-bar-${statusClass}`;
        tasks.push({
            id: t.TaskID,
            name: t[labelKey],
            start: parseDateLocal(t[startKey]),
            end: parseDateLocal(t[endKey]),
            baseline_start: parseDateLocal(t['Baseline Start Date']),
            baseline_end: parseDateLocal(t['Baseline End Date']),
            progress: parseFloat(t['Progress (%)']) || 0,
            dependencies: Array.isArray(t.Predecessors) ? t.Predecessors.join(',') : (t.Predecessors || ''),
            custom_class: customClass,
            Type: t.Type,
            progress_detail: t['Progress Detail'] || '',
            label_color: t.LabelColor || (t.TextColors && t.TextColors['Task Name'])
        });

        if (milestoneMap.has(t.TaskID)) {
            const dates = milestoneMap.get(t.TaskID)
                .map(m => parseDateLocal(m.date))
                .filter(d => !isNaN(d));
            if (dates.length > 0) {
                const start = new Date(Math.min(...dates));
                const end = new Date(Math.max(...dates));
                tasks.push({
                    id: `${t.TaskID}-milestones`,
                    name: 'Milestones',
                    start: fmt(start),
                    end: fmt(end),
                    baseline_start: fmt(start),
                    baseline_end: fmt(end),
                    progress: 0,
                    dependencies: '',
                    custom_class: 'milestone-row',
                    Type: 'MilestoneRow',
                    parentID: t.TaskID
                });
            }
        }
    });

    const viewMode = selectBestViewMode(tasks);
    const gantt = initFrappeGantt(container, tasks, viewMode);
    gantt.milestoneMap = milestoneMap;
    gantt.milestoneStartKey = startKey;
    updateGanttRowHeight(gantt);
    addBaselineBars(gantt);
    addMilestoneMarkers(gantt);
    attachGanttDoubleClick(gantt);
    attachGanttClick(gantt);
    attachGanttLabelContextMenu(gantt);
    positionGanttLabelsLeft(gantt);
    charts[elementId] = gantt;
    if (elementId === 'ganttChart') {
        const wrapper = container.closest('.gantt-wrapper');
        if (wrapper) {
            const list = wrapper.querySelector('#ganttTaskList');
            const scrollContainer = wrapper.parentElement;
            if (list && scrollContainer) {
                list.innerHTML = '';
                tasks.forEach(t => {
                    const row = document.createElement('div');
                    row.className = 'gantt-task-row';
                    if (t.Type === 'MilestoneRow') {
                        row.classList.add('milestone-row');
                    }
                    row.textContent = t.name;
                    list.appendChild(row);
                });
                scrollContainer.addEventListener('scroll', () => {
                    list.scrollTop = scrollContainer.scrollTop;
                });
                list.addEventListener('scroll', () => {
                    scrollContainer.scrollTop = list.scrollTop;
                });
            }
        }
    }
    const idx = ganttViewModes.indexOf(viewMode);
    currentGanttView = idx !== -1 ? idx : ganttViewModes.indexOf('Day');
    if (elementId === 'ganttChart' && ganttViewModeSelect) {
        ganttViewModeSelect.value = ganttViewModes[currentGanttView];
    }
    return gantt;
}

// --- Zoom and Scrollbar Functions ---
function setTableFontSize(size) {
if (size < 10 || size > 20) return; // Set min/max font size
currentTableFontSize = size;
taskMatrixTableBody.style.fontSize = `${currentTableFontSize}px`;
}

let ganttViewModes = ["Month", "Week", "Day", "Half Day", "Quarter Day"];
let currentGanttView = ganttViewModes.indexOf('Day');
function zoomGantt(direction) {
    const chart = charts.gantt;
    if (!chart) return;
    if(direction === "in" && currentGanttView < ganttViewModes.length - 1) {
        currentGanttView++;
    } else if(direction === "out" && currentGanttView > 0) {
        currentGanttView--;
    }
    chart.change_view_mode(ganttViewModes[currentGanttView]);
    updateGanttRowHeight(chart);
    addBaselineBars(chart);
    addMilestoneMarkers(chart);
    attachGanttDoubleClick(chart);
    attachGanttClick(chart);
    attachGanttLabelContextMenu(chart);
    positionGanttLabelsLeft(chart);
    if (ganttViewModeSelect) {
        ganttViewModeSelect.value = ganttViewModes[currentGanttView];
    }
}

// In dashboard.js, replace the old changeGanttView function with this one.

// In dashboard.js, replace the existing changeGanttView function with this:

function changeGanttView(mode) {
    const chart = charts.gantt;
    const idx = ganttViewModes.indexOf(mode);

    if (chart && idx !== -1) {
        // 1. Get the date at the center of the current view BEFORE changing.
        const oldConfig = { ...chart.config }; // Copy old config before it changes.
        const scrollLeft = ganttContainer.scrollLeft;
        const containerWidth = ganttContainer.clientWidth;
        const centerPixel = scrollLeft + (containerWidth / 2);

        const unitsFromStart = (centerPixel / oldConfig.column_width) * oldConfig.step;
        const centerDate = addDurationToDate(chart.gantt_start, unitsFromStart, oldConfig.unit);

        // 2. Change the view mode, which re-renders the chart and resets the scroll.
        currentGanttView = idx;
        chart.change_view_mode(mode);
        updateGanttRowHeight(chart);
        addBaselineBars(chart);
        addMilestoneMarkers(chart);
        attachGanttDoubleClick(chart);
        attachGanttClick(chart);
        attachGanttLabelContextMenu(chart);
        positionGanttLabelsLeft(chart);

        // 3. AFTER re-rendering, scroll back to the preserved center date.
        // A timeout ensures the DOM has fully updated from the re-render.
        setTimeout(() => {
            if (chart.set_scroll_position) {
                chart.set_scroll_position(centerDate);
            }
        }, 0);
    }
}

function changeGanttModalView(mode) {
    const chart = charts.ganttModal;
    const idx = ganttViewModes.indexOf(mode);
    if (chart && idx !== -1) {
        chart.change_view_mode(mode);
        updateGanttRowHeight(chart);
        addBaselineBars(chart);
        addMilestoneMarkers(chart);
        attachGanttDoubleClick(chart);
        attachGanttClick(chart);
        attachGanttLabelContextMenu(chart);
        positionGanttLabelsLeft(chart);
    }
}


// --- Filter Functions ---
function populateSelectFilter(selectElement, data, fieldName) {
const uniqueValues = [...new Set(data.map(item => item[fieldName]).filter(Boolean))];
selectElement.innerHTML = '<option value="all">All</option>';
uniqueValues.sort().forEach(value => {
selectElement.innerHTML += `<option value="${value}">${value}</option>`;
});
Array.from(selectElement.options).forEach(o => o.selected = o.value === 'all');
}

function getVisibleTasks(tasks) {
const taskMap = new Map(window.allTaskData.map(t => [t.TaskID, t])); // Use all tasks for parent lookup
const visibleTasks = [];
tasks.forEach(task => {
let isVisible = true;
let currentParentId = task.ParentID;
while (currentParentId) {
const parent = taskMap.get(currentParentId);
if (parent && parent._isCollapsed) {
isVisible = false;
break;
}
currentParentId = parent ? parent.ParentID : null;
}
if (isVisible) {
visibleTasks.push(task);
}
});
return visibleTasks;
}

// REVISED FILTER LOGIC TO PRESERVE HIERARCHY
window.applyFilters = function() {
const startDate = startDateFilter.valueAsDate;
const endDate = endDateFilter.valueAsDate;
const selectedProjects = Array.from(projectFilter.selectedOptions).map(o => o.value);
const selectedOwners = Array.from(ownerFilter.selectedOptions).map(o => o.value);
const selectedStatuses = Array.from(statusFilter.selectedOptions).map(o => o.value);
const selectedSituations = Array.from(situationFilter.selectedOptions).map(o => o.value);
let selectedTypes = Array.from(typeFilter.selectedOptions).map(o => o.value);
const switchTypes = window.typeSwitchValues || ['all'];
if (!(switchTypes.length === 1 && switchTypes[0] === 'all')) {
    selectedTypes = switchTypes;
}
const selectedIssueTypes = Array.from(issueTypeFilter.selectedOptions).map(o => o.value);
const searchTerm = tableSearchInput.value.trim().toLowerCase();

const taskMap = new Map(window.allTaskData.map(t => [t.TaskID, t]));

let filteredData = window.allTaskData; // Start with all data

// If any filters are active, perform filtering
const projectFilterActive = selectedProjects.length > 0 && !selectedProjects.includes('all');
const ownerFilterActive = selectedOwners.length > 0 && !selectedOwners.includes('all');
const statusFilterActive = selectedStatuses.length > 0 && !selectedStatuses.includes('all');
const situationFilterActive = selectedSituations.length > 0 && !selectedSituations.includes('all');
const issueTypeFilterActive = selectedIssueTypes.length > 0 && !selectedIssueTypes.includes('all');
const typeFilterActive = selectedTypes.length > 0 && !selectedTypes.includes('all');
const searchActive = searchTerm.length > 0;
if (projectFilterActive || ownerFilterActive || statusFilterActive || situationFilterActive || typeFilterActive || issueTypeFilterActive || startDate || endDate || searchActive) {
// 1. Find all items that directly match the filters
const directMatches = window.allTaskData.filter(item => {
const itemStart = parseDateLocal(item['Start Date']);
const itemEnd = parseDateLocal(item['End Date']);

const projectMatch = !projectFilterActive || selectedProjects.includes(item['Project Name']);
const ownerMatch = !ownerFilterActive || selectedOwners.includes(item['Owner']);
const statusMatch = !statusFilterActive || selectedStatuses.includes(item['Status']);
const situationMatch = !situationFilterActive || selectedSituations.includes(item['Situation']);
const typeValue = item['Record Type'] || item.Type;
const normalizedType = typeValue === 'Vehicle' ? 'Vehicle Milestone' : typeValue;
const typeMatch = !typeFilterActive ||
    selectedTypes.includes(typeValue) ||
    selectedTypes.includes(normalizedType);
const issueTypeMatch = !issueTypeFilterActive || selectedIssueTypes.includes(item['Issue Type']);
const dateMatch = (!startDate || !endDate) || (itemStart <= endDate && itemEnd >= startDate);
const textMatch = !searchActive || Object.values(item).some(val =>
    typeof val === 'string' && val.toLowerCase().includes(searchTerm));
return projectMatch && ownerMatch && statusMatch && situationMatch && typeMatch && issueTypeMatch && dateMatch && textMatch;
});

const finalIds = new Set();

// 2. For each match, add its full hierarchy (ancestors and descendants)
for (const item of directMatches) {
// Add item itself
finalIds.add(item.TaskID);
// Add ancestors
let current = item;
while (current && current.ParentID) {
finalIds.add(current.ParentID);
current = taskMap.get(current.ParentID);
}
}
filteredData = window.allTaskData.filter(item => finalIds.has(item.TaskID));
}

// After filtering, explicitly build the hierarchy to ensure correct order
// This step ensures that parent-child relationships are respected for display order.
const dataToDisplayOrdered = buildHierarchy(filteredData);
const sortedData = sortHierarchy(dataToDisplayOrdered, window.tableSortState.column, window.tableSortState.ascending);

updateDashboard(sortedData);
}

function toggleTaskCollapse(taskId) {
const task = window.allTaskData.find(t => t.TaskID === taskId);
if (task) {
task._isCollapsed = !task._isCollapsed;
window.applyFilters(); // Re-apply all filters to get the correct view
}
}

// --- Inline Editing Functions ---

async function updateTaskData(taskId, fieldName, newValue) {
const task = window.allTaskData.find(t => t.TaskID === taskId);
if (task) {
const oldStart = task['Start Date'];
const oldEnd = task['End Date'];
  task[fieldName] = newValue;
  console.log(`Updated Task ${taskId}: Set ${fieldName} to ${newValue}`);

if (fieldName === 'Status') {
if (newValue === 'Done' || newValue === 'Resolved') {
task['Progress (%)'] = '100';
} else if (newValue === 'Not Started') {
task['Progress (%)'] = '0';
}
} else if (fieldName === 'Progress (%)') {
const progress = parseInt(newValue, 10);
if (progress === 100) {
task.Status = task.Type === 'Issue' ? 'Resolved' : 'Done';
} else if (progress === 0) {
task.Status = task.Type === 'Issue' ? 'Open' : 'Not Started';
} else {
if(task.Status !== 'On Hold' && task.Status !== 'At Risk') {
task.Status = 'In Progress';
}
}
}

  if (fieldName === 'Start Date' || fieldName === 'End Date') {
    adjustDependentTaskDates(task, oldStart, oldEnd);
  }

  calculateParentProgress(window.allTaskData);

  await saveProjectData();
  window.applyFilters();
}
}

function makeCellEditable(cell) {
const fieldName = cell.dataset.fieldName;
if (!fieldName || fieldName === 'Overdue' || fieldName === 'Type Icon' || fieldName === 'Comments') return;

const taskId = cell.closest('tr').dataset.taskId;
const task = window.allTaskData.find(t => t.TaskID === taskId);
if (!task) return;

  // Prevent editing progress for milestones or parent tasks
  const isParentTask = window.allTaskData.some(t => t.ParentID === task.TaskID);
  if (fieldName === 'Progress (%)' && (task.Type === 'Vehicle Milestone' || isParentTask)) return;

if (cell.querySelector('.inline-edit')) {
return;
}

let originalContent = cell.innerHTML;
let currentValue = task[fieldName] || (fieldName === 'Progress (%)' ? '0' : '');
let inputElement;

if (fieldName === 'Progress (%)') {
  inputElement = document.createElement('input');
  inputElement.type = 'number';
  inputElement.className = 'inline-edit';
  inputElement.min = 0;
  inputElement.max = 100;
  inputElement.value = currentValue;

} else if (fieldName === 'Status') {
// Find the text content of the status badge for current value
const statusBadge = cell.querySelector('.status-badge');
originalContent = statusBadge ? statusBadge.textContent.trim() : '';
currentValue = originalContent; // Use the text content as the current value

const statuses = STATUS_OPTIONS[task.Type] || KANBAN_STATUS_ORDER;
inputElement = document.createElement('select');
inputElement.className = 'inline-edit';
statuses.forEach(s => {
const option = document.createElement('option');
option.value = s;
option.textContent = s;
if (s === originalContent) {
option.selected = true;
}
inputElement.appendChild(option);
});
} else if (fieldName === 'Situation') {
currentValue = task.Situation || ''; // Ensure current value is an empty string if null/undefined
const situations = ['Sunny', 'Cloudy', 'Thunderstorm'];
// Add "None" option at the beginning
const allSituations = [''].concat(situations); // '' for None
inputElement = document.createElement('select');
inputElement.className = 'inline-edit';
allSituations.forEach(s => {
const option = document.createElement('option');
option.value = s;
option.textContent = s === '' ? 'None' : s; // Display 'None' for empty value
if (s === currentValue) {
option.selected = true;
}
inputElement.appendChild(option);
});
} else if (fieldName === 'Priority') {
currentValue = task.Priority;
const priorities = ['High', 'Medium', 'Low'];
inputElement = document.createElement('select');
inputElement.className = 'inline-edit';
priorities.forEach(p => {
const option = document.createElement('option');
option.value = p;
option.textContent = p;
if (p === currentValue) {
option.selected = true;
}
inputElement.appendChild(option);
});
} else if (fieldName === 'Is Milestone?') {
currentValue = task['Is Milestone?'];
const milestoneOptions = ['Yes', 'No'];
inputElement = document.createElement('select');
inputElement.className = 'inline-edit';
milestoneOptions.forEach(m => {
const option = document.createElement('option');
option.value = m;
option.textContent = m;
if (m === currentValue) {
option.selected = true;
}
inputElement.appendChild(option);
});
} else if (fieldName.includes('Date')) {
const date = parseDateLocal(currentValue);
const formattedDate = !isNaN(date) ? formatDateLocal(date) : '';
inputElement = document.createElement('input');
inputElement.type = 'date';
inputElement.className = 'inline-edit';
inputElement.value = formattedDate;
} else {
// For 'Task Name' and 'Progress Detail'
// Check if the cell contains a specific span (for Task Name) or just textContent
const specialSpan = cell.querySelector(`span[data-field-name="${fieldName}"]`);
if(specialSpan) {
currentValue = specialSpan.textContent.trim();
} else {
currentValue = cell.textContent.trim();
}
inputElement = document.createElement('input');
inputElement.type = 'text';
inputElement.className = 'inline-edit';
inputElement.value = currentValue;
}

// Replace cell content with input element
// Special handling for 'Task Name' since it has nested structure
if(fieldName === 'Task Name') {
const taskNameDiv = cell.querySelector('.task-name-cell');
if(taskNameDiv) {
const taskNameSpan = taskNameDiv.querySelector('span[data-field-name="Task Name"]');
if (taskNameSpan) {
taskNameSpan.textContent = ''; // Clear original text
taskNameSpan.appendChild(inputElement);
} else {
// Fallback if structure changes, but should not happen with data-field-name
cell.innerHTML = '';
cell.appendChild(inputElement);
}
}
} else {
cell.innerHTML = '';
cell.appendChild(inputElement);
}

inputElement.focus();
if(inputElement.select) {
inputElement.select();
}

const save = () => {
let newValue = inputElement.value;
if (inputElement.type === 'date' && newValue) {
    const date = parseDateLocal(newValue);
    const offset = date.getTimezoneOffset();
    const correctedDate = new Date(date.getTime() + (offset * 60 * 1000));
newValue = formatDateLocal(correctedDate);
}

if(newValue !== currentValue) {
updateTaskData(taskId, fieldName, newValue);
} else {
// If no change, re-render to restore original content from data
window.applyFilters(); 
}
};

inputElement.addEventListener('blur', save, { once: true });

inputElement.addEventListener('keydown', (e) => {
if (e.key === 'Enter') {
e.preventDefault();
inputElement.blur();
} else if (e.key === 'Escape') {
window.applyFilters(); // Revert changes by re-rendering
inputElement.removeEventListener('blur', save); // Prevent blur from triggering save
}
});
}

let activeQuill = null;
let activeQuillCell = null;

function openQuillEditor(cell) {
if (activeQuillCell === cell) return;
closeQuillEditor();

activeQuillCell = cell;
const initialHtml = cell.innerHTML;
cell.innerHTML = '';
const editorDiv = document.createElement('div');
cell.appendChild(editorDiv);
activeQuill = new Quill(editorDiv, {
modules: { toolbar: [['bold', 'italic', 'underline'], [{ color: [] }]] },
theme: 'snow'
});
activeQuill.root.innerHTML = initialHtml;

// Match editor text color with the current cell color
const currentCellColor = getComputedStyle(cell).color;
activeQuill.root.style.color = currentCellColor;

// Show the cell color picker next to the editing cell
currentColorCell = cell;
const rect = cell.getBoundingClientRect();
cellTextColorPicker.style.left = `${rect.left + window.scrollX}px`;
cellTextColorPicker.style.top = `${rect.top + window.scrollY}px`;
cellTextColorPicker.value = rgbToHex(currentCellColor);
selectedCellTextColor = cellTextColorPicker.value;
cellTextColorPicker.style.display = 'block';
applyCellTextColorBtn.style.left = `${rect.left + window.scrollX + cellTextColorPicker.offsetWidth}px`;
applyCellTextColorBtn.style.top = `${rect.top + window.scrollY}px`;
applyCellTextColorBtn.style.display = 'block';

const finish = () => closeQuillEditor();
activeQuill.root.addEventListener('blur', finish);
activeQuill.root.addEventListener('keydown', (e) => {
if (e.key === 'Enter' && e.ctrlKey) {
e.preventDefault();
finish();
}
});
activeQuill.focus();
}

function closeQuillEditor() {
if (!activeQuill || !activeQuillCell) return;
const html = activeQuill.root.innerHTML;
const taskId = activeQuillCell.closest('tr').dataset.taskId;
const task = window.allTaskData.find(t => String(t.TaskID) === String(taskId));
if (task) {
task.Description = html;
}
saveProjectData();
window.applyFilters();
activeQuillCell.innerHTML = html;
cellTextColorPicker.style.display = 'none';
applyCellTextColorBtn.style.display = 'none';
currentColorCell = null;
activeQuill = null;
activeQuillCell = null;
}

function exportDataToCsv() {
if (window.allTaskData.length === 0) {
showCustomAlert("No data to export.");
return;
}

  const dataToExport = window.allTaskData.map(task => {
    const { _isCollapsed, Type, TextColors, LabelColor, 'Progress Detail': progressDetail, ...exportedTask } = task;
    exportedTask.DETAILS = progressDetail || '';
    return exportedTask;
  });

const csv = Papa.unparse(dataToExport);

const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });

const link = document.createElement("a");
const url = URL.createObjectURL(blob);
link.setAttribute("href", url);
link.setAttribute("download", "project_tasks_export.csv");
link.style.visibility = 'hidden';

document.body.appendChild(link);
link.click();
document.body.removeChild(link);
showToast('Data exported to CSV');
}

function exportDataToPdf() {
  if (window.allTaskData.length === 0) {
    showCustomAlert("No data to export.");
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  const generated = new Date().toLocaleString();
  doc.text('Project Tasks Export', 14, 10);
  doc.text(`Generated on ${generated}` , 14, 16);

  const headers = [[
    'TaskID', 'Task Name', 'Owner', 'Priority',
    'Start Date', 'End Date', 'Progress (%)', 'Status', 'DETAILS'
  ]];

  const body = window.allTaskData.map(task => [
    task.TaskID,
    task['Task Name'],
    task.Owner || '',
    task.Priority || '',
    task['Start Date'],
    task['End Date'],
    task['Progress (%)'] || '',
    task.Status,
    task['Progress Detail'] || ''
  ]);

  doc.autoTable({
    head: headers,
    body,
    startY: 20,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [22, 160, 133] }
  });

  doc.save('project_tasks_export.pdf');
  showToast('Data exported to PDF');
}

function generateMermaidGanttCode(tasks) {
  const lines = ['gantt', '  dateFormat  YYYY-MM-DD'];
  tasks.forEach(t => {
    const start = t['Start Date'];
    const end = t['End Date'];
    if (!start || !end) return;
    const name = String(t['Task Name']).replace(/:/g, '');
    lines.push(`  ${name} :${t.TaskID}, ${start}, ${end}`);
  });
  return lines.join('\n');
}

async function exportGanttToPdf() {
  if (window.allTaskData.length === 0) {
    showCustomAlert('No data to export.');
    return;
  }

  const code = generateMermaidGanttCode(window.allTaskData);

  try {
    const tmpContainer = document.createElement('div');
    tmpContainer.style.display = 'none';
    document.body.appendChild(tmpContainer);

    const { svg } = await mermaid.render('gantt-export', code, tmpContainer);
    const parser = new DOMParser();
    const svgElement = parser.parseFromString(svg, 'image/svg+xml').documentElement;

    tmpContainer.remove();
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
    await svg2pdf(svgElement, doc, { xOffset: 0, yOffset: 0 });
    doc.save('gantt_chart.pdf');
    showToast('Gantt chart exported to PDF');
  } catch (err) {
    console.error(err);
    showCustomAlert('Failed to generate Gantt PDF.');
  }
}

function exportCommentsToCsv() {
const allComments = [];
window.allTaskData.forEach(task => {
if (Array.isArray(task.Comments)) {
task.Comments.forEach(c => {
allComments.push({
TaskID: task.TaskID,
Author: c.author,
Comment: c.text,
Timestamp: c.timestamp,
Acknowledged: c.acknowledged ? 'Yes' : 'No'
});
});
}
});

if (allComments.length === 0) {
showCustomAlert('No comments to export.');
return;
}

const csv = Papa.unparse(allComments);
const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
const link = document.createElement('a');
const url = URL.createObjectURL(blob);
link.setAttribute('href', url);
link.setAttribute('download', 'project_comments_export.csv');
link.style.visibility = 'hidden';
document.body.appendChild(link);
link.click();
document.body.removeChild(link);
showToast('Comments exported');
}

async function importCommentsFromCsv(file) {
if (!file) return;
const results = await new Promise((resolve, reject) => {
Papa.parse(file, { header: true, skipEmptyLines: true, complete: resolve, error: reject });
});
results.data.forEach(row => {
const taskId = row.TaskID;
const text = row.Comment || row.Text || row.comment;
if (!taskId || !text) return;
const task = window.allTaskData.find(t => t.TaskID == taskId);
if (!task) return;
const comment = {
author: row.Author || 'Imported',
text,
timestamp: row.Timestamp || new Date().toISOString(),
acknowledged: (row.Acknowledged || '').toLowerCase() === 'yes'
};
if (!Array.isArray(task.Comments)) task.Comments = [];
task.Comments.push(comment);
});
await saveProjectData();
window.applyFilters();
showToast('Comments imported');
}

// Function to sort the combined data into a proper hierarchy
function buildHierarchy(items) {
// Use the global allTaskData for comprehensive parent lookup
const globalItemMap = new Map(window.allTaskData.map(i => [i.TaskID, i]));
const sortedList = [];

// Find root items: An item is a root if it has no ParentID, OR if its ParentID exists but is not found in the *global* item map.
// The `!globalItemMap.has(i.ParentID)` part ensures that if a parent is genuinely missing from the full dataset, the child becomes a root.
// However, since `applyFilters` pulls in ancestors, this mostly boils down to `!i.ParentID` for default data.
const roots = items.filter(i => !i.ParentID || !globalItemMap.has(i.ParentID));

// Sort root items to have a consistent starting order
// Prioritize 'Task' type over 'Issue' or 'Vehicle Milestone', then sort by TaskID
roots.sort((a,b) => {
// Define a consistent order for types
const typeOrder = { 'Task': 1, 'Issue': 2, 'Vehicle Milestone': 3 };
const typeA = typeOrder[a.Type] || 99; // Assign higher number for unknown types
const typeB = typeOrder[b.Type] || 99;

if (typeA < typeB) return -1;
if (typeA > typeB) return 1;

// If types are the same, sort by TaskID for consistent ordering
return String(a.TaskID).localeCompare(String(b.TaskID), undefined, {numeric: true});
});

// Recursive function to add an item and all its descendants to the list
function addNodeAndChildren(item) {
sortedList.push(item);
const children = items.filter(child => child.ParentID === item.TaskID);
// Sort children by Type (Tasks before Issues, then Vehicle Milestones) and then by TaskID
children.sort((a, b) => {
const typeOrder = { 'Task': 1, 'Issue': 2, 'Vehicle Milestone': 3 };
const typeA = typeOrder[a.Type] || 99;
const typeB = typeOrder[b.Type] || 99;

if (typeA < typeB) return -1;
if (typeA > typeB) return 1;

return String(a.TaskID).localeCompare(String(b.TaskID), undefined, {numeric: true});
});
for (const child of children) {
addNodeAndChildren(child);
}
}

// Start the process from the root items
for (const root of roots) {
addNodeAndChildren(root);
}

return sortedList;
}

function sortHierarchy(items, field, asc = true) {
if (!field) return items;
const childrenMap = {};
items.forEach(item => {
const pid = item.ParentID || "root";
(childrenMap[pid] = childrenMap[pid] || []).push(item);
});
const compare = (a, b) => {
let va = a[field], vb = b[field];
const da = Date.parse(va), db = Date.parse(vb);
if (!isNaN(da) && !isNaN(db)) return asc ? da - db : db - da;
const na = parseFloat(va), nb = parseFloat(vb);
if (!isNaN(na) && !isNaN(nb)) return asc ? na - nb : nb - na;
va = (va ?? "").toString().toLowerCase();
vb = (vb ?? "").toString().toLowerCase();
return asc ? va.localeCompare(vb) : vb.localeCompare(va);
};
function build(pid) {
const arr = (childrenMap[pid] || []).sort(compare);
return arr.flatMap(it => [it, ...build(it.TaskID)]);
}
  return build("root");
}

function calculateParentProgress(items) {
  if (!Array.isArray(items)) return items;
  const childMap = {};
  items.forEach(it => {
    if (it.ParentID) {
      (childMap[it.ParentID] = childMap[it.ParentID] || []).push(it);
    }
  });

  function compute(item) {
    const children = childMap[item.TaskID];
    if (!children || children.length === 0) {
      const val = parseFloat(item['Progress (%)']);
      return isNaN(val) ? NaN : val;
    }
    const vals = children.map(c => compute(c)).filter(v => !isNaN(v));
    if (vals.length === 0) {
      const val = parseFloat(item['Progress (%)']);
      return isNaN(val) ? NaN : val;
    }
    const avg = vals.reduce((s, v) => s + v, 0) / vals.length;
    item['Progress (%)'] = String(Math.round(avg));
    return avg;
  }

  items.filter(i => !i.ParentID).forEach(root => compute(root));
  return items;
}

function processRawData(rawData) {
// Step 1: Remove duplicates from rawData based on a composite key
const uniqueRawDataMap = new Map(); // key → row
rawData.forEach(row => {
// Normalize and trim relevant fields for key generation
const recordType = row['Record Type']?.trim().toUpperCase();
const taskName = row['Task Name']?.trim().toUpperCase();
const startDate = row['Start Date']?.trim();
const endDate = row['End Date']?.trim();

// Prefer TaskID if present and not empty, as it should be the most unique identifier from source
let key = row.TaskID?.trim();

// Fallback to a composite key if TaskID is absent or empty
if (!key) {
// Use a composite key to ensure uniqueness even without a formal TaskID
key = [recordType, taskName, startDate, endDate].join('|');
} else {
// If TaskID is present, ensure it's also unique.
// For cases where TaskID might be reused across different record types,
// we can prepend recordType to TaskID to make the key unique across types.
// This prevents a Task '100' and an Issue '100' from clashing.
key = `${recordType}-${key}`; 
}

// Only add if the key doesn't already exist
// This keeps the *first* encounter of that unique key, effectively de-duplicating
if (!uniqueRawDataMap.has(key)) {
uniqueRawDataMap.set(key, row);
} else {
console.warn(`Duplicate detected and skipped: Key=${key}, Row=`, row);
}
});
const uniqueRawData = Array.from(uniqueRawDataMap.values());
console.log('De-duplicated raw data, unique entries:', uniqueRawData.length);


const tasks = uniqueRawData.filter(r => r['Record Type'] === 'Task');
const issues = uniqueRawData.filter(r => r['Record Type'] === 'Issue');
const vehicles = uniqueRawData.filter(r => r['Record Type'] === 'Vehicle');

// Create a map from ALL unique raw data for parent lookup, not just tasks.
const rawDataMap = new Map(uniqueRawData.map(t => [t.TaskID, t]));

const processedTasks = tasks.map(t => {
  const progressDetail = t.DETAILS ?? t['Progress Detail'];
  const { DETAILS, ...rest } = t;
  return {
    ...rest,
    'Progress Detail': progressDetail,
    Type: 'Task',
    _isCollapsed: false
  };
});

const processedIssues = issues.map(issue => {
// Use rawDataMap for parent lookup to ensure parent is found regardless of its Type
const parentItem = rawDataMap.get(issue.ParentID);
const parentLevel = parentItem ? parseInt(parentItem.Level || 1) : 1;
let progress = 10;
if (issue['Status'] === 'Resolved') progress = 100;
if (issue['Status'] === 'In Progress') progress = 50;

  const progressDetail = issue.DETAILS ?? issue['Progress Detail'];
  const { DETAILS, ...rest } = issue;

  return {
    ...rest,
    'Progress Detail': progressDetail,
    // 'Task Name': `[Issue] ${issue['Task Name']}`, // Removed prefix
    'Level': parentLevel + 1,
    'Baseline Start Date': issue['Start Date'],
    'Baseline End Date': issue['End Date'],
    'Progress (%)': progress,
    'Type': 'Issue',
    _isCollapsed: false
  };
});

const processedVehicles = vehicles.map(vehicle => {
// Use rawDataMap for parent lookup
const parentItem = rawDataMap.get(vehicle.ParentID); // ParentID for vehicles might be empty in default data
const parentLevel = parentItem ? parseInt(parentItem.Level || 1) : 0; // Default to 0 for top-level vehicles if no parent

// Preserve TaskID if provided, otherwise generate from name
const taskId = (vehicle.TaskID && vehicle.TaskID.trim()) ? vehicle.TaskID.trim() : `V-${vehicle['Task Name'].replace(/ /g, '-')}`;

// Preserve progress detail if provided
const progressDetailRaw = vehicle.DETAILS ?? vehicle['Progress Detail'];
const progressDetail = (progressDetailRaw && progressDetailRaw.trim())
    ? progressDetailRaw.trim()
    : `${vehicle.Phase ?? ''}`.trim();

const { DETAILS, ...rest } = vehicle;

return {
...rest,
'TaskID': taskId,
// 'Task Name': `[Milestone] ${vehicle['Task Name']} - ${vehicle.Phase}`, // Removed prefix
'ParentID': vehicle.ParentID, // Keep original ParentID from CSV
'Level': parentLevel + 1,
'Owner': parentItem ? parentItem.Owner : 'N/A', // Inherit owner from parent if exists
'Start Date': vehicle['End Date'],
//    'End Date': vehicle['End Date'], // Ensure End Date is carried over
'Progress (%)': '', // Milestones don't have progress
'Status': '', // Milestones typically don't have status
'Is Milestone?': 'Yes',
'Priority': 'High',
'Progress Detail': progressDetail,
'Type': 'Vehicle Milestone',
_isCollapsed: false
};
});

  const result = buildHierarchy([...processedTasks, ...processedIssues, ...processedVehicles]);
  calculateParentProgress(result);
  return result;
}

// --- Modal and Item Management Functions ---
function showAddItemModal(taskId = null) {
editingTaskId = taskId;
addItemForm.reset();
updateStatusOptions(itemTypeSelect.value);
toggleModalFields(); // Set initial field visibility
const parentSelect = document.getElementById('itemParent');
const predecessorSelect = document.getElementById('predecessorSelect');
const successorSelect = document.getElementById('successorSelect');
parentSelect.innerHTML = '<option value="">-- No Parent (Root) --</option>';

// Populate with tasks that can be parents
predecessorSelect.innerHTML = "";
successorSelect.innerHTML = "";
window.allTaskData
.filter(item => item.Type === 'Task') // Only tasks can be parents in the modal
.forEach(task => {
const option = document.createElement('option');
option.value = task.TaskID;
option.textContent = `${task['Task Name']} (${task.TaskID})`;
parentSelect.appendChild(option);
});
window.allTaskData.forEach(task => {
const o1 = document.createElement("option");
o1.value = task.TaskID;
o1.textContent = `${task["Task Name"]} (${task.TaskID})`;
predecessorSelect.appendChild(o1.cloneNode(true));
const o2 = document.createElement("option");
o2.value = task.TaskID;
o2.textContent = `${task["Task Name"]} (${task.TaskID})`;
successorSelect.appendChild(o2);
});

setupModalFilters();

const modalTitle = addItemModal.querySelector('.modal-header h2');

if (taskId) {
const task = window.allTaskData.find(t => t.TaskID === taskId);
if (task) {
modalTitle.textContent = 'Edit Item';
itemTypeSelect.value = task['Record Type'] || task.Type || 'Task';
updateStatusOptions(itemTypeSelect.value, task.Status || '');
document.getElementById('itemName').value = task['Task Name'] || '';
parentSelect.value = task.ParentID || '';
document.getElementById('itemOwner').value = task.Owner || '';
document.getElementById('itemSubOwner').value = task['Sub Owner'] || '';
document.getElementById('itemPriority').value = task.Priority || 'Medium';
document.getElementById('itemStatus').value = task.Status || document.getElementById('itemStatus').value;
itemSituationSelect.value = task.Situation || 'Sunny';
document.getElementById('itemStartDate').value = task['Start Date'] || '';
document.getElementById('itemEndDate').value = task['End Date'] || '';
document.getElementById('itemIssueType').value = task['Issue Type'] || '';
document.getElementById('itemPhase').value = task.Phase || '';
Array.from(predecessorSelect.options).forEach(o => { if (Array.isArray(task.Predecessors) && task.Predecessors.includes(o.value)) o.selected = true; });
Array.from(successorSelect.options).forEach(o => { if (Array.isArray(task.Successors) && task.Successors.includes(o.value)) o.selected = true; });
toggleModalFields();
if (itemCommentsSection) {
  itemCommentsSection.classList.remove('hidden');
  populateItemComments(taskId);
}
}
} else {
modalTitle.textContent = 'Add New Item';
updateStatusOptions(itemTypeSelect.value);
if (itemCommentsSection) {
  itemCommentsSection.classList.add('hidden');
  itemCommentTaskId = null;
}
}

addItemModal.style.display = 'flex';
// Force reflow if needed
void addItemModal.offsetWidth;
addItemModal.classList.add('show');
}

function toggleModalFields() {
const type = itemTypeSelect.value;
document.getElementById('issueTypeField').classList.toggle('hidden', type !== 'Issue');
document.getElementById('phaseField').classList.toggle('hidden', type !== 'Vehicle');

// Disable/enable Situation field based on item type
if (type === 'Vehicle') {
itemSituationSelect.disabled = true;
itemSituationSelect.value = 'Sunny'; // Set default value or clear if preferred
itemSituationField.style.opacity = '0.5'; // Visually indicate it's disabled
itemSituationField.style.pointerEvents = 'none'; // Prevent interaction
} else {
itemSituationSelect.disabled = false;
itemSituationField.style.opacity = '1';
itemSituationField.style.pointerEvents = 'auto';
}
}

function setupModalFilters() {
const configs = [
{ input: 'parentFilter', select: 'itemParent' },
{ input: 'predecessorFilter', select: 'predecessorSelect' },
{ input: 'successorFilter', select: 'successorSelect' }
];
configs.forEach(cfg => {
const inputEl = document.getElementById(cfg.input);
const selectEl = document.getElementById(cfg.select);
if (!inputEl || !selectEl) return;
inputEl.value = '';
inputEl.oninput = () => {
const f = inputEl.value.toLowerCase();
Array.from(selectEl.options).forEach(opt => {
opt.style.display = opt.textContent.toLowerCase().includes(f) ? '' : 'none';
});
};
});
}

function hideAddItemModal() {
  addItemModal.classList.remove('show');
  addItemModal.style.display = 'none';
  editingTaskId = null;
  const modalTitle = addItemModal.querySelector('.modal-header h2');
  if (modalTitle) modalTitle.textContent = 'Add New Item';
}

function populateItemComments(taskId) {
  itemCommentTaskId = taskId;
  itemEditingCommentIndex = null;
  if (!itemCommentsSection) return;
  const task = window.allTaskData.find(t => t.TaskID === taskId);
  const comments = task && Array.isArray(task.Comments) ? task.Comments : [];
  if (comments.length > 0) {
    itemCommentsList.innerHTML = comments.map((c, idx) => {
      const textWithMentions = c.text.replace(/@(\w+)/g, '<span class="mention">@$1</span>');
      return `<div class="comment-entry ${c.acknowledged ? 'acknowledged' : ''}" data-comment-index="${idx}" style="margin-bottom:8px; position:relative;">
        <strong>${c.author}</strong> (${new Date(c.timestamp).toLocaleString()}):<br>${textWithMentions}
        <span class="material-icons edit-comment" data-comment-index="${idx}">edit</span>
        <span class="material-icons ack-comment" data-comment-index="${idx}">check_circle</span>
        <span class="material-icons delete-comment" data-comment-index="${idx}">delete</span>
      </div>`;
    }).join('');
  } else {
    itemCommentsList.innerHTML = '<p>No comments yet.</p>';
  }
  itemCommentText.value = '';
  itemCommentAuthor.value = '';
  itemAddCommentBtn.textContent = 'Add Comment';
  itemCancelEditCommentBtn.classList.add('hidden');
}

let currentCommentTaskId = null;
let editingCommentIndex = null;
let itemCommentTaskId = null;
let itemEditingCommentIndex = null;

function showCommentsModal(taskId) {
  currentCommentTaskId = taskId;
  editingCommentIndex = null;
  const task = window.allTaskData.find(t => t.TaskID === taskId);
  const comments = task && Array.isArray(task.Comments) ? task.Comments : [];
  if (comments.length > 0) {
    commentsList.innerHTML = comments.map((c, idx) => {
      const textWithMentions = c.text.replace(/@(\w+)/g, '<span class="mention">@$1</span>');
      return `
<div class="comment-entry ${c.acknowledged ? 'acknowledged' : ''}" data-comment-index="${idx}" style="margin-bottom:8px; position:relative;">
<strong>${c.author}</strong> (${new Date(c.timestamp).toLocaleString()}):<br>${textWithMentions}
<span class="material-icons edit-comment" data-comment-index="${idx}">edit</span>
<span class="material-icons ack-comment" data-comment-index="${idx}">check_circle</span>
<span class="material-icons delete-comment" data-comment-index="${idx}">delete</span>
</div>`;
    }).join('');
  } else {
    commentsList.innerHTML = '<p>No comments yet.</p>';
  }
  newCommentText.value = '';
  newCommentAuthor.value = '';
  addCommentBtn.textContent = 'Add Comment';
  cancelEditCommentBtn.classList.add('hidden');
  commentsModal.classList.add('show');
}

function hideCommentsModal() {
  commentsModal.classList.remove('show');
  editingCommentIndex = null;
  addCommentBtn.textContent = 'Add Comment';
  cancelEditCommentBtn.classList.add('hidden');
}

function showProjectInfoModal() {
projectNameInput.value = projectNameDisplay.textContent;
projectDescriptionInput.value = projectDescriptionDisplay.textContent;
projectInfoModal.style.display = 'flex';
void projectInfoModal.offsetWidth;
projectInfoModal.classList.add('show');
}

function hideProjectInfoModal() {
projectInfoModal.classList.remove('show');
projectInfoModal.style.display = 'none';
}

async function loadProjectInfo() {
try {
const info = await get('projectInfo');
if (info) {
projectNameDisplay.textContent = info.name || 'Project Management Dashboard';
projectDescriptionDisplay.textContent = info.description || '';
}
} catch (e) {
console.error('Failed to load project info', e);
}
}

async function saveProjectInfo() {
const info = {
name: projectNameInput.value.trim() || 'Project Management Dashboard',
description: projectDescriptionInput.value.trim()
};
projectNameDisplay.textContent = info.name;
projectDescriptionDisplay.textContent = info.description;
await set('projectInfo', info);
hideProjectInfoModal();
showToast('Project info saved');
}

function showConfirmModal(message) {
return new Promise(resolve => {
const cleanup = result => {
confirmYesBtn.removeEventListener('click', onYes);
confirmNoBtn.removeEventListener('click', onNo);
confirmCloseBtn.removeEventListener('click', onNo);
confirmModal.removeEventListener('click', onOverlay);
confirmModal.classList.remove('show');
confirmModal.style.display = 'none'; // Ensure it's truly hidden
resolve(result);
};
const onYes = () => cleanup(true);
const onNo = () => cleanup(false);
const onOverlay = e => { if (e.target === confirmModal) onNo(); };

confirmMessage.textContent = message;
confirmYesBtn.addEventListener('click', onYes);
confirmNoBtn.addEventListener('click', onNo);
confirmCloseBtn.addEventListener('click', onNo);
confirmModal.addEventListener('click', onOverlay);
confirmModal.style.display = 'flex';
void confirmModal.offsetWidth; // Trigger reflow
confirmModal.classList.add('show');
});
}

// New: Custom Alert/Notification Modal
function showCustomAlert(message, title = "Notification") {
return new Promise(resolve => {
const alertModal = document.getElementById('customAlertDialog');
const alertMessage = document.getElementById('customAlertMessage');
const alertTitle = document.getElementById('customAlertTitle');
const alertCloseBtn = document.getElementById('customAlertCloseBtn');
const alertOkBtn = document.getElementById('customAlertOkBtn');

alertTitle.textContent = title;
    alertMessage.innerHTML = message;

const cleanup = () => {
alertCloseBtn.removeEventListener('click', onOk);
alertOkBtn.removeEventListener('click', onOk);
alertModal.removeEventListener('click', onOverlay);
alertModal.classList.remove('show');
alertModal.style.display = 'none'; // Ensure it's truly hidden
resolve();
};

const onOk = () => cleanup();
const onOverlay = e => { if (e.target === alertModal) cleanup(); };

alertCloseBtn.addEventListener('click', onOk);
alertOkBtn.addEventListener('click', onOk);
alertModal.addEventListener('click', onOverlay);

alertModal.style.display = 'flex';
void alertModal.offsetWidth; // Trigger reflow
alertModal.classList.add('show');
});
}

function showToast(message, duration = 3000) {
const container = document.getElementById('toastContainer');
if (!container) return;
const toast = document.createElement('div');
toast.className = 'toast';
toast.textContent = message;
container.appendChild(toast);
requestAnimationFrame(() => toast.classList.add('show'));
setTimeout(() => {
toast.classList.remove('show');
toast.addEventListener('transitionend', () => toast.remove(), { once: true });
}, duration);
}

function showGanttModal() {
    const visibleData = getVisibleTasks(window.allTaskData);
    ganttModal.style.display = 'flex';
    void ganttModal.offsetWidth;
    charts.ganttModal = createGanttChart('ganttChartModal', visibleData, 'Task Name', 'Start Date', 'End Date');
    if (charts.ganttModal) {
        charts.ganttModal.change_view_mode(ganttViewModes[currentGanttView]);
        updateGanttRowHeight(charts.ganttModal);
        addBaselineBars(charts.ganttModal);
        addMilestoneMarkers(charts.ganttModal);
        attachGanttDoubleClick(charts.ganttModal);
        attachGanttClick(charts.ganttModal);
        attachGanttLabelContextMenu(charts.ganttModal);
        positionGanttLabelsLeft(charts.ganttModal);
    }
    if (ganttViewModeModalSelect) {
        ganttViewModeModalSelect.value = ganttViewModes[currentGanttView];
    }
    ganttModal.classList.add('show');
}

function hideGanttModal() {
    if (charts.ganttModal) {
        const container = document.getElementById('ganttChartModal');
        if (container) container.innerHTML = '';
        charts.ganttModal = null;
    }
    ganttModal.classList.remove('show');
    ganttModal.style.display = 'none';
}

let tableCardParent = null;
let tableCardNextSibling = null;
let kpiCardParent = null;
let kpiCardNextSibling = null;
let kanbanCardParent = null;
let kanbanCardNextSibling = null;

function showTableModal() {
tableCardParent = tableCard.parentNode;
tableCardNextSibling = tableCard.nextSibling;
tableModalContainer.appendChild(tableCard);
tableModal.style.display = 'flex';
void tableModal.offsetWidth;
tableModal.classList.add('show');
}

function hideTableModal() {
tableModal.classList.remove('show');
tableModal.style.display = 'none';
if (tableCardParent) {
tableCardParent.insertBefore(tableCard, tableCardNextSibling);
tableCardParent = null;
}
}

function showKpiModal() {
kpiCardParent = kpiCard.parentNode;
kpiCardNextSibling = kpiCard.nextSibling;
kpiModalContainer.appendChild(kpiCard);
kpiModal.style.display = 'flex';
void kpiModal.offsetWidth;
kpiModal.classList.add('show');
}

function hideKpiModal() {
kpiModal.classList.remove('show');
kpiModal.style.display = 'none';
if (kpiCardParent) {
kpiCardParent.insertBefore(kpiCard, kpiCardNextSibling);
kpiCardParent = null;
}
}

function showKpiDetails(type, title) {
 const tasks = window.allTaskData.filter(d => d.Type === 'Task');
 const issues = window.allTaskData.filter(d => d.Type === 'Issue');
 const today = new Date();
 today.setHours(0,0,0,0);

 const buildTable = (rows, headers) => {
 let html = '<div class="table-container"><table class="kpi-detail-table"><thead><tr>';
 headers.forEach(h => { html += `<th>${h}</th>`; });
 html += '</tr></thead><tbody>';
 rows.forEach(r => { html += '<tr>' + r.map(v => `<td>${v}</td>`).join('') + '</tr>'; });
 html += '</tbody></table></div>';
 return html;
 };

 let html = '';

  switch(type) {
  case 'overall-progress': {
    const progress = tasks.length > 0 ?
      Math.round(tasks.reduce((s,t) => s + parseInt(t['Progress (%)'] || 0), 0) / tasks.length)
      : 0;
    html += `<p>Average progress of all tasks is ${progress}%.</p>`;
    if (tasks.length > 0) {
      const rows = tasks.map(t => [t['Task Name'], `${t['Progress (%)'] || 0}%`]);
      html += buildTable(rows, ['Task', 'Progress']);
    }
    break;
  }
  case 'task-status': {
    const counts = tasks.reduce((acc,t)=>{const s=t.Status||'Unknown';acc[s]=(acc[s]||0)+1;return acc;},{});
    Object.entries(counts).forEach(([k,v])=>{ html += `<p>${k}: ${v}</p>`; });
    if (tasks.length > 0) {
      const rows = tasks.map(t => [t['Task Name'], t.Status || 'Unknown']);
      html += buildTable(rows, ['Task', 'Status']);
    }
    break;
  }
  case 'at-risk': {
    const overdue = tasks.filter(t=>{const end=parseDateLocal(t['End Date']);return end<today && t.Status!=='Done';});
    const highIssues = issues.filter(i=>i.Priority==='High' && i.Status!=='Resolved');
    html += `<p>Overdue tasks: ${overdue.length}</p>`;
    if (overdue.length > 0) {
        const rows = overdue.map(t => {
        const d = parseDateLocal(t['End Date']);
        return [t['Task Name'], d.toLocaleDateString('en-GB')];
      });
      html += buildTable(rows, ['Task', 'Due Date']);
    }
    html += `<p>High priority issues: ${highIssues.length}</p>`;
    if (highIssues.length > 0) {
      const rows = highIssues.map(i => [i['Task Name'] || i['Issue Name'] || i.Name, i.Status]);
      html += buildTable(rows, ['Issue', 'Status']);
    }
    break;
  }
  case 'upcoming-milestone': {
    const upcoming = window.allTaskData.filter(item => {
      const isMilestone = item['Is Milestone?']?.toLowerCase() === 'yes';
      const end = parseDateLocal(item['End Date']);
      return isMilestone && !isNaN(end) && end >= today;
    }).sort((a,b)=> parseDateLocal(a['End Date']) - parseDateLocal(b['End Date']));
    if (upcoming.length > 0) {
      const rows = upcoming.map(ms => {
        const msDate = parseDateLocal(ms['End Date']);
        const days = Math.ceil((msDate - today)/(1000*60*60*24));
        const name = ms['Task Name'].replace('[Milestone] ','');
        return [name, `${days} day(s) (${msDate.toLocaleDateString('en-GB')})`];
      });
      html += buildTable(rows, ['Milestone', 'Due In']);
    } else {
      html += '<p>No upcoming milestones.</p>';
    }
    break;
  }
  case 'tasks-by-priority': {
    const counts = tasks.reduce((acc,t)=>{const p=t.Priority||'Unknown';acc[p]=(acc[p]||0)+1;return acc;},{});
    Object.entries(counts).forEach(([k,v])=>{ html += `<p>${k}: ${v}</p>`; });
    if (tasks.length > 0) {
      const rows = tasks.map(t => [t['Task Name'], t.Priority || 'Unknown']);
      html += buildTable(rows, ['Task', 'Priority']);
    }
    break;
  }
  case 'total-issues': {
    const open = issues.filter(i=>i.Status==='Open' || i.Status==='At Risk').length;
    const resolved = issues.filter(i=>i.Status==='Resolved').length;
    html += `<p>Total issues: ${issues.length}</p>`;
    html += `<p>Open: ${open}</p>`;
    html += `<p>Resolved: ${resolved}</p>`;
    if (issues.length > 0) {
      const rows = issues.map(i => [i['Task Name'] || i['Issue Name'] || i.Name, i.Status]);
      html += buildTable(rows, ['Issue', 'Status']);
    }
    break;
  }
  default:
    html += '<p>No details available.</p>';
  }

  showCustomAlert(html, title || 'KPI Details');
}

function showKanbanModal() {
kanbanCardParent = kanbanContainer.parentNode;
kanbanCardNextSibling = kanbanContainer.nextSibling;
kanbanModalContainer.appendChild(kanbanContainer);
kanbanModal.style.display = 'flex';
void kanbanModal.offsetWidth;
kanbanModal.classList.add('show');
}

function hideKanbanModal() {
kanbanModal.classList.remove('show');
kanbanModal.style.display = 'none';
if (kanbanCardParent) {
kanbanCardParent.insertBefore(kanbanContainer, kanbanCardNextSibling);
kanbanCardParent = null;
}
}

function toggleCardVisibility(card, button, hideEntireCard = false) {
    const className = hideEntireCard ? 'hidden' : 'collapsed';
    const collapsed = card.classList.toggle(className);
    const icon = button.querySelector('span');
    if (icon) {
        if (hideEntireCard) {
            icon.textContent = 'close';
        } else {
            icon.textContent = collapsed ? 'expand_more' : 'expand_less';
        }
    }
    button.setAttribute('aria-expanded', String(!collapsed));
}

async function saveItemFromForm() {
const formData = new FormData(addItemForm);
const item = Object.fromEntries(formData.entries());
item.Predecessors = Array.from(document.getElementById("predecessorSelect").selectedOptions).map(o => o.value);
item.Successors = Array.from(document.getElementById("successorSelect").selectedOptions).map(o => o.value);

if (editingTaskId) {
const existing = window.allTaskData.find(t => t.TaskID === editingTaskId);
if (existing) {
const oldStart = existing['Start Date'];
const oldEnd = existing['End Date'];
Object.assign(existing, item);
switch (item['Record Type']) {
case 'Task':
existing.Type = 'Task';
break;
case 'Issue':
existing.Type = 'Issue';
break;
case 'Vehicle':
existing.Type = 'Vehicle Milestone';
break;
}
adjustDependentTaskDates(existing, oldStart, oldEnd);
await saveProjectData();
window.applyFilters();
return true;
}
return false;
}

// Generate a TaskID for the new item. This is crucial for internal tracking.
// Using a slice of record type and timestamp to create a unique ID.
item.TaskID = `${item['Record Type'].slice(0,2).toUpperCase()}-${Date.now()}`;

// Construct a composite key for duplicate checking based on key attributes
const compositeKey = [
item['Record Type']?.trim().toUpperCase(),
item['Task Name']?.trim().toUpperCase(),
item['Start Date']?.trim(),
item['End Date']?.trim()
].join('|');

// Check for duplicates using the composite key
// Also check for direct TaskID clashes, although with Date.now() generated IDs, this is less likely
if (window.allTaskData.some(t =>
// Check if an existing item has the same generated TaskID (unlikely but good for safety)
(t.TaskID === item.TaskID) || 
// Check if an existing item matches the composite key (logical duplicate)
([t['Record Type']?.trim().toUpperCase(), t['Task Name']?.trim().toUpperCase(), t['Start Date']?.trim(), t['End Date']?.trim()].join('|') === compositeKey)
)) {
await showCustomAlert('A record with the same Type, Name, Start Date, and End Date already exists. Please adjust or choose another item.');
return false;
}

const parentId = item.ParentID;
const parentTask = window.allTaskData.find(t => t.TaskID === parentId);

// Assign remaining properties
item['Project Name'] = parentTask ? parentTask['Project Name'] : (document.getElementById('projectFilter').value || 'New Project');
item.Level = parentTask ? (parseInt(parentTask.Level || 1) + 1) : 1;
item['Baseline Start Date'] = item['Start Date'];
item['Baseline End Date'] = item['End Date'];

// Assign specific properties based on Record Type
switch (item['Record Type']) {
case 'Task':
item['Progress (%)'] = item.Status === 'Done' ? 100 : 0;
item['Is Milestone?'] = 'No';
item.Type = 'Task';
break;
case 'Issue':
item.Type = 'Issue';
break;
case 'Vehicle':
item['Is Milestone?'] = 'Yes';
item['End Date'] = item['Start Date']; // Milestone is a single point in time
item.Situation = 'Sunny'; // Force Sunny for Vehicle Milestones
item.Type = 'Vehicle Milestone';
break;
}

window.allTaskData.push(item);
await saveProjectData();
window.applyFilters();
return true;
}

// Helper to save form data and optionally close the modal
async function handleModalSave(closeAfter = false) {
console.log('handleModalSave called');
try {
const saved = await saveItemFromForm();
if (saved) {
console.log('Item saved successfully. Applying filters...');
if (typeof window.applyFilters === 'function') {
window.applyFilters();
}
showToast('Item saved');
if (closeAfter) {
console.log('Closing modal...');
hideAddItemModal();
}
} else {
console.log('Item not saved (e.g., duplicate detected).');
}
} catch (err) {
console.error('Failed to save form data:', err);
await showCustomAlert(`Failed to save item: ${err.message || 'Unknown error.'}`, 'Error');
}
}

async function deleteItem(taskId) {
// Use the custom confirmation modal instead of browser confirm().
if (!await showConfirmModal(`Are you sure you want to delete item ${taskId} and all its children?`)) {
return;
}

let idsToDelete = new Set([taskId]);
let childrenFound = true;

// Recursively find all children to delete
while(childrenFound) {
childrenFound = false;
const children = window.allTaskData.filter(task => idsToDelete.has(task.ParentID));
children.forEach(child => {
if (!idsToDelete.has(child.TaskID)) {
idsToDelete.add(child.TaskID);
childrenFound = true;
}
});
}

window.allTaskData = window.allTaskData.filter(task => !idsToDelete.has(task.TaskID));

await saveProjectData();
window.applyFilters();
}

async function deleteItems(taskIds) {
if (!taskIds || taskIds.length === 0) return;
if (!await showConfirmModal(`Are you sure you want to delete ${taskIds.length} selected item(s) and all their children?`)) {
return;
}

const idsToDelete = new Set(taskIds);
let expanded = true;

while (expanded) {
expanded = false;
window.allTaskData.forEach(task => {
if (idsToDelete.has(task.ParentID) && !idsToDelete.has(task.TaskID)) {
idsToDelete.add(task.TaskID);
expanded = true;
}
});
}

window.allTaskData = window.allTaskData.filter(task => !idsToDelete.has(task.TaskID));

await saveProjectData();
window.applyFilters();
}

async function duplicateItems(taskIds) {
if (!taskIds || taskIds.length === 0) return;
const newItems = [];
taskIds.forEach(id => {
const original = window.allTaskData.find(t => t.TaskID === id);
if (original) {
const copy = JSON.parse(JSON.stringify(original));
copy.TaskID = `${(original.Type || '').slice(0,2).toUpperCase()}-${Date.now()}-${Math.floor(Math.random()*1000)}`;
if (copy['Task Name']) {
copy['Task Name'] = `${copy['Task Name']} (Copy)`;
}
newItems.push(copy);
}
});
if (newItems.length > 0) {
window.allTaskData.push(...newItems);
await saveProjectData();
window.applyFilters();
showToast(`${newItems.length} item(s) duplicated`);
}
}

// Function to remove duplicates from the current data
async function removeDuplicatesFromCurrentData(showConfirm = true) {
// Use the custom confirmation modal by default, but allow skipping when desired
if (!showConfirm || await showConfirmModal('Are you sure you want to remove all duplicate rows from the current data? This action cannot be undone.')) {
const uniqueDataMap = new Map();
const initialLength = window.allTaskData.length;

window.allTaskData.forEach(row => {
const recordType = row['Record Type']?.trim().toUpperCase();
const taskName = row['Task Name']?.trim().toUpperCase();
const startDate = row['Start Date']?.trim();
const endDate = row['End Date']?.trim();

let key = row.TaskID?.trim();
if (!key) {
key = [recordType, taskName, startDate, endDate].join('|');
} else {
key = `${recordType}-${key}`;
}

if (!uniqueDataMap.has(key)) {
uniqueDataMap.set(key, row);
} else {
console.warn(`Duplicate detected and skipped: Key=${key}, Row=`, row);
}
});

const deDuplicatedData = Array.from(uniqueDataMap.values());
if (deDuplicatedData.length < initialLength) {
console.log(`Removed ${initialLength - deDuplicatedData.length} duplicate rows.`);
window.allTaskData = deDuplicatedData;
if (showConfirm) {
await saveProjectData();
initializeUI(window.allTaskData);
showToast('Duplicates removed successfully!');
}
return true;
} else {
if (showConfirm) {
showToast('No duplicates found in the current data.');
}
return false;
}
}
return false;
}


// Function to initialize column visibility controls
async function initializeColumnVisibilityControls() {
await loadColumnOrderAndVisibilityState(); // Ensure columnOrder and columnVisibility are loaded

columnDropdown.innerHTML = ''; // Clear existing options

// Iterate using the loaded/default column order
window.columnOrder.forEach(columnName => {
const label = document.createElement('label');
const checkbox = document.createElement('input');
checkbox.type = 'checkbox';
checkbox.value = columnName;
checkbox.checked = window.columnVisibility[columnName] !== false; // Default to true if not explicitly false

label.appendChild(checkbox);
label.appendChild(document.createTextNode(COLUMN_DISPLAY_NAMES[columnName] || columnName)); // Use display name
columnDropdown.appendChild(label);

checkbox.addEventListener('change', async (event) => {
window.columnVisibility[columnName] = event.target.checked;
await saveColumnOrderAndVisibilityState();
applyColumnVisibilityToTable(); // Re-apply visibility based on current order
});
});

// Remove existing handlers to prevent duplicate toggles
if (toggleColumnsClickHandler) {
    toggleColumnsBtn.removeEventListener('click', toggleColumnsClickHandler);
}
if (columnDropdownDocumentClickHandler) {
    document.removeEventListener('click', columnDropdownDocumentClickHandler);
}

// Define and attach fresh handlers
toggleColumnsClickHandler = (event) => {
    event.stopPropagation(); // Prevent document click from closing it immediately
    columnDropdown.classList.toggle('show');
};
columnDropdownDocumentClickHandler = (event) => {
    if (!columnDropdown.contains(event.target) && event.target !== toggleColumnsBtn) {
        columnDropdown.classList.remove('show');
    }
};

toggleColumnsBtn.addEventListener('click', toggleColumnsClickHandler);
document.addEventListener('click', columnDropdownDocumentClickHandler);
}

// Function to update column visibility and save
async function updateColumnVisibilityAndSave(columnName, isVisible) {
window.columnVisibility[columnName] = isVisible;
await saveColumnOrderAndVisibilityState();
applyColumnVisibilityToTable(); // Re-apply visibility to the table
}

// --- Drag and Drop for table headers ---
let draggedColumn = null;

taskMatrixTableHeadRow.addEventListener('dragstart', (e) => {
const targetTh = e.target.closest('th');
if (targetTh) {
const columnName = targetTh.dataset.fieldName;
// Prevent dragging 'TaskID' and 'Actions' (or any other fixed columns)
if (columnName === 'TaskID' || columnName === 'Actions') { 
e.preventDefault();
return;
}
draggedColumn = targetTh;
e.dataTransfer.effectAllowed = 'move';
setTimeout(() => targetTh.classList.add('dragging'), 0); // Add class after drag starts
}
});

taskMatrixTableHeadRow.addEventListener('dragover', (e) => {
e.preventDefault(); // Allow drop
const targetTh = e.target.closest('th');
if (targetTh && draggedColumn && targetTh !== draggedColumn) {
const targetColumnName = targetTh.dataset.fieldName;
// Prevent dropping over 'TaskID', 'Actions' or select column
if (!targetColumnName || targetColumnName === 'TaskID' || targetColumnName === 'Actions') {
return;
}

const headers = Array.from(taskMatrixTableHeadRow.children);
headers.forEach(h => h.classList.remove('drag-over-left', 'drag-over-right'));

const targetRect = targetTh.getBoundingClientRect();
const dropPosition = (e.clientX - targetRect.left) / targetRect.width;

if (dropPosition < 0.5) {
targetTh.classList.add('drag-over-left');
} else {
targetTh.classList.add('drag-over-right');
}
}
});

taskMatrixTableHeadRow.addEventListener('dragleave', (e) => {
const targetTh = e.target.closest('th');
if (targetTh) {
targetTh.classList.remove('drag-over-left', 'drag-over-right');
}
});

taskMatrixTableHeadRow.addEventListener('drop', async (e) => {
e.preventDefault();
const targetTh = e.target.closest('th');
if (targetTh && draggedColumn && targetTh !== draggedColumn) {
const draggedColumnName = draggedColumn.dataset.fieldName;
const targetColumnName = targetTh.dataset.fieldName;

// Prevent dropping on fixed or select column
if (!targetColumnName || targetColumnName === 'TaskID' || targetColumnName === 'Actions') {
return;
}

const draggedIndex = window.columnOrder.indexOf(draggedColumnName);
let targetIndex = window.columnOrder.indexOf(targetColumnName);

if (draggedIndex === -1 || targetIndex === -1) {
console.error('Dragged or target column not found in columnOrder.');
return;
}

// Determine insertion point based on drop position within the targetTH
const targetRect = targetTh.getBoundingClientRect();
const dropPosition = (e.clientX - targetRect.left) / targetRect.width;

// If drop is on the right half of the target, insert after target, otherwise before
if (dropPosition > 0.5 && targetIndex < window.columnOrder.length - 1) { // Ensure not trying to insert beyond 'Actions' if it's fixed last
targetIndex++; // Insert after the target column
}

// Remove the dragged column from its original position
const [removedColumn] = window.columnOrder.splice(draggedIndex, 1);

// Insert the removed column at the new position
// Adjust targetIndex if draggedColumn was removed from before it
if (draggedIndex < targetIndex) {
targetIndex--; // Adjust target index because array length decreased
}
window.columnOrder.splice(targetIndex, 0, removedColumn);

// Persist the new order
await saveColumnOrderAndVisibilityState();

// Re-render the dashboard to reflect the new column order
updateDashboard(window.allTaskData);
}
});

taskMatrixTableHeadRow.addEventListener('dragend', (e) => {
draggedColumn?.classList.remove('dragging');
const headers = taskMatrixTableHeadRow.querySelectorAll('th');
headers.forEach(h => h.classList.remove('drag-over-left', 'drag-over-right'));
draggedColumn = null;
});

// --- Event Handlers and Initialization ---
drawerToggle.addEventListener('click', () => {
  navigationDrawer.classList.toggle('collapsed');
  mainContainer.classList.toggle('collapsed');
  drawerToggle.classList.toggle('collapsed');
  const activeSummary = navigationDrawer.querySelector('details.menu[open] > summary');
  if (activeSummary) updateDrawerStateCursor(activeSummary);
});

themeToggle.addEventListener('click', () => {
const isDark = document.body.classList.toggle('dark-mode');
localStorage.setItem('theme', isDark ? 'dark' : 'light');
themeToggle.innerHTML = `<span class="material-icons">${isDark ? 'light_mode' : 'dark_mode'}</span>`;
});

taskFileInput.addEventListener('change', async (e) => {
const file = e.target.files[0];
if (!file) return;
taskFileNameSpan.textContent = file.name;
try {
console.log('Clearing existing data before new upload...');
// Disable upload button to prevent double-click race condition
taskFileInput.disabled = true;

// Clear existing data from memory and IndexedDB before loading new data
window.allTaskData = []; 
await del('projectData'); 
console.log('Existing data cleared.');

const results = await new Promise((resolve, reject) => {
Papa.parse(file, { header: true, skipEmptyLines: true, complete: resolve, error: reject });
});
window.allTaskData = processRawData(results.data);
// Ensure any duplicates present in the file are removed automatically
await removeDuplicatesFromCurrentData(false);
await saveProjectData();
console.log('New data loaded and saved. AllTaskData length:', window.allTaskData.length);

initializeUI(window.allTaskData);

} catch (error) {
console.error(`Error parsing file:`, error);
await showCustomAlert(`Error parsing file: ${error.message || 'Unknown error.'}`, 'File Parsing Error');
taskFileNameSpan.textContent = 'Load failed';
} finally {
// Always re-enable the upload button
taskFileInput.disabled = false;
}
});

taskMatrixTableBody.addEventListener('click', (event) => {
const deleteBtn = event.target.closest('.delete-btn');
if (deleteBtn) {
deleteItem(deleteBtn.dataset.taskId);
return;
}

const editable = event.target.closest('.editable-cell');
if (editable) {
openQuillEditor(editable);
return;
}

const commentBtn = event.target.closest('.comment-icon');
if (commentBtn) {
showCommentsModal(commentBtn.dataset.taskId);
return;
}

const toggle = event.target.closest('.expand-toggle');
if (toggle) {
const taskId = toggle.closest('tr').dataset.taskId;
toggleTaskCollapse(taskId);
}
});

let currentColorCell = null;
let selectedCellTextColor = cellTextColorPicker.value;
let currentGanttLabel = null;
let currentGanttTaskId = null;
let selectedGanttLabelColor = ganttLabelColorPicker.value;
taskMatrixTableBody.addEventListener('contextmenu', (event) => {
const cell = event.target.closest('td');
if (cell) {
event.preventDefault();
currentColorCell = cell;
const rect = cell.getBoundingClientRect();
cellTextColorPicker.style.left = `${rect.left + window.scrollX}px`;
cellTextColorPicker.style.top = `${rect.top + window.scrollY}px`;
const computedColor = getComputedStyle(cell).color;
cellTextColorPicker.value = rgbToHex(computedColor);
selectedCellTextColor = cellTextColorPicker.value;
cellTextColorPicker.style.display = 'block';
applyCellTextColorBtn.style.left = `${rect.left + window.scrollX + cellTextColorPicker.offsetWidth}px`;
applyCellTextColorBtn.style.top = `${rect.top + window.scrollY}px`;
applyCellTextColorBtn.style.display = 'block';
cellTextColorPicker.focus();
}
});

cellTextColorPicker.addEventListener('input', () => {
selectedCellTextColor = cellTextColorPicker.value;
});

cellTextColorPicker.addEventListener('blur', () => {
setTimeout(() => {
if (document.activeElement !== applyCellTextColorBtn) {
cellTextColorPicker.style.display = 'none';
applyCellTextColorBtn.style.display = 'none';
currentColorCell = null;
}
}, 200);
});

applyCellTextColorBtn.addEventListener('click', () => {
    if (currentColorCell) {
        const newColor = selectedCellTextColor || cellTextColorPicker.value;
        currentColorCell.style.color = newColor;
        if (activeQuill && activeQuillCell === currentColorCell) {
            activeQuill.root.style.color = newColor;
        }
        const row = currentColorCell.closest('tr');
        const fieldName = currentColorCell.dataset.fieldName;
        if (row && fieldName) {
            const taskId = row.dataset.taskId;
            const task = window.allTaskData.find(t => String(t.TaskID) === String(taskId));
            if (task) {
                if (!task.TextColors) task.TextColors = {};
                task.TextColors[fieldName] = newColor;
                if (fieldName === 'Task Name') task.LabelColor = newColor;
                saveProjectData();
            }
        }
    }
    cellTextColorPicker.style.display = 'none';
    applyCellTextColorBtn.style.display = 'none';
    currentColorCell = null;
});

applyCellTextColorBtn.addEventListener('blur', () => {
setTimeout(() => {
if (document.activeElement !== cellTextColorPicker) {
cellTextColorPicker.style.display = 'none';
applyCellTextColorBtn.style.display = 'none';
currentColorCell = null;
}
}, 200);
});

ganttLabelColorPicker.addEventListener('input', () => {
    selectedGanttLabelColor = ganttLabelColorPicker.value;
});

ganttLabelColorPicker.addEventListener('blur', () => {
    setTimeout(() => {
        if (document.activeElement !== applyGanttLabelColorBtn) {
            ganttLabelColorPicker.style.display = 'none';
            applyGanttLabelColorBtn.style.display = 'none';
            currentGanttLabel = null;
            currentGanttTaskId = null;
        }
    }, 200);
});

applyGanttLabelColorBtn.addEventListener('click', () => {
    if (currentGanttLabel) {
        const newColor = selectedGanttLabelColor || ganttLabelColorPicker.value;
        currentGanttLabel.style.fill = newColor;
        if (currentGanttTaskId) {
            const task = window.allTaskData.find(t => String(t.TaskID) === String(currentGanttTaskId));
            if (task) {
                task.LabelColor = newColor;
                if (!task.TextColors) task.TextColors = {};
                task.TextColors['Task Name'] = newColor;
                saveProjectData();
                const row = document.querySelector(`tr[data-task-id="${task.TaskID}"]`);
                if (row) {
                    const cell = row.querySelector('td[data-field-name="Task Name"]');
                    if (cell) cell.style.color = newColor;
                }
            }
        }
    }
    ganttLabelColorPicker.style.display = 'none';
    applyGanttLabelColorBtn.style.display = 'none';
    currentGanttLabel = null;
    currentGanttTaskId = null;
});

applyGanttLabelColorBtn.addEventListener('blur', () => {
    setTimeout(() => {
        if (document.activeElement !== ganttLabelColorPicker) {
            ganttLabelColorPicker.style.display = 'none';
            applyGanttLabelColorBtn.style.display = 'none';
            currentGanttLabel = null;
            currentGanttTaskId = null;
        }
    }, 200);
});

taskMatrixTableBody.addEventListener('dblclick', (event) => {
const cell = event.target.closest('td[data-field-name]');
if (cell) {
makeCellEditable(cell);
return;
}
// Special handling for Task Name because its data-field-name is on an inner span
const taskNameSpan = event.target.closest('span[data-field-name="Task Name"]');
if(taskNameSpan) {
makeCellEditable(taskNameSpan.closest('td')); // Pass the parent td
}
});

// Modal listeners
addNewItemBtn.addEventListener('click', () => showAddItemModal());
if (addNewItemTableBtn) {
  addNewItemTableBtn.addEventListener('click', () => showAddItemModal());
}
closeModalBtn.addEventListener('click', hideAddItemModal);
itemTypeSelect.addEventListener('change', () => {
updateStatusOptions(itemTypeSelect.value);
toggleModalFields();
}); // Listen to itemType change
addItemModal.addEventListener('click', (e) => {
if (e.target === addItemModal) {
hideAddItemModal();
}
});
const saveNextBtn = document.getElementById('saveNextBtn');
if (saveNextBtn) {
saveNextBtn.addEventListener('click', () => handleModalSave(false));
}

if (saveCloseBtn) {
saveCloseBtn.addEventListener('click', (event) => { // Pass event object
event.preventDefault(); // Prevent default button behavior
console.log('Save & Close button clicked (event listener)');
handleModalSave(true);
});
}


closeCommentsBtn.addEventListener('click', hideCommentsModal);
commentsModal.addEventListener('click', (e) => {
if (e.target === commentsModal) hideCommentsModal();
});
cancelEditCommentBtn.addEventListener('click', () => {
  editingCommentIndex = null;
  newCommentText.value = '';
  newCommentAuthor.value = '';
  addCommentBtn.textContent = 'Add Comment';
  cancelEditCommentBtn.classList.add('hidden');
});
addCommentBtn.addEventListener('click', async () => {
  if (!currentCommentTaskId) return;
  const task = window.allTaskData.find(t => t.TaskID === currentCommentTaskId);
  if (!task) return;
  const text = newCommentText.value.trim();
  if (!text) return;
  const author = newCommentAuthor.value.trim() || 'Anonymous';
  const mentionRegex = /@(\w+)/g;
  const mentions = Array.from(text.matchAll(mentionRegex)).map(m => m[1]);
  const knownNames = new Set(window.allTaskData.map(t => (t.Owner || '').toLowerCase()));
  const validMentions = mentions.filter(m => knownNames.has(m.toLowerCase()));

  if (!Array.isArray(task.Comments)) task.Comments = [];

  if (editingCommentIndex !== null && task.Comments[editingCommentIndex]) {
    const existing = task.Comments[editingCommentIndex];
    existing.text = text;
    existing.author = author;
    existing.timestamp = new Date().toISOString();
    if (validMentions.length > 0) {
      existing.mentions = validMentions;
      showToast(`Mentioned: ${validMentions.join(', ')}`);
    }
    showToast('Comment updated');
  } else {
    const comment = { author, text, timestamp: new Date().toISOString(), acknowledged: false };
    if (validMentions.length > 0) {
      comment.mentions = validMentions;
      showToast(`Mentioned: ${validMentions.join(', ')}`);
    }
    task.Comments.push(comment);
    showToast('Comment added');
  }

  await saveProjectData();
  window.applyFilters();
  showCommentsModal(currentCommentTaskId);
});

commentsList.addEventListener('click', async (e) => {
const edit = e.target.closest('.edit-comment');
if (edit) {
  const idx = parseInt(edit.dataset.commentIndex, 10);
  const task = window.allTaskData.find(t => t.TaskID === currentCommentTaskId);
  if (task && Array.isArray(task.Comments) && task.Comments[idx]) {
    const c = task.Comments[idx];
    newCommentText.value = c.text;
    newCommentAuthor.value = c.author;
    editingCommentIndex = idx;
    addCommentBtn.textContent = 'Save Comment';
    cancelEditCommentBtn.classList.remove('hidden');
  }
  return;
}
const del = e.target.closest('.delete-comment');
if (del) {
const idx = parseInt(del.dataset.commentIndex, 10);
const task = window.allTaskData.find(t => t.TaskID === currentCommentTaskId);
if (task && Array.isArray(task.Comments)) {
task.Comments.splice(idx, 1);
await saveProjectData();
showCommentsModal(currentCommentTaskId);
showToast('Comment deleted');
}
}
const ack = e.target.closest('.ack-comment');
if (ack) {
const idx = parseInt(ack.dataset.commentIndex, 10);
const task = window.allTaskData.find(t => t.TaskID === currentCommentTaskId);
if (task && Array.isArray(task.Comments) && task.Comments[idx]) {
task.Comments[idx].acknowledged = !task.Comments[idx].acknowledged;
await saveProjectData();
showCommentsModal(currentCommentTaskId);
window.applyFilters();
showToast('Comment updated');
}
}
});

itemCancelEditCommentBtn.addEventListener('click', () => {
  itemEditingCommentIndex = null;
  itemCommentText.value = '';
  itemCommentAuthor.value = '';
  itemAddCommentBtn.textContent = 'Add Comment';
  itemCancelEditCommentBtn.classList.add('hidden');
});

itemAddCommentBtn.addEventListener('click', async () => {
  if (!itemCommentTaskId) return;
  const task = window.allTaskData.find(t => t.TaskID === itemCommentTaskId);
  if (!task) return;
  const text = itemCommentText.value.trim();
  if (!text) return;
  const author = itemCommentAuthor.value.trim() || 'Anonymous';
  const mentionRegex = /@(\w+)/g;
  const mentions = Array.from(text.matchAll(mentionRegex)).map(m => m[1]);
  const knownNames = new Set(window.allTaskData.map(t => (t.Owner || '').toLowerCase()));
  const validMentions = mentions.filter(m => knownNames.has(m.toLowerCase()));

  if (!Array.isArray(task.Comments)) task.Comments = [];

  if (itemEditingCommentIndex !== null && task.Comments[itemEditingCommentIndex]) {
    const existing = task.Comments[itemEditingCommentIndex];
    existing.text = text;
    existing.author = author;
    existing.timestamp = new Date().toISOString();
    if (validMentions.length > 0) {
      existing.mentions = validMentions;
      showToast(`Mentioned: ${validMentions.join(', ')}`);
    }
    showToast('Comment updated');
  } else {
    const comment = { author, text, timestamp: new Date().toISOString(), acknowledged: false };
    if (validMentions.length > 0) {
      comment.mentions = validMentions;
      showToast(`Mentioned: ${validMentions.join(', ')}`);
    }
    task.Comments.push(comment);
    showToast('Comment added');
  }

  await saveProjectData();
  populateItemComments(itemCommentTaskId);
});

itemCommentsList.addEventListener('click', async (e) => {
  const edit = e.target.closest('.edit-comment');
  if (edit) {
    const idx = parseInt(edit.dataset.commentIndex, 10);
    const task = window.allTaskData.find(t => t.TaskID === itemCommentTaskId);
    if (task && Array.isArray(task.Comments) && task.Comments[idx]) {
      const c = task.Comments[idx];
      itemCommentText.value = c.text;
      itemCommentAuthor.value = c.author;
      itemEditingCommentIndex = idx;
      itemAddCommentBtn.textContent = 'Save Comment';
      itemCancelEditCommentBtn.classList.remove('hidden');
    }
    return;
  }
  const del = e.target.closest('.delete-comment');
  if (del) {
    const idx = parseInt(del.dataset.commentIndex, 10);
    const task = window.allTaskData.find(t => t.TaskID === itemCommentTaskId);
    if (task && Array.isArray(task.Comments)) {
      task.Comments.splice(idx, 1);
      await saveProjectData();
      populateItemComments(itemCommentTaskId);
      showToast('Comment deleted');
    }
    return;
  }
  const ack = e.target.closest('.ack-comment');
  if (ack) {
    const idx = parseInt(ack.dataset.commentIndex, 10);
    const task = window.allTaskData.find(t => t.TaskID === itemCommentTaskId);
    if (task && Array.isArray(task.Comments) && task.Comments[idx]) {
      task.Comments[idx].acknowledged = !task.Comments[idx].acknowledged;
      await saveProjectData();
      populateItemComments(itemCommentTaskId);
      window.applyFilters();
      showToast('Comment updated');
    }
  }
});

filterButton.addEventListener('click', () => {
window.applyFilters();
showToast('Filters applied');
});
clearFiltersButton.addEventListener('click', () => {
[projectFilter, ownerFilter, statusFilter, situationFilter, typeFilter, issueTypeFilter].forEach(select => {
Array.from(select.options).forEach(o => o.selected = o.value === 'all');
});
startDateFilter.value = '';
endDateFilter.value = '';
document.querySelectorAll('input[name="typeSwitch"]').forEach(cb => cb.checked = cb.value === 'all');
window.typeSwitchValues = ['all'];
window.applyFilters();
showToast('Filters cleared');
});

// Automatically apply filters when any filter value changes
[projectFilter, ownerFilter, statusFilter, situationFilter, typeFilter, issueTypeFilter, startDateFilter, endDateFilter]
.forEach(el => el.addEventListener('change', window.applyFilters));
tableSearchInput.addEventListener('input', window.applyFilters);
typeSwitchCheckboxes.forEach(cb => cb.addEventListener('change', () => {
    if (cb.value === 'all' && cb.checked) {
        typeSwitchCheckboxes.forEach(c => { if (c !== cb) c.checked = false; });
    } else if (cb.checked) {
        document.querySelector('input[name="typeSwitch"][value="all"]').checked = false;
    }
    let checked = Array.from(typeSwitchCheckboxes)
        .filter(c => c.checked && c.value !== 'all')
        .map(c => c.value);
    if (checked.length === 0) {
        checked = ['all'];
        document.querySelector('input[name="typeSwitch"][value="all"]').checked = true;
    }
    window.typeSwitchValues = checked;
    window.applyFilters();
}));

exportCsvButton.addEventListener('click', exportDataToCsv);
exportPdfButton.addEventListener('click', exportDataToPdf);
exportGanttPdfButton.addEventListener('click', exportGanttToPdf);
removeDuplicatesBtn.addEventListener('click', removeDuplicatesFromCurrentData); // Event listener for the new button
deleteSelectedBtn.addEventListener('click', async () => {
const ids = Array.from(taskMatrixTableBody.querySelectorAll('.task-select:checked')).map(cb => cb.dataset.taskId);
await deleteItems(ids);
});
tableDeleteIcon.addEventListener('click', async () => {
    const ids = Array.from(taskMatrixTableBody.querySelectorAll('.task-select:checked')).map(cb => cb.dataset.taskId);
    await deleteItems(ids);
});
duplicateSelectedBtn.addEventListener('click', async () => {
    const ids = Array.from(taskMatrixTableBody.querySelectorAll('.task-select:checked')).map(cb => cb.dataset.taskId);
    await duplicateItems(ids);
});
tableCopyIcon.addEventListener('click', async () => {
    const ids = Array.from(taskMatrixTableBody.querySelectorAll('.task-select:checked')).map(cb => cb.dataset.taskId);
    await duplicateItems(ids);
});
tableEditIcon.addEventListener('click', () => {
    const ids = Array.from(taskMatrixTableBody.querySelectorAll('.task-select:checked')).map(cb => cb.dataset.taskId);
    if (ids.length === 1) {
        showAddItemModal(ids[0]);
    } else if (ids.length === 0) {
        showToast('No task selected');
    } else {
        showToast('Please select only one task to edit');
    }
});
deleteAllBtn.addEventListener('click', async () => {
const ids = window.allTaskData.map(task => task.TaskID);
await deleteItems(ids);
});
exportCommentsBtn.addEventListener('click', exportCommentsToCsv);
importCommentsBtn.addEventListener('click', () => commentsCsvFile.click());
commentsCsvFile.addEventListener('change', async (e) => {
const file = e.target.files[0];
if (!file) return;
await importCommentsFromCsv(file);
commentsCsvFile.value = '';
});

editProjectInfoBtn.addEventListener('click', showProjectInfoModal);
headerEditProjectInfoBtn.addEventListener('click', showProjectInfoModal);
closeProjectInfoBtn.addEventListener('click', hideProjectInfoModal);
saveProjectInfoBtn.addEventListener('click', saveProjectInfo);
projectInfoModal.addEventListener('click', (e) => {
if (e.target === projectInfoModal) hideProjectInfoModal();
});

switchKanbanBtn.addEventListener('click', () => {
    isKanbanVisible = !isKanbanVisible;
    if (isKanbanVisible) {
        ganttCard.classList.add('hidden');
        tableCard.classList.add('hidden');
        kanbanContainer.classList.remove('hidden');
        switchKanbanBtn.textContent = 'Switch to Table/Gantt View';
    } else {
        ganttCard.classList.remove('hidden');
        tableCard.classList.remove('hidden');
        kanbanContainer.classList.add('hidden');
        switchKanbanBtn.textContent = 'Switch to Kanban View';
    }
});

baselineToggle.addEventListener('change', () => {
    baselineVisible = baselineToggle.checked;
    saveBaselineVisibilityState();
    updateBaselineButton();
        if (charts.gantt) {
            addBaselineBars(charts.gantt);
            addMilestoneMarkers(charts.gantt);
            attachGanttDoubleClick(charts.gantt);
            attachGanttClick(charts.gantt);
            attachGanttLabelContextMenu(charts.gantt);
            positionGanttLabelsLeft(charts.gantt);
        }
        if (charts.ganttModal) {
            addBaselineBars(charts.ganttModal);
            addMilestoneMarkers(charts.ganttModal);
            attachGanttDoubleClick(charts.ganttModal);
            attachGanttClick(charts.ganttModal);
            attachGanttLabelContextMenu(charts.ganttModal);
            positionGanttLabelsLeft(charts.ganttModal);
        }
    });

if (toggleBaselineBtn) {
    toggleBaselineBtn.addEventListener('click', () => {
        baselineVisible = !baselineVisible;
        saveBaselineVisibilityState();
        updateBaselineButton();
        if (charts.gantt) {
            addBaselineBars(charts.gantt);
            addMilestoneMarkers(charts.gantt);
            attachGanttDoubleClick(charts.gantt);
            attachGanttClick(charts.gantt);
            attachGanttLabelContextMenu(charts.gantt);
            positionGanttLabelsLeft(charts.gantt);
        }
        if (charts.ganttModal) {
            addBaselineBars(charts.ganttModal);
            addMilestoneMarkers(charts.ganttModal);
            attachGanttDoubleClick(charts.ganttModal);
            attachGanttClick(charts.ganttModal);
            attachGanttLabelContextMenu(charts.ganttModal);
            positionGanttLabelsLeft(charts.ganttModal);
        }
    });
}

resetButton.addEventListener('click', async () => {
if (await showConfirmModal('Are you sure you want to reset all data? This will clear all project data and settings.')) {
console.log('Resetting all data to default...');
await del('projectData'); // Clear project data
await del('columnVisibility'); // Clear column visibility state
await del('columnOrder'); // Clear column order state
await del('projectInfo'); // Clear project info
console.log('All data cleared from IndexedDB.');
// Re-initialize allData and UI elements
window.allTaskData = []; // Ensure in-memory data is also cleared
ganttTotalDateRange = { min: null, max: null }; // Reset gantt range

// Destroy all charts and explicitly clear their canvases
Object.values(charts).forEach(chart => {
  if (!chart) return;
  if (typeof chart.destroy === 'function') {
    if (chart.canvas) {
      const ctx = chart.canvas.getContext('2d');
      ctx.clearRect(0, 0, chart.canvas.width, chart.canvas.height);
    }
    chart.destroy();
  }
});
charts = {}; // Clear chart references
projectNameDisplay.textContent = 'Project Management Dashboard';
projectDescriptionDisplay.textContent = '';

taskFileNameSpan.textContent = ''; // Clear file name display

// Clear KPI card content
document.getElementById('kpi-progress-value').textContent = `0%`;
document.getElementById('kpi-total-tasks').textContent = `0 Tasks`;
document.getElementById('atRiskCount').textContent = `0`;
document.querySelector('#overdueTasksKpi span:last-child').textContent = `0`;
document.querySelector('#highPriorityIssuesKpi span:last-child').textContent = `0`;
document.getElementById('milestoneDaysLeft').textContent = `-`;
document.getElementById('nextMilestoneName').textContent = `No data available`;
document.getElementById('nextMilestoneDate').textContent = `-`;
document.getElementById('kpi-total-priority-tasks').textContent = `0 Tasks`; // New KPI reset
document.getElementById('totalIssuesCount').textContent = `0`; // New KPI reset
document.querySelector('#openIssuesKpi span:last-child').textContent = `0`; // New KPI reset
document.querySelector('#resolvedIssuesKpi span:last-child').textContent = `0`; // New KPI reset

// Re-initialize filters to 'All'
projectFilter.innerHTML = '<option value="all">All</option>';
ownerFilter.innerHTML = '<option value="all">All</option>';
statusFilter.innerHTML = '<option value="all">All</option>';
situationFilter.innerHTML = '<option value="all">All</option>';
typeFilter.innerHTML = '<option value="all">All</option>';
issueTypeFilter.innerHTML = '<option value="all">All</option>';
[projectFilter, ownerFilter, statusFilter, situationFilter, typeFilter, issueTypeFilter].forEach(select => {
Array.from(select.options).forEach(o => o.selected = o.value === 'all');
});
startDateFilter.value = '';
endDateFilter.value = '';
document.querySelectorAll('input[name="typeSwitch"]').forEach(cb => cb.checked = cb.value === 'all');
window.typeSwitchValues = ['all'];

// Clear table display directly
taskMatrixTable.querySelector('thead tr').innerHTML = ''; // Clear headers
taskMatrixTableBody.innerHTML = ''; // Clear rows

// Re-add default headers (by re-calling initializeColumnVisibilityControls)
await initializeColumnVisibilityControls(); 

// Finally, initialize UI with empty data, which will attempt to draw "No data" message
await initializeUI([]); 

console.log('Dashboard reset to empty state.');
}
});

tableZoomIn.addEventListener('click', () => setTableFontSize(currentTableFontSize + 1));
closeGanttModalBtn.addEventListener('click', hideGanttModal);
tableZoomOut.addEventListener("click", () => setTableFontSize(currentTableFontSize - 1));
ganttZoomIn.addEventListener("click", () => zoomGantt("in"));
ganttZoomOut.addEventListener("click", () => zoomGantt("out"));
openGanttModalBtn.addEventListener("click", showGanttModal);
if (toggleGanttEditBtn) {
    toggleGanttEditBtn.addEventListener('click', () => {
        ganttEditMode = !ganttEditMode;
        updateGanttEditButtons();
    });
}
if (toggleGanttModalEditBtn) {
    toggleGanttModalEditBtn.addEventListener('click', () => {
        ganttEditMode = !ganttEditMode;
        updateGanttEditButtons();
    });
}
if (ganttViewModeSelect) {
    ganttViewModeSelect.addEventListener('change', (e) => changeGanttView(e.target.value));
}
if (ganttViewModeModalSelect) {
    ganttViewModeModalSelect.addEventListener('change', (e) => changeGanttModalView(e.target.value));
}

// --- Enhanced Gantt Chart Scrolling Controls ---
const scrollAmount = 150; // Standard scroll distance in pixels

// Scroll Left Button
ganttScrollLeft.addEventListener('click', () => {
    ganttContainer.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
});

ganttScrollLeft.addEventListener('dblclick', () => {
    const chart = charts.gantt;
    if (chart && chart.gantt_start) {
        chart.set_scroll_position(chart.gantt_start);
        showToast("Jumped to project start");
    }
});

// Scroll Right Button
ganttScrollRight.addEventListener('click', () => {
    ganttContainer.scrollBy({ left: scrollAmount, behavior: 'smooth' });
});

ganttScrollRight.addEventListener('dblclick', () => {
    const chart = charts.gantt;
    if (chart) {
        chart.set_scroll_position('end');
        showToast("Jumped to project end");
    }
});

ganttScrollUp.addEventListener('click', () => {
    ganttContainer.scrollBy({ top: -scrollAmount, behavior: 'smooth' });
});

ganttScrollDown.addEventListener('click', () => {
    ganttContainer.scrollBy({ top: scrollAmount, behavior: 'smooth' });
});
function scrollToFirstTask() {
    const chart = charts.gantt;
    if (chart && chart.tasks && chart.tasks.length > 0) {
        // Get an array of all start date timestamps
        const start_dates = chart.tasks.map(t => t._start.getTime());

        // Find the minimum timestamp
        const earliest_timestamp = Math.min(...start_dates);

        // Convert back to a Date object
        const first_date = new Date(earliest_timestamp);

        // Scroll the chart to the earliest date
        chart.set_scroll_position(first_date);
    }

    // Also scroll vertically to the top
    ganttContainer.scrollTo({ top: 0, behavior: 'smooth' });
}

function setupGanttDrag(container) {
    if (!container) return;
    let isPanning = false;
    let startX = 0;
    let startY = 0;
    let startLeft = 0;
    let startTop = 0;
    container.addEventListener('mousedown', (e) => {
            if (e.button !== 0) return;
            // แก้ไขให้ตรวจสอบ .bar-wrapper ซึ่งครอบคลุมทุกส่วนของ task bar
            if (e.target.closest('.bar-wrapper')) {
                return;
            }
            isPanning = true;
        startX = e.clientX;
        startY = e.clientY;
        startLeft = container.scrollLeft;
        startTop = container.scrollTop;
        container.classList.add('panning');
        e.preventDefault();
    });
    container.addEventListener('mousemove', (e) => {
        if (!isPanning) return;
        container.scrollLeft = startLeft - (e.clientX - startX);
        container.scrollTop = startTop - (e.clientY - startY);
    });
    ['mouseup', 'mouseleave'].forEach(evt => {
        container.addEventListener(evt, () => {
            if (!isPanning) return;
            isPanning = false;
            container.classList.remove('panning');
        });
    });
}

ganttContainers.forEach(setupGanttDrag);
updateGanttEditButtons();

// Keep Gantt chart and table scrolling in sync vertically
if (tableContainer && ganttContainer) {
    let syncingScroll = false;

    tableContainer.addEventListener('scroll', () => {
        if (syncingScroll) return;
        syncingScroll = true;
        ganttContainer.scrollTop = tableContainer.scrollTop;
        requestAnimationFrame(() => { syncingScroll = false; });
    });

    ganttContainer.addEventListener('scroll', () => {
        if (syncingScroll) return;
        syncingScroll = true;
        tableContainer.scrollTop = ganttContainer.scrollTop;
        requestAnimationFrame(() => { syncingScroll = false; });
    });
}

ganttFirstTaskBtn.addEventListener('click', scrollToFirstTask);
ganttModal.addEventListener('click', (e) => { if (e.target === ganttModal) hideGanttModal(); });

openTableModalBtn.addEventListener('click', showTableModal);
closeTableModalBtn.addEventListener('click', hideTableModal);
tableModal.addEventListener('click', (e) => { if (e.target === tableModal) hideTableModal(); });

openKpiModalBtn.addEventListener('click', showKpiModal);
closeKpiModalBtn.addEventListener('click', hideKpiModal);
kpiModal.addEventListener('click', (e) => { if (e.target === kpiModal) hideKpiModal(); });
document.querySelectorAll('#kpi-container [data-kpi]').forEach(card => {
    card.addEventListener('click', () => {
        const type = card.dataset.kpi;
        const title = card.querySelector('.kpi-title')?.textContent || 'KPI Details';
        showKpiDetails(type, title);
    });
});
toggleKpiCardBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const card = document.getElementById('kpiCard');
    toggleCardVisibility(card, toggleKpiCardBtn, true);
});
toggleGanttCardBtn.addEventListener('click', (e) => { e.stopPropagation(); toggleCardVisibility(ganttCard, toggleGanttCardBtn); });
toggleTableCardBtn.addEventListener('click', (e) => { e.stopPropagation(); toggleCardVisibility(tableCard, toggleTableCardBtn); });
toggleKanbanCardBtn.addEventListener('click', (e) => { e.stopPropagation(); toggleCardVisibility(kanbanContainer, toggleKanbanCardBtn); });
openKanbanModalBtn.addEventListener('click', showKanbanModal);
closeKanbanModalBtn.addEventListener('click', hideKanbanModal);
kanbanModal.addEventListener('click', (e) => { if (e.target === kanbanModal) hideKanbanModal(); });
if (kanbanTypeSelect) {
    kanbanTypeSelect.addEventListener('change', () => {
        updateKanbanBoard(window.currentDashboardData || window.allTaskData);
    });
}

let selectedTextColor = tableTextColorPicker.value;
tableTextColorPicker.addEventListener('input', () => {
selectedTextColor = tableTextColorPicker.value;
});
applyTextColorBtn.addEventListener('click', () => {
document.documentElement.style.setProperty('--table-text-color', selectedTextColor);
});

async function initializeUI(data) {
// Load column order and visibility before rendering anything
await loadColumnOrderAndVisibilityState(); 

// Always update filters based on current data, even if empty
populateSelectFilter(projectFilter, data, 'Project Name');
populateSelectFilter(ownerFilter, data, 'Owner');
populateSelectFilter(situationFilter, data, 'Situation');
populateSelectFilter(typeFilter, data, 'Record Type');
populateSelectFilter(issueTypeFilter, data, 'Issue Type');
document.querySelectorAll('input[name="typeSwitch"]').forEach(cb => cb.checked = cb.value === 'all');
window.typeSwitchValues = ['all'];
const allStatuses = [...new Set(data.map(item => item.Status))].filter(Boolean);
statusFilter.innerHTML = '<option value="all">All</option>' + allStatuses.map(s => `<option value="${s}">${s}</option>`).join('');
Array.from(statusFilter.options).forEach(o => o.selected = o.value === 'all');

updateGanttRange(data);

updateDashboard(data); // Initial full dashboard render

await initializeColumnVisibilityControls(); // Initialize column visibility controls (checkboxes)
checkDueTasks();
}


// Initial load from embedded data
async function initializeDashboard() {
try {
let loadedData = await get('projectData');
if (loadedData && loadedData.length > 0) {
console.log('Loaded data from IndexedDB.');
window.allTaskData = loadedData;
} else {
console.log('No data in IndexedDB or default data is empty. Starting with empty dashboard.');
window.allTaskData = []; // Explicitly ensure it's empty
}
await loadProjectInfo();
await initializeUI(window.allTaskData);
} catch(e) {
console.error("Could not load project data:", e);
await showCustomAlert("Could not load project data. Please check the data format or browser compatibility.", "Data Load Error");
}
}

initializeDashboard();
});
