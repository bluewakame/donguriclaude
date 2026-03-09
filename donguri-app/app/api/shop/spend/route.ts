// 金のどんぐりショップ — アイテム購入API
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// ショップアイテム定義
const SHOP_ITEMS = {
  boost: {
    label: "どんぐりブースト",
    goldCost: 1,
    description: "どんぐり+5個",
  },
  leaves: {
    label: "葉っぱ袋",
    goldCost: 2,
    description: "葉っぱ+10枚",
  },
  shield: {
    label: "シールド",
    goldCost: 3,
    description: "24時間どんぐりを守る",
  },
} as const;

type ItemKey = keyof typeof SHOP_ITEMS;

const ACORN_EXPIRY_DAYS = 7;

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const itemKey = body.item as ItemKey;

  if (!itemKey || !(itemKey in SHOP_ITEMS)) {
    return NextResponse.json({ ok: false, error: "無効なアイテムです" }, { status: 400 });
  }

  const item = SHOP_ITEMS[itemKey];
  const userId = session.user.id;

  // ユーザー残高確認
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return NextResponse.json({ ok: false, error: "ユーザーが見つかりません" }, { status: 404 });
  }

  if (user.goldenAcornBalance < item.goldCost) {
    return NextResponse.json(
      { ok: false, error: `金のどんぐりが足りません（必要: ${item.goldCost}個）` },
      { status: 400 }
    );
  }

  const now = new Date();

  if (itemKey === "boost") {
    // どんぐり+5個
    const expiresAt = new Date(now.getTime() + ACORN_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: {
          goldenAcornBalance: { decrement: item.goldCost },
          acornBalance: { increment: 5 },
        },
      });
      await tx.acornExpiry.create({
        data: { userId, amount: 5, expiresAt },
      });
      await tx.tokenTransaction.create({
        data: {
          userId,
          type: "spend",
          amount: item.goldCost,
          tokenType: "golden_acorn",
          note: "ショップ: どんぐりブースト購入",
        },
      });
      await tx.tokenTransaction.create({
        data: {
          userId,
          type: "earn",
          amount: 5,
          tokenType: "acorn",
          note: "ショップ: どんぐりブースト（+5個）",
        },
      });
    });
    return NextResponse.json({ ok: true, message: "🌰 どんぐりを5個獲得しました！" });
  }

  if (itemKey === "leaves") {
    // 葉っぱ+10枚
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: {
          goldenAcornBalance: { decrement: item.goldCost },
          leafBalance: { increment: 10 },
        },
      });
      await tx.tokenTransaction.create({
        data: {
          userId,
          type: "spend",
          amount: item.goldCost,
          tokenType: "golden_acorn",
          note: "ショップ: 葉っぱ袋購入",
        },
      });
      await tx.tokenTransaction.create({
        data: {
          userId,
          type: "earn",
          amount: 10,
          tokenType: "leaf",
          note: "ショップ: 葉っぱ袋（+10枚）",
        },
      });
    });
    return NextResponse.json({ ok: true, message: "🍃 葉っぱを10枚獲得しました！" });
  }

  if (itemKey === "shield") {
    // シールド: 24時間どんぐりを守る（有効期限を24時間延長）
    const shieldHours = 24;
    const extendMs = shieldHours * 60 * 60 * 1000;
    const shieldExpiresAt = new Date(now.getTime() + extendMs);

    await prisma.$transaction(async (tx) => {
      // 期限切れでないどんぐりの有効期限を24時間延長
      const validExpiries = await tx.acornExpiry.findMany({
        where: { userId, isExpired: false },
      });

      for (const expiry of validExpiries) {
        const newExpiry = new Date(expiry.expiresAt.getTime() + extendMs);
        await tx.acornExpiry.update({
          where: { id: expiry.id },
          data: { expiresAt: newExpiry },
        });
      }

      await tx.user.update({
        where: { id: userId },
        data: { goldenAcornBalance: { decrement: item.goldCost } },
      });

      await tx.tokenTransaction.create({
        data: {
          userId,
          type: "spend",
          amount: item.goldCost,
          tokenType: "golden_acorn",
          note: `ショップ: シールド購入（有効期限+${shieldHours}時間）`,
        },
      });
    });

    return NextResponse.json({
      ok: true,
      message: `🛡️ シールド発動！すべてのどんぐりの有効期限が${shieldHours}時間延長されました（${shieldExpiresAt.toLocaleString("ja-JP")}まで）`,
    });
  }

  return NextResponse.json({ ok: false, error: "不明なエラー" }, { status: 500 });
}
