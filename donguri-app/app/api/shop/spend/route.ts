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

  const now = new Date();

  if (itemKey === "boost") {
    // どんぐり+5個（残高確認と更新をトランザクション内で一括処理）
    const expiresAt = new Date(now.getTime() + ACORN_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
    try {
      await prisma.$transaction(async (tx) => {
        const user = await tx.user.findUnique({ where: { id: userId } });
        if (!user) throw Object.assign(new Error("ユーザーが見つかりません"), { code: "NOT_FOUND" });
        if (user.goldenAcornBalance < item.goldCost) {
          throw Object.assign(new Error(`金のどんぐりが足りません（必要: ${item.goldCost}個）`), { code: "INSUFFICIENT" });
        }
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
    } catch (err: unknown) {
      const e = err as { code?: string; message?: string };
      if (e.code === "NOT_FOUND") return NextResponse.json({ ok: false, error: e.message }, { status: 404 });
      if (e.code === "INSUFFICIENT") return NextResponse.json({ ok: false, error: e.message }, { status: 400 });
      throw err;
    }
    return NextResponse.json({ ok: true, message: "🌰 どんぐりを5個獲得しました！" });
  }

  if (itemKey === "leaves") {
    // 葉っぱ+10枚（残高確認と更新をトランザクション内で一括処理）
    try {
      await prisma.$transaction(async (tx) => {
        const user = await tx.user.findUnique({ where: { id: userId } });
        if (!user) throw Object.assign(new Error("ユーザーが見つかりません"), { code: "NOT_FOUND" });
        if (user.goldenAcornBalance < item.goldCost) {
          throw Object.assign(new Error(`金のどんぐりが足りません（必要: ${item.goldCost}個）`), { code: "INSUFFICIENT" });
        }
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
    } catch (err: unknown) {
      const e = err as { code?: string; message?: string };
      if (e.code === "NOT_FOUND") return NextResponse.json({ ok: false, error: e.message }, { status: 404 });
      if (e.code === "INSUFFICIENT") return NextResponse.json({ ok: false, error: e.message }, { status: 400 });
      throw err;
    }
    return NextResponse.json({ ok: true, message: "🍃 葉っぱを10枚獲得しました！" });
  }

  if (itemKey === "shield") {
    // シールド: 24時間どんぐりを守る（残高確認と更新をトランザクション内で一括処理）
    const shieldHours = 24;
    const extendMs = shieldHours * 60 * 60 * 1000;
    const shieldExpiresAt = new Date(now.getTime() + extendMs);

    try {
      await prisma.$transaction(async (tx) => {
        const user = await tx.user.findUnique({ where: { id: userId } });
        if (!user) throw Object.assign(new Error("ユーザーが見つかりません"), { code: "NOT_FOUND" });
        if (user.goldenAcornBalance < item.goldCost) {
          throw Object.assign(new Error(`金のどんぐりが足りません（必要: ${item.goldCost}個）`), { code: "INSUFFICIENT" });
        }

        // 期限切れでないどんぐりの有効期限を24時間延長（rawで一括更新）
        await tx.$executeRaw`
          UPDATE "AcornExpiry"
          SET "expiresAt" = "expiresAt" + ${extendMs} * interval '1 millisecond'
          WHERE "userId" = ${userId} AND "isExpired" = false
        `;

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
    } catch (err: unknown) {
      const e = err as { code?: string; message?: string };
      if (e.code === "NOT_FOUND") return NextResponse.json({ ok: false, error: e.message }, { status: 404 });
      if (e.code === "INSUFFICIENT") return NextResponse.json({ ok: false, error: e.message }, { status: 400 });
      throw err;
    }

    return NextResponse.json({
      ok: true,
      message: `🛡️ シールド発動！すべてのどんぐりの有効期限が${shieldHours}時間延長されました（${shieldExpiresAt.toLocaleString("ja-JP")}まで）`,
    });
  }

  return NextResponse.json({ ok: false, error: "不明なエラー" }, { status: 500 });
}
