// PATCH: ユーザーのロールを変更（admin専用）
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const VALID_ROLES = ["user", "merchant", "admin"] as const;
type Role = typeof VALID_ROLES[number];

export async function PATCH(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const session = await auth();
    const role = (session?.user as Record<string, unknown> | undefined)?.role as string | undefined;
    if (!session?.user?.id || role !== "admin") {
      return NextResponse.json({ ok: false, message: "管理者権限が必要です" }, { status: 403 });
    }

    const { userId } = params;
    const body = await request.json();
    const { role: newRole } = body as { role: string };

    if (!newRole || !VALID_ROLES.includes(newRole as Role)) {
      return NextResponse.json(
        { ok: false, message: "roleは user, merchant, admin のいずれかを指定してください" },
        { status: 400 }
      );
    }

    // 自分自身のロールは変更不可（ロックアウト防止）
    if (userId === session.user.id) {
      return NextResponse.json(
        { ok: false, message: "自分自身のロールは変更できません" },
        { status: 400 }
      );
    }

    const targetUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!targetUser) {
      return NextResponse.json({ ok: false, message: "ユーザーが見つかりません" }, { status: 404 });
    }

    if (targetUser.role === newRole) {
      return NextResponse.json({ ok: false, message: "すでにそのロールが設定されています" }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role: newRole },
      select: { id: true, email: true, displayName: true, role: true },
    });

    return NextResponse.json({
      ok: true,
      data: updatedUser,
      message: `ロールを ${newRole} に変更しました`,
    });
  } catch (error) {
    console.error("ロール変更エラー:", error);
    return NextResponse.json({ ok: false, message: "サーバーエラーが発生しました" }, { status: 500 });
  }
}
