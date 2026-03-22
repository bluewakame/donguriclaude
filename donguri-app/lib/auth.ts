// NextAuth.js v5 の設定
import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  // セッション方式: JWTを使用（Credentialsプロバイダーとの互換性のため）
  session: {
    strategy: "jwt",
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
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        // ユーザーをDBから検索
        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user || !user.passwordHash) {
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
    async jwt({ token, user }) {
      if (user) {
        // 初回ログイン時にDBからロールを取得（authorize内はNode.js Runtime）
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { role: true },
        });
        token.role = dbUser?.role ?? "user";
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
