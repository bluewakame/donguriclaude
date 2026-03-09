// 加盟店詳細ページ
export const dynamic = 'force-dynamic';
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";

export default async function ShopDetailPage({ params }: { params: { id: string } }) {
  const shop = await prisma.shop.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      name: true,
      address: true,
      latitude: true,
      longitude: true,
      radiusMeters: true,
      isPremium: true,
      acornAmount: true,
      goldenProbability: true,
      createdAt: true,
    },
  });

  if (!shop) {
    notFound();
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      {/* 戻るボタン */}
      <Link href="/shops" className="text-green-600 text-sm flex items-center gap-1 mb-4 hover:underline">
        ← 加盟店一覧に戻る
      </Link>

      {/* 店舗ヘッダー */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-xl font-bold text-gray-800">{shop.name}</h1>
              {shop.isPremium && (
                <span className="bg-yellow-100 text-yellow-700 text-xs px-2 py-0.5 rounded-full font-medium">
                  ✨ プレミアム
                </span>
              )}
            </div>
            <p className="text-gray-500 text-sm">📍 {shop.address}</p>
          </div>
          <div className="text-center bg-green-50 rounded-xl p-3">
            <p className="text-2xl font-bold text-green-600">🌰 {shop.acornAmount}</p>
            <p className="text-xs text-gray-500">獲得</p>
          </div>
        </div>

        {/* 詳細情報 */}
        <div className="space-y-2 mt-4 pt-4 border-t border-gray-100">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">チェックイン範囲</span>
            <span className="text-gray-700">{shop.radiusMeters}m以内</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">金のどんぐり確率</span>
            <span className="text-gray-700">{(shop.goldenProbability * 100).toFixed(0)}%</span>
          </div>
        </div>
      </div>

      {/* QRスキャンへのリンク */}
      <Link
        href="/scan"
        className="block bg-green-600 text-white text-center py-4 rounded-xl font-bold text-lg hover:bg-green-700 transition-colors"
      >
        📷 この店舗でどんぐりをゲット
      </Link>

      {/* 地図 */}
      <div className="mt-4 bg-gray-100 rounded-xl overflow-hidden">
        <iframe
          title={`${shop.name}の地図`}
          width="100%"
          height="250"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          src={`https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&q=${shop.latitude},${shop.longitude}&zoom=17`}
          className="border-0"
        />
      </div>
    </div>
  );
}
