// POST: 加盟店登録申請 / GET: 自分が登録した店舗一覧
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateQrToken, getQrExpiry } from "@/lib/qrcode";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ ok: false, message: "ログインが必要です" }, { status: 401 });
    }

    const shops = await prisma.shop.findMany({
      where: { createdBy: session.user.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ ok: true, data: shops });
  } catch (error) {
    console.error("店舗一覧取得エラー:", error);
    return NextResponse.json({ ok: false, message: "サーバーエラーが発生しました" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ ok: false, message: "ログインが必要です" }, { status: 401 });
    }

    const body = await request.json();
    const { name, address, latitude, longitude } = body;

    // バリデーション
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json({ ok: false, message: "店舗名を入力してください" }, { status: 400 });
    }
    if (!address || typeof address !== "string" || address.trim().length === 0) {
      return NextResponse.json({ ok: false, message: "住所を入力してください" }, { status: 400 });
    }
    if (typeof latitude !== "number" || typeof longitude !== "number") {
      return NextResponse.json({ ok: false, message: "位置情報が無効です" }, { status: 400 });
    }

    // QRコードトークンを生成
    const qrCodeToken = generateQrToken();
    const qrExpiresAt = getQrExpiry();

    const shop = await prisma.shop.create({
      data: {
        name: name.trim(),
        address: address.trim(),
        latitude,
        longitude,
        qrCodeToken,
        qrExpiresAt,
        status: "pending",
        createdBy: session.user.id,
      },
    });

    return NextResponse.json({
      ok: true,
      data: shop,
      message: "加盟店の登録申請を受け付けました",
    }, { status: 201 });
  } catch (error) {
    console.error("加盟店登録エラー:", error);
    return NextResponse.json({ ok: false, message: "サーバーエラーが発生しました" }, { status: 500 });
  }
}
