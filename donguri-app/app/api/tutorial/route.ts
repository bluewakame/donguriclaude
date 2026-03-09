// POST チュートリアル完了をDBに保存
export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ ok: false, message: "ログインが必要です" }, { status: 401 });
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: { tutorialDone: true },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("チュートリアル完了保存エラー:", error);
    return NextResponse.json({ ok: false, message: "サーバーエラーが発生しました" }, { status: 500 });
  }
}
