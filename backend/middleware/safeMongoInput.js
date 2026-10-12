const mongoSanitize = require('express-mongo-sanitize');
const blockedKeys = new Set(['__proto__', 'constructor', 'prototype']);

const hasUnsafeMongoInput = (value) => {
  const pending = [{ value, depth: 0 }];
  let visited = 0;

  while (pending.length) {
    const current = pending.pop();
    if (current.depth > 32 || ++visited > 10_000) return true;
    if (!current.value || typeof current.value !== 'object') continue;

    for (const key of Object.keys(current.value)) {
      if (key.startsWith('$') || key.includes('.') || blockedKeys.has(key)) return true;
      pending.push({ value: current.value[key], depth: current.depth + 1 });
    }
  }

  return mongoSanitize.has(value);
};

module.exports = { hasUnsafeMongoInput };
