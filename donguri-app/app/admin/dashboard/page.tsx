// 運営管理画面
export const dynamic = 'force-dynamic';
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function AdminDashboard() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  // 統計情報を取得
  const [userCount, shopCount, visitCount, totalAcorns] = await Promise.all([
    prisma.user.count(),
    prisma.shop.count(),
    prisma.visitLog.count(),
    prisma.user.aggregate({ _sum: { acornBalance: true } }),
  ]);

  // 最近の来店ログ（10件）
  const recentVisits = await prisma.visitLog.findMany({
    include: {
      user: { select: { displayName: true, email: true } },
      shop: { select: { name: true } },
    },
    orderBy: { visitedAt: "desc" },
    take: 10,
  });

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* ヘッダー */}
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">管理ダッシュボード</h1>
        <p className="text-gray-500">どんぐりアプリの運営管理</p>
      </header>

      {/* 統計カード */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <p className="text-3xl font-bold text-green-600">{userCount}</p>
          <p className="text-sm text-gray-500">👤 ユーザー数</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <p className="text-3xl font-bold text-blue-600">{shopCount}</p>
          <p className="text-sm text-gray-500">🏪 加盟店数</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <p className="text-3xl font-bold text-purple-600">{visitCount}</p>
          <p className="text-sm text-gray-500">📍 来店総数</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <p className="text-3xl font-bold text-amber-600">{totalAcorns._sum.acornBalance ?? 0}</p>
          <p className="text-sm text-gray-500">🌰 流通どんぐり</p>
        </div>
      </div>

      {/* 最近の来店ログ */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-lg font-bold text-gray-700 mb-4">最近の来店ログ</h2>
        <div className="space-y-2">
          {recentVisits.map((visit) => (
            <div key={visit.id} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
              <div>
                <p className="text-sm font-medium text-gray-700">
                  {visit.user.displayName} → {visit.shop.name}
                </p>
                <p className="text-xs text-gray-400">
                  {new Date(visit.visitedAt).toLocaleString("ja-JP")}
                </p>
              </div>
              <span className={visit.isGolden ? "text-yellow-500 font-bold" : "text-green-600 font-bold"}>
                {visit.isGolden ? "✨ 金" : `+🌰${visit.acornEarned}`}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
