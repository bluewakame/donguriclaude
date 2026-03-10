import Link from "next/link";

export default function BottomNav() {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-[1000] overflow-visible"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="max-w-lg mx-auto flex items-end pb-2 pt-1 overflow-visible">
        <Link
          href="/home"
          className="flex-1 flex flex-col items-center gap-1 pb-1 text-gray-500 hover:text-green-600 transition-colors"
        >
          <span className="text-xl">🗺️</span>
          <span className="text-xs">マップ</span>
        </Link>

        <Link
          href="/wallet"
          className="flex-1 flex flex-col items-center gap-1 pb-1 text-gray-500 hover:text-green-600 transition-colors"
        >
          <span className="text-xl">🌰</span>
          <span className="text-xs">ウォレット</span>
        </Link>

        <Link href="/scan" className="flex-1 flex flex-col items-center pb-1">
          <div className="bg-green-600 rounded-full w-14 h-14 flex items-center justify-center shadow-lg -mt-7 border-4 border-white">
            <span className="text-2xl">📷</span>
          </div>
          <span className="text-xs text-green-600 font-medium mt-1">スキャン</span>
        </Link>

        <Link
          href="/history"
          className="flex-1 flex flex-col items-center gap-1 pb-1 text-gray-500 hover:text-green-600 transition-colors"
        >
          <span className="text-xl">📋</span>
          <span className="text-xs">履歴</span>
        </Link>

        <Link
          href="/settings"
          className="flex-1 flex flex-col items-center gap-1 pb-1 text-gray-500 hover:text-green-600 transition-colors"
        >
          <span className="text-xl">⚙️</span>
          <span className="text-xs">設定</span>
        </Link>
      </div>
    </nav>
  );
}
