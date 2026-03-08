// 取引・来店履歴ページ
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function HistoryPage() {
  const session = await auth();

  // 来店履歴を取得（最新20件）
  const visitLogs = await prisma.visitLog.findMany({
    where: { userId: session!.user!.id! },
    include: { shop: { select: { name: true, address: true } } },
    orderBy: { visitedAt: "desc" },
    take: 20,
  });

  // トークン取引履歴を取得（最新20件）
  const tokenTransactions = await prisma.tokenTransaction.findMany({
    where: { userId: session!.user!.id! },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  // タイプに応じたラベルを返す
  const getTransactionLabel = (type: string, tokenType: string) => {
    const tokenLabel = tokenType === "acorn" ? "🌰 どんぐり" : tokenType === "leaf" ? "🍃 葉っぱ" : "✨ 金のどんぐり";
    switch (type) {
      case "earn": return { label: "獲得", color: "text-green-600", prefix: "+" };
      case "spend": return { label: "利用", color: "text-red-500", prefix: "-" };
      case "expire": return { label: "消滅", color: "text-gray-400", prefix: "-" };
      case "boil": return { label: "ゆでた", color: "text-orange-500", prefix: "" };
      case "exchange": return { label: "交換", color: "text-blue-500", prefix: tokenLabel.includes("どんぐり") ? "+" : "-" };
      default: return { label: type, color: "text-gray-600", prefix: "" };
    }
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      {/* ヘッダー */}
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">履歴</h1>
        <p className="text-gray-500 text-sm">来店・取引の記録</p>
      </header>

      {/* 来店履歴 */}
      <section className="mb-8">
        <h2 className="text-lg font-bold text-gray-700 mb-3">📍 来店履歴</h2>
        {visitLogs.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <div className="text-4xl mb-2">🏪</div>
            <p>まだ来店履歴がありません</p>
          </div>
        ) : (
          <div className="space-y-3">
            {visitLogs.map((log) => (
              <div key={log.id} className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-gray-800">{log.shop.name}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(log.visitedAt).toLocaleDateString("ja-JP", {
                        year: "numeric",
                        month: "numeric",
                        day: "numeric",
                        hour: "numeric",
                        minute: "numeric",
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    {log.isGolden ? (
                      <span className="text-yellow-500 font-bold">✨ 金のどんぐり！</span>
                    ) : (
                      <span className="text-green-600 font-bold">+🌰 {log.acornEarned}個</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* トークン取引履歴 */}
      <section>
        <h2 className="text-lg font-bold text-gray-700 mb-3">💰 取引履歴</h2>
        {tokenTransactions.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <div className="text-4xl mb-2">📋</div>
            <p>まだ取引履歴がありません</p>
          </div>
        ) : (
          <div className="space-y-2">
            {tokenTransactions.map((tx) => {
              const { label, color, prefix } = getTransactionLabel(tx.type, tx.tokenType);
              const tokenEmoji = tx.tokenType === "acorn" ? "🌰" : tx.tokenType === "leaf" ? "🍃" : "✨";

              return (
                <div key={tx.id} className="bg-white rounded-xl border border-gray-200 p-3 flex justify-between items-center">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 ${color}`}>
                        {label}
                      </span>
                      <p className="text-sm text-gray-600">{tx.note ?? ""}</p>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(tx.createdAt).toLocaleDateString("ja-JP", {
                        month: "numeric",
                        day: "numeric",
                        hour: "numeric",
                        minute: "numeric",
                      })}
                    </p>
                  </div>
                  <span className={`font-bold ${color}`}>
                    {prefix}{tokenEmoji}{tx.amount}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
