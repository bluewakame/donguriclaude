// GET: 加盟店一覧取得（審査状況でフィルタリング可）
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const role = (session?.user as Record<string, unknown> | undefined)?.role as string | undefined;
    if (!session?.user?.id || role !== "admin") {
      return NextResponse.json({ ok: false, message: "管理者権限が必要です" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status"); // "pending" | "approved" | "rejected" | null(全件)

    const shops = await prisma.shop.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ ok: true, data: shops });
  } catch (error) {
    console.error("加盟店一覧取得エラー:", error);
    return NextResponse.json({ ok: false, message: "サーバーエラーが発生しました" }, { status: 500 });
  }
}
