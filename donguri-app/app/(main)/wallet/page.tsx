// ウォレットページ（残高・ゆでる・交換・森の可視化）
export const dynamic = "force-dynamic";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AcornWallet from "@/components/AcornWallet";
import BoilButton from "@/components/BoilButton";
import ForestView from "@/components/ForestView";
import Link from "next/link";

export default async function WalletPage() {
  const session = await auth();

  const user = await prisma.user.findUnique({
    where: { id: session!.user!.id! },
    select: {
      acornBalance: true,
      leafBalance: true,
      goldenAcornBalance: true,
      lastBoiledAt: true,
    },
  });

  // 3日以内に期限が切れるどんぐりを取得
  const threeDaysFromNow = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
  const expiringAcorns = await prisma.acornExpiry.findMany({
    where: {
      userId: session!.user!.id!,
      isExpired: false,
      expiresAt: { lte: threeDaysFromNow },
    },
    orderBy: { expiresAt: "asc" },
    take: 5,
  });

  const acorns = user?.acornBalance ?? 0;
  const leaves = user?.leafBalance ?? 0;
  const golden = user?.goldenAcornBalance ?? 0;

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      {/* ヘッダー */}
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">ウォレット</h1>
        <p className="text-gray-500 text-sm">あなたのどんぐりを管理しよう</p>
      </header>

      {/* 残高カード */}
      <AcornWallet
        acornBalance={acorns}
        leafBalance={leaves}
        goldenAcornBalance={golden}
        lastBoiledAt={user?.lastBoiledAt ?? null}
      />

      {/* 期限切れ間近の警告 */}
      {expiringAcorns.length > 0 && (
        <div className="mt-4 bg-orange-50 border border-orange-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-orange-500">⚠️</span>
            <h3 className="font-medium text-orange-700">
              もうすぐ消えるどんぐり
            </h3>
          </div>
          <div className="space-y-1">
            {expiringAcorns.map((expiry) => (
              <div
                key={expiry.id}
                className="text-sm text-orange-600 flex justify-between"
              >
                <span>🌰 {expiry.amount}個</span>
                <span>
                  {new Date(expiry.expiresAt).toLocaleDateString("ja-JP", {
                    month: "numeric",
                    day: "numeric",
                    hour: "numeric",
                    minute: "numeric",
                  })}
                  まで
                </span>
              </div>
            ))}
          </div>
          <p className="text-xs text-orange-500 mt-2">
            今すぐゆでて有効期限を延ばそう！
          </p>
        </div>
      )}

      {/* 森の可視化 */}
      <div className="mt-6">
        <ForestView acornBalance={acorns} />
      </div>

      {/* ゆでるセクション */}
      <div className="mt-6 bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="font-bold text-gray-700 mb-1">🫕 どんぐりをゆでる</h2>
        <p className="text-sm text-gray-500 mb-4">
          ゆでると有効期限が7日間延長されます
        </p>
        <BoilButton currentBalance={acorns} />
      </div>

      {/* アクションリンク */}
      {golden > 0 && (
        <Link
          href="/shop"
          className="mt-4 w-full flex items-center justify-between bg-yellow-50 border border-yellow-300 rounded-xl p-4 hover:bg-yellow-100 transition-colors"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">✨</span>
            <div>
              <p className="font-medium text-yellow-800">金のどんぐりショップ</p>
              <p className="text-sm text-yellow-600">
                金のどんぐりでアイテムと交換
              </p>
            </div>
          </div>
          <span className="text-gray-400">›</span>
        </Link>
      )}

      <Link
        href="/exchange"
        className="mt-4 w-full flex items-center justify-between bg-green-50 border border-green-200 rounded-xl p-4 hover:bg-green-100 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">🍃</span>
          <div>
            <p className="font-medium text-green-800">葉っぱをどんぐりに交換</p>
            <p className="text-sm text-green-600">葉っぱ10枚 = どんぐり1個</p>
          </div>
        </div>
        <span className="text-gray-400">›</span>
      </Link>

      <Link
        href="/history"
        className="mt-3 w-full flex items-center justify-between bg-gray-50 border border-gray-200 rounded-xl p-4 hover:bg-gray-100 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">📋</span>
          <p className="font-medium text-gray-700">取引履歴を見る</p>
        </div>
        <span className="text-gray-400">›</span>
      </Link>
    </div>
  );
}
