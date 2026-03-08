// トップページ（ランディングページ）
import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-green-50 to-green-100 px-4">
      {/* ロゴ・ヒーローセクション */}
      <div className="text-center mb-12">
        <div className="text-8xl mb-4 animate-bounce">🌰</div>
        <h1 className="text-4xl font-bold text-green-800 mb-2">どんぐり</h1>
        <p className="text-green-600 text-lg">ポイ活アプリ</p>
        <p className="mt-4 text-gray-600 max-w-sm">
          提携店舗に来店するだけで<br />
          デジタルトークン「どんぐり」がもらえる！
        </p>
      </div>

      {/* 特徴 */}
      <div className="grid grid-cols-1 gap-4 mb-12 max-w-sm w-full">
        <div className="bg-white rounded-xl p-4 shadow-sm flex items-center gap-4">
          <span className="text-3xl">🗺️</span>
          <div>
            <h3 className="font-semibold text-gray-800">近くの店舗を探す</h3>
            <p className="text-sm text-gray-500">地図で提携店舗を確認</p>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm flex items-center gap-4">
          <span className="text-3xl">📱</span>
          <div>
            <h3 className="font-semibold text-gray-800">QRコードでチェックイン</h3>
            <p className="text-sm text-gray-500">来店してどんぐりをゲット</p>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm flex items-center gap-4">
          <span className="text-3xl">🍃</span>
          <div>
            <h3 className="font-semibold text-gray-800">葉っぱと交換</h3>
            <p className="text-sm text-gray-500">葉っぱ10枚 = どんぐり1個</p>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm flex items-center gap-4">
          <span className="text-3xl">✨</span>
          <div>
            <h3 className="font-semibold text-gray-800">金のどんぐりを狙え！</h3>
            <p className="text-sm text-gray-500">運が良ければレアなどんぐりが！</p>
          </div>
        </div>
      </div>

      {/* CTAボタン */}
      <div className="flex flex-col gap-3 w-full max-w-sm">
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
      </div>

      <p className="mt-8 text-xs text-gray-400">
        どんぐり © 2024
      </p>
    </main>
  );
}
