// NextAuth v5 Edge互換設定
// middleware.ts はこのファイルからインポートする（bcryptjs/prisma を含まない）
import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  session: {
    strategy: "jwt" as const,
    maxAge: 24 * 60 * 60,
  },
  callbacks: {
    // Edge Runtime で実行される jwt コールバック:
    // トークンに既に格納された情報をそのまま返す。
    // 初回ログイン時の role 設定や trigger="update" での更新は
    // auth.ts 側のコールバックで処理される。
    async jwt({ token }) {
      return token;
    },
    async session({ session, token }) {
      if (token?.sub) {
        session.user.id = token.sub;
      }
      if (token?.role) {
        (session.user as unknown as Record<string, unknown>).role = token.role as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [], // auth.ts で実際のプロバイダーを追加
} satisfies NextAuthConfig;
