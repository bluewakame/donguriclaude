// POST: どんぐりをゆでる（有効期限をリセット）
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { boilAcorns } from "@/lib/token";

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ ok: false, message: "ログインが必要です" }, { status: 401 });
    }

    const { resetCount, newExpiresAt } = await boilAcorns(session.user.id);

    if (resetCount === 0) {
      return NextResponse.json({
        ok: false,
        message: "ゆでるどんぐりがありません",
      });
    }

    return NextResponse.json({
      ok: true,
      resetCount,
      newExpiresAt: newExpiresAt.toISOString(),
      message: `${resetCount}個のどんぐりをゆでました！有効期限が7日間延長されました`,
    });
  } catch (error) {
    console.error("どんぐりをゆでるエラー:", error);
    return NextResponse.json({ ok: false, message: "サーバーエラーが発生しました" }, { status: 500 });
  }
}
