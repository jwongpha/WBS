const Papa = require('papaparse');

function exportDataToCsv(allTaskData) {
  if (!Array.isArray(allTaskData) || allTaskData.length === 0) {
    return '';
  }
  const dataToExport = allTaskData.map(task => {
    const { _isCollapsed, Type, 'Progress Detail': progressDetail, ...exportedTask } = task;
    exportedTask.DETAILS = progressDetail || '';
    return exportedTask;
  });
  return Papa.unparse(dataToExport);
}

function exportCommentsToCsv(allTaskData) {
  const allComments = [];
  (allTaskData || []).forEach(task => {
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
  if (allComments.length === 0) return '';
  return Papa.unparse(allComments);
}

function importCommentsFromCsv(csvString, allTaskData) {
  const results = Papa.parse(csvString, { header: true, skipEmptyLines: true });
  results.data.forEach(row => {
    const taskId = row.TaskID;
    const text = row.Comment || row.Text || row.comment;
    if (!taskId || !text) return;
    const task = allTaskData.find(t => t.TaskID == taskId);
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
  return allTaskData;
}

module.exports = { exportDataToCsv, exportCommentsToCsv, importCommentsFromCsv };
