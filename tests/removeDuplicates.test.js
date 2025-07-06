const { removeDuplicatesFromCurrentData } = require('../src/removeDuplicates');

test('removeDuplicatesFromCurrentData removes duplicate rows', () => {
  const data = [
    { 'Record Type': 'Task', 'Task Name': 'A', 'Start Date': '2023-01-01', 'End Date': '2023-01-02', TaskID: '1' },
    { 'Record Type': 'Task', 'Task Name': 'A', 'Start Date': '2023-01-01', 'End Date': '2023-01-02', TaskID: '1' },
    { 'Record Type': 'Task', 'Task Name': 'B', 'Start Date': '2023-02-01', 'End Date': '2023-02-02', TaskID: '2' },
  ];
  const mockConfirm = jest.fn(() => true);
  const result = removeDuplicatesFromCurrentData(data, mockConfirm);
  expect(mockConfirm).toHaveBeenCalled();
  expect(result).toHaveLength(2);
  expect(result).toEqual([
    { 'Record Type': 'Task', 'Task Name': 'A', 'Start Date': '2023-01-01', 'End Date': '2023-01-02', TaskID: '1' },
    { 'Record Type': 'Task', 'Task Name': 'B', 'Start Date': '2023-02-01', 'End Date': '2023-02-02', TaskID: '2' }
  ]);
});
