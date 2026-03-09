// GET: 自分が登録した店舗の詳細取得 / DELETE: 自分が登録した店舗を削除
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
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
      select: {
        id: true,
        name: true,
        address: true,
        status: true,
        qrCodeToken: true,
        qrExpiresAt: true,
        acornAmount: true,
        createdBy: true,
      },
    });

    if (!shop) {
      return NextResponse.json({ ok: false, message: "店舗が見つかりません" }, { status: 404 });
    }

    if (shop.createdBy !== session.user.id) {
      return NextResponse.json({ ok: false, message: "この店舗を表示する権限がありません" }, { status: 403 });
    }

    return NextResponse.json({ ok: true, data: shop });
  } catch (error) {
    console.error("店舗詳細取得エラー:", error);
    return NextResponse.json({ ok: false, message: "サーバーエラーが発生しました" }, { status: 500 });
  }
}

export async function DELETE(
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
    });

    if (!shop) {
      return NextResponse.json({ ok: false, message: "店舗が見つかりません" }, { status: 404 });
    }

    if (shop.createdBy !== session.user.id) {
      return NextResponse.json({ ok: false, message: "この店舗を削除する権限がありません" }, { status: 403 });
    }

    // 関連する来店履歴を先に削除
    await prisma.visitLog.deleteMany({ where: { shopId } });

    await prisma.shop.delete({ where: { id: shopId } });

    return NextResponse.json({ ok: true, message: "店舗を削除しました" });
  } catch (error) {
    console.error("店舗削除エラー:", error);
    return NextResponse.json({ ok: false, message: "サーバーエラーが発生しました" }, { status: 500 });
  }
}
