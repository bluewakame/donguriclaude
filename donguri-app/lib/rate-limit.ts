// シンプルなインメモリレート制限
// ⚠️ 重要: Vercel等のサーバーレス環境では各リクエストが異なるインスタンスで
// 処理されるため、このインメモリ実装は実質的に機能しない。
// 本番環境では必ず Upstash Redis 等の外部ストアに置き換えること。
// TODO: Upstash Redis ベースのレート制限に移行する

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
