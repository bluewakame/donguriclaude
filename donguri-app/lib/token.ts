// トークン管理ロジック（どんぐり獲得・ゆでる・交換・消滅）

import { prisma } from "@/lib/prisma";

// どんぐりの有効期限（日数）
const ACORN_EXPIRY_DAYS = 7;

// 葉っぱ→どんぐりの交換レート（葉っぱ10枚 = どんぐり1個）
const LEAVES_PER_ACORN = 10;

/**
 * 金のどんぐりの抽選を行う
 * サーバー側でのみ実行すること
 * @param probability 当選確率（0.1 = 10%）
 * @returns 当選したかどうか
 */
export function drawGoldenAcorn(probability: number): boolean {
  return Math.random() < probability;
}

/**
 * どんぐりをユーザーに付与する（同日来店チェック含む）
 * visitDate のユニーク制約により、同一ユーザー・店舗・日の二重付与を防止
 * @param userId ユーザーID
 * @param shopId 店舗ID
 * @param acornAmount 通常どんぐりの付与数
 * @param isGolden 金のどんぐりかどうか
 */
export async function awardAcorns(
  userId: string,
  shopId: string,
  acornAmount: number,
  isGolden: boolean
): Promise<void> {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + ACORN_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
  const visitDate = now.toISOString().slice(0, 10); // "YYYY-MM-DD"

  await prisma.$transaction(async (tx) => {
    // ユーザーの残高を更新
    if (isGolden) {
      await tx.user.update({
        where: { id: userId },
        data: { goldenAcornBalance: { increment: 1 } },
      });
    } else {
      await tx.user.update({
        where: { id: userId },
        data: { acornBalance: { increment: acornAmount } },
      });
    }

    // 来店履歴を記録（ユニーク制約で同日二重来店を防止）
    await tx.visitLog.create({
      data: {
        userId,
        shopId,
        visitDate,
        acornEarned: isGolden ? 0 : acornAmount,
        isGolden,
      },
    });

    // トークン取引履歴を記録
    await tx.tokenTransaction.create({
      data: {
        userId,
        type: "earn",
        amount: isGolden ? 1 : acornAmount,
        tokenType: isGolden ? "golden_acorn" : "acorn",
        note: `来店ボーナス${isGolden ? "（金のどんぐり！）" : ""}`,
      },
    });

    // 有効期限管理レコードを作成（通常どんぐりのみ）
    if (!isGolden) {
      await tx.acornExpiry.create({
        data: {
          userId,
          amount: acornAmount,
          expiresAt,
        },
      });
    }
  });
}

/**
 * どんぐりをゆでる（有効期限をリセットする）
 * ゆでることで7日間延長される
 * @param userId ユーザーID
 * @returns ゆでたどんぐりの数と新しい有効期限
 */
// ゆでるクールダウン（時間）
const BOIL_COOLDOWN_HOURS = 24;

export async function boilAcorns(
  userId: string
): Promise<{ resetCount: number; newExpiresAt: Date }> {
  const now = new Date();
  const newExpiresAt = new Date(now.getTime() + ACORN_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

  let totalAmount = 0;

  await prisma.$transaction(async (tx) => {
    // クールダウンチェック
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { lastBoiledAt: true },
    });
    if (user?.lastBoiledAt) {
      const cooldownEnd = new Date(user.lastBoiledAt.getTime() + BOIL_COOLDOWN_HOURS * 60 * 60 * 1000);
      if (now < cooldownEnd) {
        const remainingMs = cooldownEnd.getTime() - now.getTime();
        const remainingHours = Math.ceil(remainingMs / (60 * 60 * 1000));
        throw Object.assign(
          new Error(`ゆでるのはまだできません（あと約${remainingHours}時間）`),
          { code: "COOLDOWN" }
        );
      }
    }

    // 期限切れでないどんぐり（ゆでる対象）をトランザクション内で取得
    const validExpiries = await tx.acornExpiry.findMany({
      where: { userId, isExpired: false },
    });

    totalAmount = validExpiries.reduce((sum, e) => sum + e.amount, 0);

    if (totalAmount === 0) {
      return;
    }

    // すべての有効なAcornExpiryの有効期限をリセット
    await tx.acornExpiry.updateMany({
      where: { userId, isExpired: false },
      data: { expiresAt: newExpiresAt },
    });

    // ユーザーの最終ゆで日時を更新
    await tx.user.update({
      where: { id: userId },
      data: { lastBoiledAt: now },
    });

    // トークン取引履歴を記録
    await tx.tokenTransaction.create({
      data: {
        userId,
        type: "boil",
        amount: totalAmount,
        tokenType: "acorn",
        note: `${totalAmount}個のどんぐりをゆでた（有効期限を7日延長）`,
      },
    });
  });

  return { resetCount: totalAmount, newExpiresAt };
}

/**
 * 葉っぱをどんぐりに交換する（10枚 = 1個）
 * @param userId ユーザーID
 * @param leafAmount 交換する葉っぱの枚数
 * @returns 交換結果
 */
export async function exchangeLeaves(
  userId: string,
  leafAmount: number
): Promise<{
  leafSpent: number;
  acornGained: number;
  newLeafBalance: number;
  newAcornBalance: number;
}> {
  // 交換枚数はLEAVES_PER_ACORNの倍数でなければならない
  if (leafAmount % LEAVES_PER_ACORN !== 0) {
    throw new Error(`葉っぱは${LEAVES_PER_ACORN}枚単位で交換できます`);
  }

  const acornGained = Math.floor(leafAmount / LEAVES_PER_ACORN);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + ACORN_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

  const updatedUser = await prisma.$transaction(async (tx) => {
    // ユーザーの残高を確認（トランザクション内で確認・更新を一括処理）
    const user = await tx.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error("ユーザーが見つかりません");
    if (user.leafBalance < leafAmount) {
      throw new Error(`葉っぱが足りません（保有: ${user.leafBalance}枚、必要: ${leafAmount}枚）`);
    }

    // ユーザーの残高を更新
    const updated = await tx.user.update({
      where: { id: userId },
      data: {
        leafBalance: { decrement: leafAmount },
        acornBalance: { increment: acornGained },
      },
    });

    // 有効期限管理レコードを作成
    await tx.acornExpiry.create({
      data: {
        userId,
        amount: acornGained,
        expiresAt,
      },
    });

    // トークン取引履歴（葉っぱ消費）
    await tx.tokenTransaction.create({
      data: {
        userId,
        type: "exchange",
        amount: leafAmount,
        tokenType: "leaf",
        note: `葉っぱ${leafAmount}枚をどんぐり${acornGained}個に交換`,
      },
    });

    // トークン取引履歴（どんぐり獲得）
    await tx.tokenTransaction.create({
      data: {
        userId,
        type: "exchange",
        amount: acornGained,
        tokenType: "acorn",
        note: `葉っぱ${leafAmount}枚をどんぐり${acornGained}個に交換`,
      },
    });

    return updated;
  });

  return {
    leafSpent: leafAmount,
    acornGained,
    newLeafBalance: updatedUser.leafBalance,
    newAcornBalance: updatedUser.acornBalance,
  };
}

/**
 * 有効期限切れのどんぐりを消滅させる（Vercel cronから呼び出す）
 * @returns 消滅させたどんぐりの総数
 */
export async function expireAcorns(): Promise<number> {
  const now = new Date();

  // トランザクション内で取得・更新を一括処理し、二重実行による競合を防ぐ
  let totalExpired = 0;

  await prisma.$transaction(async (tx) => {
    // トランザクション内で期限切れ対象を取得（isExpired: false を再確認）
    const expiredEntries = await tx.acornExpiry.findMany({
      where: {
        isExpired: false,
        expiresAt: { lt: now },
      },
    });

    if (expiredEntries.length === 0) {
      return;
    }

    for (const entry of expiredEntries) {
      // AcornExpiryを期限切れにマーク
      await tx.acornExpiry.update({
        where: { id: entry.id },
        data: { isExpired: true },
      });

      // ユーザーの現在残高を取得し、0未満にならないよう実際の減算額を計算
      const user = await tx.user.findUnique({
        where: { id: entry.userId },
        select: { acornBalance: true },
      });
      const actualDecrement = Math.min(entry.amount, user?.acornBalance ?? 0);

      if (actualDecrement > 0) {
        await tx.user.update({
          where: { id: entry.userId },
          data: { acornBalance: { decrement: actualDecrement } },
        });
      }

      // 取引履歴を記録
      await tx.tokenTransaction.create({
        data: {
          userId: entry.userId,
          type: "expire",
          amount: entry.amount,
          tokenType: "acorn",
          note: `有効期限切れにより消滅${actualDecrement < entry.amount ? `（残高調整: ${entry.amount} → ${actualDecrement}）` : ""}`,
        },
      });

      totalExpired += entry.amount;
    }
  });

  return totalExpired;
}
