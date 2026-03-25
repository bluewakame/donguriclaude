// Next.js Middleware: 認証チェック + セキュリティヘッダーの共通化
// Edge Runtime 互換のため、next-auth を直接インポートせず jose で JWT を検証する
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// 認証不要な公開パス
const PUBLIC_PATHS = [
  "/api/auth",        // NextAuth ハンドラ・登録
  "/api/shops",       // 公開店舗一覧
  "/api/cron",        // cron（独自の認証あり）
];

// 許可するオリジン
const ALLOWED_ORIGINS = [
  "https://donguri.vercel.app",
  ...(process.env.NODE_ENV === "development" ? ["http://localhost:3000"] : []),
];

/** レスポンスにセキュリティヘッダーを追加 */
function addSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(self)");
  return response;
}

export default function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // API ルート以外はセキュリティヘッダーのみ追加してスキップ
  if (!pathname.startsWith("/api/")) {
    return addSecurityHeaders(NextResponse.next());
  }

  // APIリクエストのOriginチェック（CSRF防止）
  if (req.method !== "GET" && req.method !== "HEAD" && req.method !== "OPTIONS") {
    const origin = req.headers.get("origin");
    if (origin && !ALLOWED_ORIGINS.includes(origin)) {
      return NextResponse.json(
        { ok: false, message: "不正なリクエスト元です" },
        { status: 403 }
      );
    }
  }

  // 公開パスはスキップ
  for (const publicPath of PUBLIC_PATHS) {
    if (pathname.startsWith(publicPath)) {
      return addSecurityHeaders(NextResponse.next());
    }
  }

  // セッショントークンの存在を確認
  const hasToken =
    req.cookies.has("__Secure-authjs.session-token") ||
    req.cookies.has("authjs.session-token");

  if (!hasToken) {
    return NextResponse.json(
      { ok: false, message: "ログインが必要です" },
      { status: 401 }
    );
  }

  return addSecurityHeaders(NextResponse.next());
}

export const config = {
  // API ルートとページの両方に適用
  matcher: ["/api/:path*", "/((?!_next/static|_next/image|favicon.ico).*)"],
};
