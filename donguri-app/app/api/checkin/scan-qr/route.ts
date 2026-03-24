// POST: QRスキャンでどんぐり獲得
export const dynamic = 'force-dynamic';
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
    const { shopId, qrToken, latitude, longitude } = body;

    // バリデーション
    if (!shopId || typeof shopId !== "string") {
      return NextResponse.json({ ok: false, message: "店舗IDが無効です" }, { status: 400 });
    }
    if (!qrToken || typeof qrToken !== "string") {
      return NextResponse.json({ ok: false, message: "QRトークンが無効です" }, { status: 400 });
    }

    // 位置情報は必須（位置偽装防止のためサーバー側で必ず検証）
    if (typeof latitude !== "number" || typeof longitude !== "number") {
      return NextResponse.json({ ok: false, message: "位置情報が必要です。位置情報の利用を許可してください" }, { status: 400 });
    }
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return NextResponse.json({ ok: false, message: "位置情報の値が範囲外です" }, { status: 400 });
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

    // サーバー側で位置情報を検証
    const fullShop = await prisma.shop.findUnique({
      where: { id: shopId },
      select: { latitude: true, longitude: true, radiusMeters: true },
    });
    if (fullShop) {
      const { haversineDistance } = await import("@/lib/haversine");
      const distance = haversineDistance(latitude, longitude, fullShop.latitude, fullShop.longitude);
      if (distance > fullShop.radiusMeters) {
        return NextResponse.json({
          ok: false,
          message: `店舗の近くにいません（現在地と店舗の距離: ${Math.round(distance)}m）`,
        });
      }
    }

    // 金のどんぐりの抽選（サーバー側でのみ実行）
    const isGolden = drawGoldenAcorn(shop.goldenProbability);

    // どんぐりを付与（トランザクション内で同日チェック + 付与を一括処理）
    // VisitLog のユニーク制約 [userId, shopId, visitDate] で二重来店を防止
    try {
      await awardAcorns(session.user.id, shopId, shop.acornAmount, isGolden);
    } catch (error: unknown) {
      const e = error as { code?: string };
      if (e.code === "P2002") {
        return NextResponse.json({
          ok: false,
          message: "本日はすでにこの店舗でどんぐりを獲得済みです（1日1回まで）",
        });
      }
      throw error;
    }

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
