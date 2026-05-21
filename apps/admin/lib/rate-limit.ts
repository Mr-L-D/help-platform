/**
 * 简易内存速率限制器。
 * 按 key 在 windowMs 毫秒内最多允许 maxRequests 次请求。
 * 每分钟自动清理过期条目。
 */

const store = new Map<string, { count: number; resetAt: number }>();

// 每分钟清理一次过期条目
const CLEANUP_INTERVAL = 60_000;
let cleanupTimer: ReturnType<typeof setInterval> | null = null;

function ensureCleanup() {
  if (cleanupTimer) return;
  cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store) {
      if (now > entry.resetAt) store.delete(key);
    }
  }, CLEANUP_INTERVAL);
}

/** 检查 key 是否超出速率限制。返回 true 表示允许本次请求。 */
export function rateLimit(key: string, maxRequests: number, windowMs: number): boolean {
  ensureCleanup();

  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (entry.count >= maxRequests) {
    return false;
  }

  entry.count++;
  return true;
}
