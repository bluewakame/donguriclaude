// ホーム（マップ）ページ
export const dynamic = "force-dynamic";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Map from "@/components/Map";
import Tutorial from "@/components/Tutorial";
import Link from "next/link";

export default async function HomePage() {
  const session = await auth();

  const user = await prisma.user.findUnique({
    where: { id: session!.user!.id! },
    select: {
      displayName: true,
      acornBalance: true,
      leafBalance: true,
      goldenAcornBalance: true,
    },
  });

  const acorns = user?.acornBalance ?? 0;
  const leaves = user?.leafBalance ?? 0;
  const golden = user?.goldenAcornBalance ?? 0;

  return (
    <div className="flex flex-col h-full">
      {/* チュートリアル（新規ユーザー向け） */}
      <Tutorial />

      {/* ヘッダー */}
      <header className="bg-green-600 text-white px-4 py-3 flex items-center justify-between z-10 flex-none">
        <div>
          <p className="text-xs opacity-75">
            こんにちは、{user?.displayName ?? "ゲスト"}さん
          </p>
          <h1 className="text-lg font-bold leading-tight">🌰 どんぐり</h1>
        </div>
        <Link href="/wallet" className="flex gap-3 text-sm hover:opacity-90">
          <div className="text-center">
            <div className="text-lg font-bold tabular-nums">{acorns}</div>
            <div className="text-xs opacity-75">🌰</div>
          </div>
          {leaves > 0 && (
            <div className="text-center">
              <div className="text-lg font-bold tabular-nums">{leaves}</div>
              <div className="text-xs opacity-75">🍃</div>
            </div>
          )}
          {golden > 0 && (
            <div className="text-center">
              <div className="text-lg font-bold tabular-nums">{golden}</div>
              <div className="text-xs opacity-75">✨</div>
            </div>
          )}
        </Link>
      </header>

      {/* 地図（残り全体に広がる） */}
      <div className="flex-1 min-h-0">
        <Map />
      </div>
    </div>
  );
}
