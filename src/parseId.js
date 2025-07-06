const TYPE_MAP = {
  A: 'Task',
  I: 'Issue',
  V: 'Milestone'
};

function parseId(id) {
  if (typeof id !== 'string') return null;
  const match = /^([AIV])([0-9]{3})$/i.exec(id.trim());
  if (!match) return null;
  return {
    raw: id,
    type: TYPE_MAP[match[1].toUpperCase()],
    number: parseInt(match[2], 10)
  };
}

module.exports = { parseId };
