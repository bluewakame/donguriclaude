// トップページ（ランディングページ）
import Link from "next/link";

export default function Home() {
  return (
    <main className="h-dvh flex flex-col items-center bg-gradient-to-b from-green-50 to-green-100 px-4 py-6">
      {/* ロゴ・ヒーローセクション */}
      <div className="text-center flex-shrink-0">
        <div className="text-6xl mb-2 animate-bounce">🌰</div>
        <h1 className="text-3xl font-bold text-green-800 mb-1">どんぐり</h1>
        <p className="text-green-600 text-sm">
          提携店舗に来店するだけでどんぐりがもらえる！
        </p>
      </div>

      {/* 特徴 */}
      <div className="grid grid-cols-2 gap-3 my-auto w-full max-w-sm">
        <div className="bg-white rounded-xl p-3 shadow-sm flex items-center gap-3">
          <span className="text-2xl">🗺️</span>
          <div>
            <h3 className="font-semibold text-gray-800 text-sm">店舗を探す</h3>
            <p className="text-xs text-gray-500">地図で確認</p>
          </div>
        </div>
        <div className="bg-white rounded-xl p-3 shadow-sm flex items-center gap-3">
          <span className="text-2xl">📱</span>
          <div>
            <h3 className="font-semibold text-gray-800 text-sm">QRチェックイン</h3>
            <p className="text-xs text-gray-500">来店してゲット</p>
          </div>
        </div>
        <div className="bg-white rounded-xl p-3 shadow-sm flex items-center gap-3">
          <span className="text-2xl">🍃</span>
          <div>
            <h3 className="font-semibold text-gray-800 text-sm">葉っぱと交換</h3>
            <p className="text-xs text-gray-500">10枚 = 1個</p>
          </div>
        </div>
        <div className="bg-white rounded-xl p-3 shadow-sm flex items-center gap-3">
          <span className="text-2xl">✨</span>
          <div>
            <h3 className="font-semibold text-gray-800 text-sm">金のどんぐり</h3>
            <p className="text-xs text-gray-500">レアなどんぐりも！</p>
          </div>
        </div>
      </div>

      {/* CTAボタン */}
      <div className="flex flex-col gap-3 w-full max-w-sm flex-shrink-0">
        <Link
          href="/register"
          className="bg-green-600 text-white text-center py-4 rounded-xl font-bold text-lg shadow-lg hover:bg-green-700 transition-colors"
        >
          はじめる（無料）
        </Link>
        <Link
          href="/login"
          className="bg-white text-green-600 text-center py-4 rounded-xl font-bold text-lg border-2 border-green-600 hover:bg-green-50 transition-colors"
        >
          ログイン
        </Link>
        <p className="text-center text-xs text-gray-400">どんぐり © 2024</p>
      </div>
    </main>
  );
}
