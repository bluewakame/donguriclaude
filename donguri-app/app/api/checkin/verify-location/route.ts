// POST: 位置情報で来店判定
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { haversineDistance, isWithinRadius } from "@/lib/haversine";
import { logError } from "@/lib/log";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ ok: false, message: "ログインが必要です" }, { status: 401 });
    }

    const body = await request.json();
    const { shopId, latitude, longitude } = body;

    // バリデーション
    if (!shopId || typeof shopId !== "string") {
      return NextResponse.json({ ok: false, message: "店舗IDが無効です" }, { status: 400 });
    }
    if (typeof latitude !== "number" || typeof longitude !== "number") {
      return NextResponse.json({ ok: false, message: "位置情報が無効です" }, { status: 400 });
    }
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return NextResponse.json({ ok: false, message: "位置情報の値が範囲外です" }, { status: 400 });
    }

    // 店舗を取得
    const shop = await prisma.shop.findUnique({
      where: { id: shopId },
    });

    if (!shop) {
      return NextResponse.json({ ok: false, message: "店舗が見つかりません" }, { status: 404 });
    }

    // 距離を計算
    const distance = haversineDistance(latitude, longitude, shop.latitude, shop.longitude);
    const withinRadius = isWithinRadius(latitude, longitude, shop.latitude, shop.longitude, shop.radiusMeters);

    if (!withinRadius) {
      return NextResponse.json({
        ok: false,
        message: `店舗の近くにいません（現在地と店舗の距離: ${Math.round(distance)}m）`,
      });
    }

    return NextResponse.json({
      ok: true,
      message: "来店が確認されました",
    });
  } catch (error) {
    logError("位置情報チェックインエラー", error);
    return NextResponse.json({ ok: false, message: "サーバーエラーが発生しました" }, { status: 500 });
  }
}
