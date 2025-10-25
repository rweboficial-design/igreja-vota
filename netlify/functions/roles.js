// netlify/functions/utils/cache.js
// Cache em memória por instância de função (sobrevive enquanto a função
// está "quente"). Cada chave tem { ts, ttlMs, value }.

const _cache = new Map();

export function getCache(key) {
  const item = _cache.get(key);
  if (!item) return null;
  const now = Date.now();
  if (now - item.ts > item.ttlMs) {
    _cache.delete(key);
    return null;
  }
  return item.value;
}

export function setCache(key, value, ttlMs) {
  _cache.set(key, { ts: Date.now(), ttlMs, value });
}

export function withCache(key, ttlMs, fetcher) {
  const hit = getCache(key);
  if (hit !== null) return Promise.resolve(hit);
  return Promise.resolve(fetcher()).then((val) => {
    setCache(key, val, ttlMs);
    return val;
  });
}
