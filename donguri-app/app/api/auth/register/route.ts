// POST: 新規ユーザー登録
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, displayName } = body;

    // バリデーション
    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json({ ok: false, message: "メールアドレスが無効です" }, { status: 400 });
    }
    if (!password || typeof password !== "string" || password.length < 8) {
      return NextResponse.json({ ok: false, message: "パスワードは8文字以上で入力してください" }, { status: 400 });
    }
    if (!displayName || typeof displayName !== "string" || displayName.trim().length === 0) {
      return NextResponse.json({ ok: false, message: "表示名を入力してください" }, { status: 400 });
    }

    // メールアドレスの重複チェック
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return NextResponse.json({ ok: false, message: "このメールアドレスはすでに登録されています" }, { status: 409 });
    }

    // パスワードをハッシュ化
    const passwordHash = await bcrypt.hash(password, 12);

    // ユーザーを作成
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
  } catch (error) {
    console.error("ユーザー登録エラー:", error);
    return NextResponse.json({ ok: false, message: "サーバーエラーが発生しました" }, { status: 500 });
  }
}
