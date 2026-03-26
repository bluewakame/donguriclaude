// GET: 加盟店一覧取得（審査状況でフィルタリング可）
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logError } from "@/lib/log";

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
      select: {
        id: true,
        name: true,
        address: true,
        latitude: true,
        longitude: true,
        radiusMeters: true,
        isPremium: true,
        acornAmount: true,
        goldenProbability: true,
        status: true,
        reviewedAt: true,
        reviewNote: true,
        createdAt: true,
        createdBy: true,
        // qrCodeToken, qrExpiresAt は意図的に除外（秘密情報）
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ ok: true, data: shops });
  } catch (error) {
    logError("加盟店一覧取得エラー", error);
    return NextResponse.json({ ok: false, message: "サーバーエラーが発生しました" }, { status: 500 });
  }
}
