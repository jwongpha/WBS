const { sortHierarchy } = require('../src/sortHierarchy');

test('sortHierarchy sorts items while preserving parent-child structure', () => {
  const items = [
    { TaskID: '1', ParentID: null, Name: 'B', Order: 2 },
    { TaskID: '2', ParentID: '1', Name: 'A child', Order: 1 },
    { TaskID: '3', ParentID: null, Name: 'A', Order: 1 },
    { TaskID: '4', ParentID: '3', Name: 'Z child', Order: 2 },
    { TaskID: '5', ParentID: '3', Name: 'A child', Order: 1 }
  ];

  const result = sortHierarchy(items, 'Name', true);
  expect(result.map(i => i.TaskID)).toEqual(['3','5','4','1','2']);

  const resultDesc = sortHierarchy(items, 'Order', false);
  expect(resultDesc.map(i => i.TaskID)).toEqual(['1','2','3','4','5']);
});
