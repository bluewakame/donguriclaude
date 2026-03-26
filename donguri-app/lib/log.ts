// 安全なエラーロギングヘルパー
// error オブジェクトをそのまま出力すると、リクエスト情報や
// DB データ等の機密情報がログに含まれるリスクがある。
// メッセージとスタックトレース（開発環境のみ）のみを出力する。

export function logError(label: string, error: unknown): void {
  if (error instanceof Error) {
    console.error(`${label}: ${error.message}`);
    if (process.env.NODE_ENV === "development" && error.stack) {
      console.error(error.stack);
    }
  } else {
    console.error(`${label}: 不明なエラー`);
  }
}
