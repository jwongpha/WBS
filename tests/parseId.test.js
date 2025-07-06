const { parseId } = require('../src/parseId');

describe('parseId', () => {
  test('parses valid IDs correctly', () => {
    expect(parseId('A123')).toEqual({ raw: 'A123', type: 'Task', number: 123 });
    expect(parseId('i001')).toEqual({ raw: 'i001', type: 'Issue', number: 1 });
    expect(parseId('V999')).toEqual({ raw: 'V999', type: 'Milestone', number: 999 });
  });

  test('returns null for invalid IDs', () => {
    expect(parseId('B123')).toBeNull();
    expect(parseId('A12')).toBeNull();
    expect(parseId('1234')).toBeNull();
  });
});
