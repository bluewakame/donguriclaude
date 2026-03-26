// GET: ユーザー一覧取得（admin専用）
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { logError } from "@/lib/log";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const role = (session?.user as Record<string, unknown> | undefined)?.role as string | undefined;
    if (!session?.user?.id || role !== "admin") {
      return NextResponse.json({ ok: false, message: "管理者権限が必要です" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const roleFilter = searchParams.get("role");
    const search = searchParams.get("search");
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "50", 10) || 50));
    const skip = (page - 1) * limit;

    const conditions: Prisma.UserWhereInput[] = [];
    if (roleFilter) {
      conditions.push({ role: roleFilter });
    }
    if (search) {
      conditions.push({
        OR: [
          { displayName: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
        ],
      });
    }

    const where: Prisma.UserWhereInput = conditions.length > 0
      ? { AND: conditions }
      : {};

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          displayName: true,
          role: true,
          acornBalance: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    return NextResponse.json({
      ok: true,
      data: users,
      currentUserId: session.user.id,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    logError("ユーザー一覧取得エラー", error);
    return NextResponse.json({ ok: false, message: "サーバーエラーが発生しました" }, { status: 500 });
  }
}
