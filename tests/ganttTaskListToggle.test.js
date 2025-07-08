const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

function loadDashboardDom() {
  // Read base HTML and remove all existing script tags
  const htmlPath = path.resolve(__dirname, '../index.html');
  const html = fs.readFileSync(htmlPath, 'utf8');
  const dom = new JSDOM(html);
  dom.window.document.querySelectorAll('script').forEach(el => el.remove());

  // Inject stubs for external libs and canvas
  const stub = dom.window.document.createElement('script');
  stub.textContent = `
    window.idbKeyval = {
      get: () => new Promise(r => setTimeout(() => r(undefined), 0)),
      set: async () => {},
      del: async () => {}
    };
    window.Chart = function() { return { destroy() {}, update() {}, config: {}, chartArea: {}, register: () => {} }; };
    window.Chart.register = () => {};
    window.ChartDataLabels = {};
    window.FrappeGantt = function() {};
    window.Quill = function() { this.root = { innerHTML: '', style: {} }; this.on = function() {}; };
    window.mermaid = { initialize: () => {} };
    window.Hammer = function() {};
    window.HTMLCanvasElement.prototype.getContext = function() { return {}; };
  `;
  dom.window.document.body.appendChild(stub);

  const serialized = dom.serialize();
  const testDom = new JSDOM(serialized, { runScripts: 'dangerously', url: 'http://localhost' });
  // Silence console output from dashboard initialization
  testDom.window.console.log = () => {};

  // Execute dashboard.js within the DOM
  const scriptContent = fs.readFileSync(path.resolve(__dirname, '../dashboard.js'), 'utf8');
  testDom.window.eval(scriptContent);
  // Trigger DOMContentLoaded for the listener inside dashboard.js
  testDom.window.document.dispatchEvent(new testDom.window.Event('DOMContentLoaded', { bubbles: true }));
  return testDom;
}

async function tick() {
  return new Promise(r => setTimeout(r, 0));
}

describe('Task list toggle', () => {
  test('clicking toggleTaskListBtn hides and shows task list', async () => {
    const dom = loadDashboardDom();
    await tick();

    const btn = dom.window.document.getElementById('toggleTaskListBtn');
    const containers = dom.window.document.querySelectorAll('.gantt-container');

    // initial state
    expect(btn.title).toBe('Hide Task List');
    expect(btn.innerHTML).toContain('view_sidebar');
    containers.forEach(c => expect(c.classList.contains('hide-task-list')).toBe(false));

    // click to hide task list
    btn.click();
    await tick();

    expect(btn.title).toBe('Show Task List');
    expect(btn.innerHTML).toContain('view_stream');
    containers.forEach(c => expect(c.classList.contains('hide-task-list')).toBe(true));

    // click again to show task list
    btn.click();
    await tick();

    expect(btn.title).toBe('Hide Task List');
    expect(btn.innerHTML).toContain('view_sidebar');
    containers.forEach(c => expect(c.classList.contains('hide-task-list')).toBe(false));
  });
});
