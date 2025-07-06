const { calculateParentProgress } = require('../src/calcParentProgress');

test('calculateParentProgress averages immediate children', () => {
  const data = [
    { TaskID: '1', ParentID: null, 'Progress (%)': '0' },
    { TaskID: '2', ParentID: '1', 'Progress (%)': '50' },
    { TaskID: '3', ParentID: '1', 'Progress (%)': '100' }
  ];
  calculateParentProgress(data);
  expect(data.find(t => t.TaskID === '1')['Progress (%)']).toBe('75');
});

test('calculateParentProgress handles nested hierarchy', () => {
  const data = [
    { TaskID: 'A', ParentID: null, 'Progress (%)': '0' },
    { TaskID: 'B', ParentID: 'A', 'Progress (%)': '0' },
    { TaskID: 'C', ParentID: 'B', 'Progress (%)': '20' },
    { TaskID: 'D', ParentID: 'B', 'Progress (%)': '80' },
    { TaskID: 'E', ParentID: 'A', 'Progress (%)': '100' }
  ];
  calculateParentProgress(data);
  expect(data.find(t => t.TaskID === 'B')['Progress (%)']).toBe('50');
  expect(data.find(t => t.TaskID === 'A')['Progress (%)']).toBe('75');
});

test('calculateParentProgress ignores children without numeric progress', () => {
  const data = [
    { TaskID: 'P', ParentID: null, 'Progress (%)': '0' },
    { TaskID: 'C1', ParentID: 'P', 'Progress (%)': '100' },
    { TaskID: 'M1', ParentID: 'P', 'Progress (%)': '' },
  ];
  calculateParentProgress(data);
  expect(data.find(t => t.TaskID === 'P')['Progress (%)']).toBe('100');
});
