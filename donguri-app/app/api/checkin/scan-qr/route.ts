// POST: QRスキャンでどんぐり獲得
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { verifyQrToken } from "@/lib/qrcode";
import { awardAcorns, drawGoldenAcorn } from "@/lib/token";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ ok: false, message: "ログインが必要です" }, { status: 401 });
    }

    const body = await request.json();
    const { shopId, qrToken } = body;

    // バリデーション
    if (!shopId || typeof shopId !== "string") {
      return NextResponse.json({ ok: false, message: "店舗IDが無効です" }, { status: 400 });
    }
    if (!qrToken || typeof qrToken !== "string") {
      return NextResponse.json({ ok: false, message: "QRトークンが無効です" }, { status: 400 });
    }

    // 同じ店に同日来店済みか確認（1日1回制限）
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const alreadyVisitedToday = await prisma.visitLog.findFirst({
      where: {
        userId: session.user.id,
        shopId,
        visitedAt: { gte: today },
      },
    });

    if (alreadyVisitedToday) {
      return NextResponse.json({
        ok: false,
        message: "本日はすでにこの店舗でどんぐりを獲得済みです（1日1回まで）",
      });
    }

    // QRトークンを検証
    const verification = await verifyQrToken(shopId, qrToken);

    if (!verification.valid || !verification.shop) {
      return NextResponse.json({
        ok: false,
        message: verification.reason ?? "QRコードが無効です",
      });
    }

    const { shop } = verification;

    // 金のどんぐりの抽選（サーバー側でのみ実行）
    const isGolden = drawGoldenAcorn(shop.goldenProbability);

    // どんぐりを付与
    await awardAcorns(session.user.id, shopId, shop.acornAmount, isGolden);

    // 最新の残高を取得
    const updatedUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { acornBalance: true, goldenAcornBalance: true },
    });

    const newBalance = isGolden
      ? (updatedUser?.goldenAcornBalance ?? 0)
      : (updatedUser?.acornBalance ?? 0);

    const earnedAmount = isGolden ? 1 : shop.acornAmount;
    const tokenLabel = isGolden ? "金のどんぐり" : "どんぐり";

    return NextResponse.json({
      ok: true,
      acornEarned: earnedAmount,
      isGolden,
      newBalance,
      message: `${tokenLabel}を${earnedAmount}個獲得しました！${isGolden ? "✨ラッキー！" : ""}`,
    });
  } catch (error) {
    console.error("QRスキャンエラー:", error);
    return NextResponse.json({ ok: false, message: "サーバーエラーが発生しました" }, { status: 500 });
  }
}
