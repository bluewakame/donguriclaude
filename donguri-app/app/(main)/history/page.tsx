// 取引・来店履歴ページ
export const dynamic = "force-dynamic";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import HistoryTabs from "@/components/HistoryTabs";

export default async function HistoryPage() {
  const session = await auth();

  const [visitLogs, tokenTransactions] = await Promise.all([
    prisma.visitLog.findMany({
      where: { userId: session!.user!.id! },
      include: { shop: { select: { name: true, address: true } } },
      orderBy: { visitedAt: "desc" },
      take: 30,
    }),
    prisma.tokenTransaction.findMany({
      where: { userId: session!.user!.id! },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
  ]);

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">履歴</h1>
        <p className="text-gray-500 text-sm">来店・取引の記録（最新30件）</p>
      </header>

      <HistoryTabs
        visitLogs={visitLogs}
        tokenTransactions={tokenTransactions}
      />
    </div>
  );
}
