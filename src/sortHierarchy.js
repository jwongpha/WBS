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

module.exports = { sortHierarchy };
