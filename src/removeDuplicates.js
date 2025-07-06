function removeDuplicatesFromCurrentData(data, confirmFn = () => true) {
  if (!confirmFn()) {
    return data;
  }
  const uniqueDataMap = new Map();
  data.forEach(row => {
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
    }
  });
  return Array.from(uniqueDataMap.values());
}
module.exports = { removeDuplicatesFromCurrentData };
