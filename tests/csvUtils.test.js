const { exportDataToCsv, exportCommentsToCsv, importCommentsFromCsv } = require('../src/csvUtils');
const Papa = require('papaparse');

describe('CSV Utilities', () => {
  test('exportDataToCsv returns CSV string of tasks', () => {
    const tasks = [
      { TaskID: '1', Name: 'A', _isCollapsed: false, Type: 'Task', 'Progress Detail': 'foo' },
      { TaskID: '2', Name: 'B', _isCollapsed: true, Type: 'Task' }
    ];
    const csv = exportDataToCsv(tasks);
    const parsed = Papa.parse(csv, { header: true }).data;
    expect(parsed[0]).toEqual({ TaskID: '1', Name: 'A', DETAILS: 'foo' });
    expect(parsed[1].TaskID).toBe('2');
    expect(parsed[1].Name).toBe('B');
    expect(parsed[1].DETAILS).toBe('');
  });

  test('exportDataToCsv maps Progress Detail to DETAILS column', () => {
    const tasks = [
      { TaskID: '5', Name: 'Test', _isCollapsed: false, Type: 'Task', 'Progress Detail': 'bar' }
    ];
    const csv = exportDataToCsv(tasks);
    const parsed = Papa.parse(csv, { header: true }).data;
    expect(parsed[0]).toEqual({ TaskID: '5', Name: 'Test', DETAILS: 'bar' });
  });

  test('exportCommentsToCsv returns CSV string of comments', () => {
    const tasks = [
      { TaskID: '1', Comments: [ { author: 'Me', text: 'Hi', timestamp: '2020', acknowledged: true } ] },
      { TaskID: '2', Comments: [] }
    ];
    const csv = exportCommentsToCsv(tasks);
    const parsed = Papa.parse(csv, { header: true }).data;
    expect(parsed).toEqual([
      { TaskID: '1', Author: 'Me', Comment: 'Hi', Timestamp: '2020', Acknowledged: 'Yes' }
    ]);
  });

  test('importCommentsFromCsv parses CSV and updates tasks', () => {
    const tasks = [
      { TaskID: '1', Comments: [] },
      { TaskID: '2' }
    ];
    const csv = 'TaskID,Author,Comment\n1,John,Hello\n2,,World';
    const updated = importCommentsFromCsv(csv, tasks);
    expect(updated[0].Comments.length).toBe(1);
    expect(updated[0].Comments[0].text).toBe('Hello');
    expect(updated[1].Comments.length).toBe(1);
    expect(updated[1].Comments[0].author).toBe('Imported');
    expect(updated[1].Comments[0].text).toBe('World');
  });
});
