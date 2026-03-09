// メインページの共通レイアウト（ナビゲーションバー付き）
export const dynamic = "force-dynamic";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="flex flex-col h-dvh overflow-hidden">
      {/* メインコンテンツ */}
      <main className="flex-1 overflow-y-auto pb-20">{children}</main>

      {/* ボトムナビゲーション
          - z-[1000]: LeafletのzIndex(最大700)より高く設定してマップの上に表示
          - items-end: スキャンボタンの大きな丸がはみ出しても他アイテムが底揃えになる
          - overflow-visible: -mt-7 の丸がバー上部にはみ出しても削れないよう設定
      */}
      <nav
        className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-[1000] overflow-visible"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="max-w-lg mx-auto flex items-end justify-around pb-2 pt-1 px-4 overflow-visible">
          <Link
            href="/home"
            className="flex flex-col items-center gap-1 pb-1 px-3 text-gray-500 hover:text-green-600 transition-colors"
          >
            <span className="text-xl">🗺️</span>
            <span className="text-xs">マップ</span>
          </Link>

          <Link
            href="/wallet"
            className="flex flex-col items-center gap-1 pb-1 px-3 text-gray-500 hover:text-green-600 transition-colors"
          >
            <span className="text-xl">🌰</span>
            <span className="text-xs">ウォレット</span>
          </Link>

          {/* スキャンボタン（中央・浮き上がりデザイン） */}
          <Link
            href="/scan"
            className="flex flex-col items-center pb-1 px-3"
          >
            <div className="bg-green-600 rounded-full w-14 h-14 flex items-center justify-center shadow-lg -mt-7 border-4 border-white">
              <span className="text-2xl">📷</span>
            </div>
            <span className="text-xs text-green-600 font-medium mt-1">
              スキャン
            </span>
          </Link>

          <Link
            href="/history"
            className="flex flex-col items-center gap-1 pb-1 px-3 text-gray-500 hover:text-green-600 transition-colors"
          >
            <span className="text-xl">📋</span>
            <span className="text-xs">履歴</span>
          </Link>

          <Link
            href="/settings"
            className="flex flex-col items-center gap-1 pb-1 px-3 text-gray-500 hover:text-green-600 transition-colors"
          >
            <span className="text-xl">⚙️</span>
            <span className="text-xs">設定</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
