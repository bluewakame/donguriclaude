// 加盟店一覧ページ
export const dynamic = 'force-dynamic';
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function ShopsPage() {
  const shops = await prisma.shop.findMany({
    select: {
      id: true,
      name: true,
      address: true,
      isPremium: true,
      acornAmount: true,
    },
    orderBy: [{ isPremium: "desc" }, { name: "asc" }],
  });

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      {/* ヘッダー */}
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">加盟店一覧</h1>
        <p className="text-gray-500 text-sm">{shops.length}件の店舗が登録されています</p>
      </header>

      {/* 店舗リスト */}
      <div className="space-y-3">
        {shops.map((shop) => (
          <Link
            key={shop.id}
            href={`/shops/${shop.id}`}
            className="block bg-white rounded-xl border border-gray-200 p-4 hover:border-green-400 hover:shadow-sm transition-all"
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="font-medium text-gray-800">{shop.name}</h2>
                  {shop.isPremium && (
                    <span className="bg-yellow-100 text-yellow-700 text-xs px-2 py-0.5 rounded-full font-medium">
                      ✨ プレミアム
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-1">📍 {shop.address}</p>
              </div>
              <div className="text-right ml-3">
                <span className="text-green-600 font-bold">🌰 +{shop.acornAmount}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {shops.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <div className="text-4xl mb-3">🏪</div>
          <p>加盟店が登録されていません</p>
        </div>
      )}
    </div>
  );
}
