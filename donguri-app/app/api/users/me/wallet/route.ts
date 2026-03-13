// GET: ウォレット残高取得
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ ok: false, message: "ログインが必要です" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        acornBalance: true,
        leafBalance: true,
        goldenAcornBalance: true,
        lastBoiledAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ ok: false, message: "ユーザーが見つかりません" }, { status: 404 });
    }

    // もうすぐ期限切れになるどんぐりを取得（3日以内）
    const threeDaysFromNow = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
    const expiringAcorns = await prisma.acornExpiry.findMany({
      where: {
        userId: session.user.id,
        isExpired: false,
        expiresAt: { lte: threeDaysFromNow },
      },
      orderBy: { expiresAt: "asc" },
      take: 5,
    });

    return NextResponse.json({
      ok: true,
      data: {
        acornBalance: user.acornBalance,
        leafBalance: user.leafBalance,
        goldenAcornBalance: user.goldenAcornBalance,
        lastBoiledAt: user.lastBoiledAt,
        expiringAcorns,
      },
    });
  } catch (error) {
    console.error("ウォレット残高取得エラー:", error);
    return NextResponse.json({ ok: false, message: "サーバーエラーが発生しました" }, { status: 500 });
  }
}
