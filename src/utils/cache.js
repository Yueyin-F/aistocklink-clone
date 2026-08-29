// 本地缓存层：API 响应缓存到 localStorage
// 策略：命中缓存立即返回（附带 fromCache 标记），后台刷新；失败时静默回退缓存
// 这是本复现项目的自研增强特性（原站无本地缓存层）

const PREFIX = 'aistock_cache_'
const META = PREFIX + 'meta'

function readMeta() {
  try {
    return JSON.parse(localStorage.getItem(META) || '{}')
  } catch (e) {
    return {}
  }
}

function writeMeta(meta) {
  try {
    localStorage.setItem(META, JSON.stringify(meta))
  } catch (e) { /* 存储满时忽略 */ }
}

function writeEntry(key, data) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(data))
  } catch (e) { /* 存储满时忽略 */ }
}

function readEntry(key) {
  try {
    const raw = localStorage.getItem(PREFIX + key)
    return raw ? JSON.parse(raw) : null
  } catch (e) {
    return null
  }
}

function hashKey(key) {
  let h = 0
  const s = String(key)
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0
  }
  return (h >>> 0).toString(36)
}

// 从缓存读取（不过期即返回 {data, cachedAt}）
export function cacheGet(key) {
  const meta = readMeta()
  const entry = meta[key]
  if (!entry) return null
  if (Date.now() - entry.cachedAt > (entry.ttlMs || 60e3)) return null
  return { data: readEntry(entry.hk), cachedAt: entry.cachedAt }
}

// 写入缓存
export function cacheSet(key, data, ttlMs = 60e3) {
  const hk = hashKey(key)
  writeEntry(hk, data)
  const meta = readMeta()
  meta[key] = { hk, cachedAt: Date.now(), ttlMs }
  writeMeta(meta)
}

/**
 * 带缓存的请求封装：
 * - 立即返回缓存值（若新鲜），标记 fromCache
 * - 同时发起网络请求，成功后更新缓存并回调 onFresh
 */
export async function cachedFetch(key, fetcher, { ttlMs = 60e3, onFresh = null, force = false } = {}) {
  const hit = force ? null : cacheGet(key)
  if (hit) {
    // 后台刷新
    fetcher()
      .then((data) => {
        cacheSet(key, data, ttlMs)
        onFresh && onFresh(data, false)
      })
      .catch(() => { /* 静默回退缓存 */ })
    onFresh && onFresh(hit.data, true)
    return hit.data
  }
  try {
    const data = await fetcher()
    cacheSet(key, data, ttlMs)
    onFresh && onFresh(data, false)
    return data
  } catch (e) {
    // 网络失败：尝试读取过期缓存兜底
    const meta = readMeta()
    const entry = meta[key]
    if (entry) {
      const stale = readEntry(entry.hk)
      if (stale) {
        onFresh && onFresh(stale, true)
        return stale
      }
    }
    throw e
  }
}

export function clearAllCache() {
  try {
    const keys = []
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (k && k.startsWith(PREFIX)) keys.push(k)
    }
    keys.forEach((k) => localStorage.removeItem(k))
    localStorage.removeItem(META)
  } catch (e) { /* ignore */ }
}

export default { cacheGet, cacheSet, cachedFetch, clearAllCache }
