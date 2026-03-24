// NextAuth.js v5 の設定
import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  // セッション方式: JWTを使用（Credentialsプロバイダーとの互換性のため）
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24時間でセッション失効
  },
  providers: [
    // Googleログイン
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    // メール＋パスワードログイン
    CredentialsProvider({
      name: "メールアドレス",
      credentials: {
        email: { label: "メールアドレス", type: "email" },
        password: { label: "パスワード", type: "password" },
      },
      async authorize(credentials, request) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        // ログインレート制限: メールアドレスごとに10回/15分
        const emailKey = `login:${(credentials.email as string).toLowerCase()}`;
        const { allowed: emailAllowed } = rateLimit(emailKey, 10, 15 * 60 * 1000);
        if (!emailAllowed) {
          throw new Error("ログイン試行回数が上限を超えました。しばらく経ってからお試しください");
        }

        // ユーザーをDBから検索
        const user = await prisma.user.findUnique({
          where: { email: (credentials.email as string).toLowerCase() },
        });

        if (!user || !user.passwordHash) {
          // タイミング攻撃防止: ユーザーが存在しなくてもbcrypt比較と同等の遅延を発生
          await bcrypt.hash("dummy-timing-pad", 12);
          return null;
        }

        // パスワードを検証
        const isValidPassword = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        );

        if (!isValidPassword) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.displayName,
        };
      },
    }),
  ],
  callbacks: {
    // JWTにユーザーIDとロールを追加
    // 注意: このコールバックはミドルウェア（Edge Runtime）でも実行されるため
    // Prisma等のNode.js専用モジュールは使用できない
    async jwt({ token, user, trigger }) {
      if (user) {
        // 初回ログイン時にDBからロールを取得（authorize内はNode.js Runtime）
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { role: true, roleUpdatedAt: true },
        });
        token.role = dbUser?.role ?? "user";
        token.roleUpdatedAt = dbUser?.roleUpdatedAt?.getTime() ?? 0;
      }

      // セッション更新時にロール変更をチェック（role変更の即時反映）
      if (trigger === "update" && token.sub) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.sub },
          select: { role: true, roleUpdatedAt: true },
        });
        if (dbUser) {
          token.role = dbUser.role;
          token.roleUpdatedAt = dbUser.roleUpdatedAt?.getTime() ?? 0;
        }
      }

      // token.sub はNextAuthが自動的にユーザーIDを設定する
      return token;
    },
    // セッションにユーザーIDとロールを追加
    async session({ session, token }) {
      // token.sub はNextAuth v5が自動設定するユーザーID
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
});

// セッションからユーザーIDを取得するヘルパー関数
export async function getCurrentUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}
