// GET/PUT 自分のプロフィール
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logError } from "@/lib/log";

// GET: 自分のプロフィールを取得
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ ok: false, message: "ログインが必要です" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        displayName: true,
        acornBalance: true,
        leafBalance: true,
        goldenAcornBalance: true,
        lastBoiledAt: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ ok: false, message: "ユーザーが見つかりません" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, data: user });
  } catch (error) {
    logError("プロフィール取得エラー", error);
    return NextResponse.json({ ok: false, message: "サーバーエラーが発生しました" }, { status: 500 });
  }
}

// PUT: 自分のプロフィールを更新
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ ok: false, message: "ログインが必要です" }, { status: 401 });
    }

    const body = await request.json();
    const { displayName } = body;

    if (!displayName || typeof displayName !== "string" || displayName.trim().length === 0) {
      return NextResponse.json({ ok: false, message: "表示名を入力してください" }, { status: 400 });
    }

    if (displayName.trim().length > 50) {
      return NextResponse.json({ ok: false, message: "表示名は50文字以内で入力してください" }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: { displayName: displayName.trim() },
      select: {
        id: true,
        email: true,
        displayName: true,
      },
    });

    return NextResponse.json({ ok: true, data: updatedUser, message: "プロフィールを更新しました" });
  } catch (error) {
    logError("プロフィール更新エラー", error);
    return NextResponse.json({ ok: false, message: "サーバーエラーが発生しました" }, { status: 500 });
  }
}
