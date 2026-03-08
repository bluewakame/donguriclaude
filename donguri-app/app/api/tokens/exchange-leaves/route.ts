// POST: 葉っぱ→どんぐり交換
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { exchangeLeaves } from "@/lib/token";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ ok: false, message: "ログインが必要です" }, { status: 401 });
    }

    const body = await request.json();
    const { leafAmount } = body;

    // バリデーション
    if (typeof leafAmount !== "number" || leafAmount <= 0 || !Number.isInteger(leafAmount)) {
      return NextResponse.json({ ok: false, message: "葉っぱの枚数が無効です" }, { status: 400 });
    }

    if (leafAmount % 10 !== 0) {
      return NextResponse.json({
        ok: false,
        message: "葉っぱは10枚単位で交換できます",
      }, { status: 400 });
    }

    const result = await exchangeLeaves(session.user.id, leafAmount);

    return NextResponse.json({
      ok: true,
      leafSpent: result.leafSpent,
      acornGained: result.acornGained,
      newLeafBalance: result.newLeafBalance,
      newAcornBalance: result.newAcornBalance,
      message: `葉っぱ${result.leafSpent}枚をどんぐり${result.acornGained}個と交換しました！`,
    });
  } catch (error) {
    // ビジネスロジックエラーは400で返す
    if (error instanceof Error) {
      return NextResponse.json({ ok: false, message: error.message }, { status: 400 });
    }
    console.error("葉っぱ交換エラー:", error);
    return NextResponse.json({ ok: false, message: "サーバーエラーが発生しました" }, { status: 500 });
  }
}
