// POST: QRコードトークンを更新する
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { refreshQrToken } from "@/lib/qrcode";
import { logError } from "@/lib/log";

export async function POST(
  _request: NextRequest,
  { params }: { params: { shopId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ ok: false, message: "ログインが必要です" }, { status: 401 });
    }

    const { shopId } = params;

    const shop = await prisma.shop.findUnique({
      where: { id: shopId },
      select: { id: true, createdBy: true, status: true },
    });

    if (!shop) {
      return NextResponse.json({ ok: false, message: "店舗が見つかりません" }, { status: 404 });
    }

    if (shop.createdBy !== session.user.id) {
      return NextResponse.json({ ok: false, message: "この店舗を操作する権限がありません" }, { status: 403 });
    }

    if (shop.status !== "approved") {
      return NextResponse.json({ ok: false, message: "承認済みの店舗のみQRコードを更新できます" }, { status: 400 });
    }

    const { qrCodeToken, qrExpiresAt } = await refreshQrToken(shopId);

    return NextResponse.json({
      ok: true,
      data: { qrCodeToken, qrExpiresAt },
    });
  } catch (error) {
    logError("QRコード更新エラー", error);
    return NextResponse.json({ ok: false, message: "サーバーエラーが発生しました" }, { status: 500 });
  }
}
