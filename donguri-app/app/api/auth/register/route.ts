// POST: 新規ユーザー登録
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { logError } from "@/lib/log";

// 表示名の最大長
const MAX_DISPLAY_NAME_LENGTH = 50;

export async function POST(request: NextRequest) {
  try {
    // #9: IPベースのレート制限（1IPあたり5回/15分）
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      ?? request.headers.get("x-real-ip")
      ?? "unknown";
    const { allowed } = rateLimit(`register:${ip}`, 5, 15 * 60 * 1000);
    if (!allowed) {
      return NextResponse.json(
        { ok: false, message: "登録リクエストが多すぎます。しばらく経ってからお試しください" },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { email, password, displayName } = body;

    // バリデーション
    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json({ ok: false, message: "メールアドレスが無効です" }, { status: 400 });
    }
    if (!password || typeof password !== "string" || password.length < 8) {
      return NextResponse.json({ ok: false, message: "パスワードは8文字以上で入力してください" }, { status: 400 });
    }
    if (password.length > 128) {
      return NextResponse.json({ ok: false, message: "パスワードは128文字以内で入力してください" }, { status: 400 });
    }
    // 最低限の複雑性: 英字と数字の両方を含むこと
    if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
      return NextResponse.json({ ok: false, message: "パスワードは英字と数字の両方を含めてください" }, { status: 400 });
    }
    // #10: displayName のバリデーション強化
    if (!displayName || typeof displayName !== "string" || displayName.trim().length === 0) {
      return NextResponse.json({ ok: false, message: "表示名を入力してください" }, { status: 400 });
    }
    if (displayName.trim().length > MAX_DISPLAY_NAME_LENGTH) {
      return NextResponse.json({ ok: false, message: `表示名は${MAX_DISPLAY_NAME_LENGTH}文字以内で入力してください` }, { status: 400 });
    }

    // パスワードをハッシュ化（タイミング攻撃防止のため、重複チェック前に実行）
    const passwordHash = await bcrypt.hash(password, 12);

    // ユーザーを作成（ユニーク制約違反で重複を検出）
    try {
      const user = await prisma.user.create({
        data: {
          email: email.toLowerCase(),
          displayName: displayName.trim(),
          passwordHash,
        },
        select: {
          id: true,
          email: true,
          displayName: true,
          createdAt: true,
        },
      });

      return NextResponse.json({
        ok: true,
        data: user,
        message: "アカウントを作成しました",
      }, { status: 201 });
    } catch (error: unknown) {
      const e = error as { code?: string };
      if (e.code === "P2002") {
        // アカウント列挙防止: 重複時も同じ成功メッセージを返す
        return NextResponse.json({
          ok: true,
          data: { email: email.toLowerCase() },
          message: "アカウントを作成しました",
        }, { status: 201 });
      }
      throw error;
    }
  } catch (error) {
    logError("ユーザー登録エラー", error);
    return NextResponse.json({ ok: false, message: "サーバーエラーが発生しました" }, { status: 500 });
  }
}
