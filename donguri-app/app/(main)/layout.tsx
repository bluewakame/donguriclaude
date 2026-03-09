// メインページの共通レイアウト（ナビゲーションバー付き）
export const dynamic = 'force-dynamic';
import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 未ログインならログインページにリダイレクト
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* メインコンテンツ */}
      <main className="flex-1 pb-20">{children}</main>

      {/* ボトムナビゲーション */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
        <div className="max-w-lg mx-auto flex items-center justify-around py-2 px-4">
          <Link
            href="/home"
            className="flex flex-col items-center gap-1 py-1 px-3 text-gray-500 hover:text-green-600 transition-colors"
          >
            <span className="text-xl">🗺️</span>
            <span className="text-xs">マップ</span>
          </Link>
          <Link
            href="/wallet"
            className="flex flex-col items-center gap-1 py-1 px-3 text-gray-500 hover:text-green-600 transition-colors"
          >
            <span className="text-xl">🌰</span>
            <span className="text-xs">ウォレット</span>
          </Link>
          <Link
            href="/scan"
            className="flex flex-col items-center gap-1 py-1 px-3"
          >
            <div className="bg-green-600 rounded-full w-14 h-14 flex items-center justify-center shadow-lg -mt-6">
              <span className="text-2xl">📷</span>
            </div>
            <span className="text-xs text-green-600 font-medium mt-1">スキャン</span>
          </Link>
          <Link
            href="/history"
            className="flex flex-col items-center gap-1 py-1 px-3 text-gray-500 hover:text-green-600 transition-colors"
          >
            <span className="text-xl">📋</span>
            <span className="text-xs">履歴</span>
          </Link>
          <Link
            href="/settings"
            className="flex flex-col items-center gap-1 py-1 px-3 text-gray-500 hover:text-green-600 transition-colors"
          >
            <span className="text-xl">⚙️</span>
            <span className="text-xs">設定</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
