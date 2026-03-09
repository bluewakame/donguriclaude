// トップページ（ランディングページ）
import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="h-svh flex flex-col items-center bg-gradient-to-b from-green-50 to-green-100 px-4">
      {/* ロゴ */}
      <div className="flex-none flex flex-col items-center pt-10 pb-4 gap-1">
        <div className="text-6xl acorn-bounce inline-block">🌰</div>
        <h1 className="text-3xl font-bold text-green-800 mt-2">どんぐり</h1>
        <p className="text-sm text-green-600 text-center">
          街を歩いて、お店に来店して
          <br />
          どんぐりを集めよう！
        </p>
      </div>

      {/* 特徴カード */}
      <div className="flex-1 flex items-center justify-center w-full max-w-sm min-h-0">
        <div className="grid grid-cols-2 gap-3 w-full">
          {[
            { icon: "🗺️", title: "マップ探索", desc: "歩いて葉っぱを集める" },
            { icon: "📷", title: "QRチェックイン", desc: "来店でどんぐりをゲット" },
            { icon: "🍃", title: "葉っぱ交換", desc: "10枚 = 1どんぐり" },
            { icon: "✨", title: "金のどんぐり", desc: "レアなどんぐりも！" },
          ].map((item) => (
            <div
              key={item.title}
              className="bg-white rounded-xl p-3 shadow-sm flex items-center gap-2"
            >
              <span className="text-2xl flex-none">{item.icon}</span>
              <div className="min-w-0">
                <h3 className="font-semibold text-gray-800 text-sm leading-tight">
                  {item.title}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTAボタン */}
      <div className="flex-none flex flex-col gap-3 w-full max-w-sm pb-10">
        <Link
          href="/register"
          className="bg-green-600 text-white text-center py-3.5 rounded-xl font-bold text-base shadow-lg hover:bg-green-700 transition-colors"
        >
          はじめる（無料）
        </Link>
        <Link
          href="/login"
          className="bg-white text-green-600 text-center py-3.5 rounded-xl font-bold text-base border-2 border-green-600 hover:bg-green-50 transition-colors"
        >
          ログイン
        </Link>
        <p className="text-center text-xs text-gray-400">どんぐり © 2024</p>
      </div>
    </main>
  );
}
