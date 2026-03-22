// Next.js Middleware: 認証チェックの共通化
// 認証が不要な公開ルートを明示的にホワイトリスト管理し、
// 新規APIルート追加時の認証チェック漏れを防止する
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// 認証不要な公開パス
const PUBLIC_PATHS = [
  "/api/auth",        // NextAuth ハンドラ・登録
  "/api/shops",       // 公開店舗一覧
  "/api/cron",        // cron（独自の認証あり）
];

// 静的アセット・ページは対象外
const API_PREFIX = "/api/";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // API ルート以外はスキップ
  if (!pathname.startsWith(API_PREFIX)) {
    return NextResponse.next();
  }

  // 公開パスはスキップ
  for (const publicPath of PUBLIC_PATHS) {
    if (pathname.startsWith(publicPath)) {
      return NextResponse.next();
    }
  }

  // JWT トークンの存在を検証
  const token = await getToken({ req: request });
  if (!token) {
    return NextResponse.json(
      { ok: false, message: "ログインが必要です" },
      { status: 401 }
    );
  }

  return NextResponse.next();
}

export const config = {
  // API ルートのみに適用
  matcher: ["/api/:path*"],
};
