// どんぐりをゆでるページ
export const dynamic = 'force-dynamic';
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import BoilButton from "@/components/BoilButton";

export default async function BoilPage() {
  const session = await auth();

  const user = await prisma.user.findUnique({
    where: { id: session!.user!.id! },
    select: { acornBalance: true, lastBoiledAt: true },
  });

  // 有効期限管理中のどんぐりを取得
  const acornExpiries = await prisma.acornExpiry.findMany({
    where: {
      userId: session!.user!.id!,
      isExpired: false,
    },
    orderBy: { expiresAt: "asc" },
  });

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      {/* ヘッダー */}
      <header className="mb-6 text-center">
        <div className="text-6xl mb-3">🫕</div>
        <h1 className="text-2xl font-bold text-gray-800">どんぐりをゆでる</h1>
        <p className="text-gray-500 text-sm mt-1">
          ゆでることで有効期限が7日間延長されます
        </p>
      </header>

      {/* 現在の残高 */}
      <div className="bg-green-50 rounded-xl p-4 mb-6 text-center">
        <p className="text-sm text-gray-500 mb-1">現在のどんぐり</p>
        <div className="text-4xl font-bold text-green-700">
          🌰 {user?.acornBalance ?? 0}個
        </div>
        {user?.lastBoiledAt && (
          <p className="text-xs text-gray-400 mt-2">
            最終ゆで日時: {new Date(user.lastBoiledAt).toLocaleDateString("ja-JP", {
              year: "numeric",
              month: "numeric",
              day: "numeric",
              hour: "numeric",
              minute: "numeric",
            })}
          </p>
        )}
      </div>

      {/* ゆでるボタン */}
      <BoilButton currentBalance={user?.acornBalance ?? 0} />

      {/* 有効期限リスト */}
      {acornExpiries.length > 0 && (
        <div className="mt-6">
          <h2 className="text-lg font-bold text-gray-700 mb-3">有効期限の詳細</h2>
          <div className="space-y-2">
            {acornExpiries.map((expiry) => {
              const daysLeft = Math.ceil(
                (new Date(expiry.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
              );
              const isWarning = daysLeft <= 3;

              return (
                <div
                  key={expiry.id}
                  className={`rounded-xl p-3 flex justify-between items-center ${
                    isWarning ? "bg-orange-50 border border-orange-200" : "bg-gray-50 border border-gray-200"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🌰</span>
                    <span className={`font-medium ${isWarning ? "text-orange-700" : "text-gray-700"}`}>
                      {expiry.amount}個
                    </span>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-medium ${isWarning ? "text-orange-600" : "text-gray-600"}`}>
                      あと{daysLeft}日
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(expiry.expiresAt).toLocaleDateString("ja-JP", {
                        month: "numeric",
                        day: "numeric",
                      })}まで
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 説明 */}
      <div className="mt-6 bg-amber-50 rounded-xl p-4">
        <h3 className="font-medium text-amber-800 mb-2">🍂 どんぐりの有効期限について</h3>
        <ul className="text-sm text-amber-700 space-y-1">
          <li>• どんぐりは獲得から7日以内にゆでないと消えてしまいます</li>
          <li>• ゆでると期限が7日延長されます</li>
          <li>• 金のどんぐりは有効期限がありません</li>
        </ul>
      </div>
    </div>
  );
}
