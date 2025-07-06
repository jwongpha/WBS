function calculateParentProgress(items) {
  if (!Array.isArray(items)) return items;
  const childMap = {};
  const itemMap = new Map();
  items.forEach(item => {
    itemMap.set(item.TaskID, item);
    if (item.ParentID) {
      (childMap[item.ParentID] = childMap[item.ParentID] || []).push(item);
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

  // start from roots
  items.filter(i => !i.ParentID).forEach(root => compute(root));
  return items;
}

module.exports = { calculateParentProgress };
