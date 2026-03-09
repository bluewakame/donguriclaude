// ホーム（マップ）ページ
export const dynamic = 'force-dynamic';
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Map from "@/components/Map";

export default async function HomePage() {
  const session = await auth();

  // ユーザーの残高を取得
  const user = await prisma.user.findUnique({
    where: { id: session!.user!.id! },
    select: {
      displayName: true,
      acornBalance: true,
      goldenAcornBalance: true,
    },
  });

  return (
    <div className="flex flex-col h-screen">
      {/* ヘッダー */}
      <header className="bg-green-600 text-white px-4 py-3 flex items-center justify-between z-10">
        <div>
          <p className="text-sm opacity-80">こんにちは、{user?.displayName ?? "ゲスト"}さん</p>
          <h1 className="text-xl font-bold">🌰 どんぐり</h1>
        </div>
        <div className="flex gap-4 text-sm">
          <div className="text-center">
            <div className="text-lg font-bold">{user?.acornBalance ?? 0}</div>
            <div className="text-xs opacity-80">🌰 どんぐり</div>
          </div>
          {(user?.goldenAcornBalance ?? 0) > 0 && (
            <div className="text-center">
              <div className="text-lg font-bold">{user?.goldenAcornBalance}</div>
              <div className="text-xs opacity-80">✨ 金</div>
            </div>
          )}
        </div>
      </header>

      {/* 地図 */}
      <div className="flex-1 relative">
        <Map />
      </div>

      {/* 近くの店舗ヒント */}
      <div className="absolute bottom-24 left-4 right-4 z-10">
        <div className="bg-white rounded-xl shadow-lg p-3 flex items-center gap-3">
          <span className="text-2xl">📍</span>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-800">近くの店舗を探そう</p>
            <p className="text-xs text-gray-500">QRスキャンでどんぐりをゲット！</p>
          </div>
          <a
            href="/scan"
            className="bg-green-600 text-white text-xs px-3 py-2 rounded-lg font-medium"
          >
            スキャン
          </a>
        </div>
      </div>
    </div>
  );
}
