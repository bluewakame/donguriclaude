// 毎日深夜0時に実行されるcronジョブ: 期限切れどんぐりを消滅させる
// Vercelのcron設定（vercel.json）から呼び出される
export const dynamic = 'force-dynamic';
import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { expireAcorns } from "@/lib/token";
import { logError } from "@/lib/log";

/** タイミング攻撃を防止する定数時間文字列比較 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    // 長さが異なる場合もダミー比較を実行して時間差を抑える
    crypto.timingSafeEqual(Buffer.from(a), Buffer.from(a));
    return false;
  }
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

export async function GET(request: NextRequest) {
  try {
    // Vercel cronからのリクエストを検証
    // CRON_SECRETが未設定の場合は本番・開発問わず常に拒否する
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret) {
      console.error("CRON_SECRETが設定されていません。cronエンドポイントを無効化します。");
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const authHeader = request.headers.get("authorization");
    const expectedHeader = `Bearer ${cronSecret}`;
    if (!authHeader || !timingSafeEqual(authHeader, expectedHeader)) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const totalExpired = await expireAcorns();

    console.log(`どんぐり期限切れcron実行: ${totalExpired}個を消滅させました`);

    return NextResponse.json({
      ok: true,
      totalExpired,
      message: `${totalExpired}個のどんぐりを消滅させました`,
    });
  } catch (error) {
    logError("どんぐり期限切れcronエラー", error);
    return NextResponse.json({ ok: false, message: "cron実行中にエラーが発生しました" }, { status: 500 });
  }
}
