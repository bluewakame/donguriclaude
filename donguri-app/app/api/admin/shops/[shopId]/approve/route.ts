// POST: 加盟店の審査承認・却下
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: { shopId: string } }
) {
  try {
    const session = await auth();
    const role = (session?.user as Record<string, unknown> | undefined)?.role as string | undefined;
    if (!session?.user?.id || role !== "admin") {
      return NextResponse.json({ ok: false, message: "管理者権限が必要です" }, { status: 403 });
    }

    const { shopId } = params;
    const body = await request.json();
    const { action, reviewNote } = body; // action: "approve" | "reject"

    if (action !== "approve" && action !== "reject") {
      return NextResponse.json({ ok: false, message: "actionは approve または reject を指定してください" }, { status: 400 });
    }

    const shop = await prisma.shop.findUnique({ where: { id: shopId } });
    if (!shop) {
      return NextResponse.json({ ok: false, message: "加盟店が見つかりません" }, { status: 404 });
    }
    if (shop.status !== "pending") {
      return NextResponse.json({ ok: false, message: "この加盟店はすでに審査が完了しています" }, { status: 400 });
    }

    const updatedShop = await prisma.shop.update({
      where: { id: shopId },
      data: {
        status: action === "approve" ? "approved" : "rejected",
        reviewedAt: new Date(),
        reviewNote: reviewNote ?? null,
      },
    });

    const message = action === "approve"
      ? "加盟店を承認しました"
      : "加盟店の申請を却下しました";

    return NextResponse.json({ ok: true, data: updatedShop, message });
  } catch (error) {
    console.error("加盟店審査エラー:", error);
    return NextResponse.json({ ok: false, message: "サーバーエラーが発生しました" }, { status: 500 });
  }
}
