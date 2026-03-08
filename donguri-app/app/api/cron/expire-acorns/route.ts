// 毎日深夜0時に実行されるcronジョブ: 期限切れどんぐりを消滅させる
// Vercelのcron設定（vercel.json）から呼び出される
import { NextRequest, NextResponse } from "next/server";
import { expireAcorns } from "@/lib/token";

export async function GET(request: NextRequest) {
  try {
    // Vercel cronからのリクエストを検証（本番環境のみ）
    const authHeader = request.headers.get("authorization");
    if (
      process.env.NODE_ENV === "production" &&
      authHeader !== `Bearer ${process.env.CRON_SECRET}`
    ) {
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
