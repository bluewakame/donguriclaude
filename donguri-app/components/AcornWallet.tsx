// どんぐり残高表示コンポーネント
interface AcornWalletProps {
  acornBalance: number;
  leafBalance: number;
  goldenAcornBalance: number;
  lastBoiledAt: Date | null;
}

export default function AcornWallet({
  acornBalance,
  leafBalance,
  goldenAcornBalance,
  lastBoiledAt,
}: AcornWalletProps) {
  // 最後にゆでてからの日数を計算
  const daysSinceBoil = lastBoiledAt
    ? Math.floor((Date.now() - new Date(lastBoiledAt).getTime()) / (1000 * 60 * 60 * 24))
    : null;

  const isBoilWarning = daysSinceBoil !== null && daysSinceBoil >= 5;

  return (
    <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-2xl p-6 text-white shadow-lg">
      {/* メインどんぐり残高 */}
      <div className="text-center mb-6">
        <div className="text-6xl mb-2 acorn-bounce inline-block">🌰</div>
        <div className="text-5xl font-bold">{acornBalance.toLocaleString()}</div>
        <div className="text-green-200 text-sm mt-1">どんぐり</div>
      </div>

      {/* サブトークン */}
      <div className="grid grid-cols-2 gap-3">
        {/* 葉っぱ */}
        <div className="bg-white bg-opacity-20 rounded-xl p-3 text-center">
          <div className="text-2xl mb-1">🍃</div>
          <div className="text-xl font-bold">{leafBalance.toLocaleString()}</div>
          <div className="text-green-100 text-xs">葉っぱ</div>
        </div>

        {/* 金のどんぐり */}
        <div className="bg-white bg-opacity-20 rounded-xl p-3 text-center">
          <div className="text-2xl mb-1">✨</div>
          <div className="text-xl font-bold">{goldenAcornBalance.toLocaleString()}</div>
          <div className="text-green-100 text-xs">金のどんぐり</div>
        </div>
      </div>

      {/* ゆで警告 */}
      {isBoilWarning && (
        <div className="mt-3 bg-orange-400 bg-opacity-80 rounded-xl p-3 flex items-center gap-2">
          <span className="text-xl">⚠️</span>
          <div>
            <p className="text-sm font-medium">どんぐりが消えそうです！</p>
            <p className="text-xs text-orange-100">
              最後にゆでてから{daysSinceBoil}日経っています。今すぐゆでましょう！
            </p>
          </div>
        </div>
      )}

      {/* 最終ゆで日時 */}
      {lastBoiledAt && (
        <p className="text-center text-green-200 text-xs mt-3">
          最後にゆでた日:{" "}
          {new Date(lastBoiledAt).toLocaleDateString("ja-JP", {
            month: "numeric",
            day: "numeric",
          })}
          （{daysSinceBoil}日前）
        </p>
      )}
    </div>
  );
}
