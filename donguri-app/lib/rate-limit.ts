// シンプルなインメモリレート制限
// 本番環境ではRedisベースの実装に置き換えることを推奨

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// 古いエントリを定期的にクリーンアップ（メモリリーク防止）
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (entry.resetAt < now) {
      store.delete(key);
    }
  }
}, 60 * 1000);

/**
 * レート制限チェック
 * @param key 制限対象のキー（例: IP + エンドポイント）
 * @param limit ウィンドウ内の最大リクエスト数
 * @param windowMs 時間ウィンドウ（ミリ秒）
 * @returns { allowed: boolean, remaining: number, resetAt: number }
 */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || entry.resetAt < now) {
    // 新しいウィンドウを開始
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, resetAt: now + windowMs };
  }

  entry.count += 1;
  const allowed = entry.count <= limit;
  return {
    allowed,
    remaining: Math.max(0, limit - entry.count),
    resetAt: entry.resetAt,
  };
}
