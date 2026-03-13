// 毎日深夜0時に実行されるcronジョブ: 期限切れどんぐりを消滅させる
// Vercelのcron設定（vercel.json）から呼び出される
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { expireAcorns } from "@/lib/token";

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
    if (authHeader !== `Bearer ${cronSecret}`) {
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
    console.error("どんぐり期限切れcronエラー:", error);
    return NextResponse.json({ ok: false, message: "cron実行中にエラーが発生しました" }, { status: 500 });
  }
}
