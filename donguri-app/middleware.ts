// Next.js Middleware: 認証チェックの共通化
// NextAuth v5 の auth() を使用してJWTを検証する。
// getToken (next-auth/jwt) はv5でクッキー名やシークレットの扱いが異なるため使用しない。
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

// 認証不要な公開パス
const PUBLIC_PATHS = [
  "/api/auth",        // NextAuth ハンドラ・登録
  "/api/shops",       // 公開店舗一覧
  "/api/cron",        // cron（独自の認証あり）
];

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // API ルート以外はスキップ
  if (!pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // 公開パスはスキップ
  for (const publicPath of PUBLIC_PATHS) {
    if (pathname.startsWith(publicPath)) {
      return NextResponse.next();
    }
  }

  // auth() が注入した認証情報を確認
  if (!req.auth) {
    return NextResponse.json(
      { ok: false, message: "ログインが必要です" },
      { status: 401 }
    );
  }

  return NextResponse.next();
});

export const config = {
  // API ルートのみに適用
  matcher: ["/api/:path*"],
};
