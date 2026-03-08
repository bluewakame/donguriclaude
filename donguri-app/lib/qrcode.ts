// QRコード生成・検証ロジック

import crypto from "crypto";
import { prisma } from "@/lib/prisma";

/**
 * 新しいQRコードトークンを生成する
 * @returns UUID形式のトークン文字列
 */
export function generateQrToken(): string {
  return crypto.randomUUID();
}

/**
 * QRコードの有効期限（現在時刻から1時間後）を返す
 */
export function getQrExpiry(): Date {
  return new Date(Date.now() + 60 * 60 * 1000); // 1時間後
}

/**
 * QRトークンを検証する
 * 以下の3条件をすべて確認する:
 * 1. トークンが存在する（対応する店舗がある）
 * 2. 有効期限内である
 * 3. （将来的に）まだ未使用である
 * @param shopId 店舗ID
 * @param qrToken QRコードのトークン文字列
 * @returns 検証結果と店舗情報
 */
export async function verifyQrToken(
  shopId: string,
  qrToken: string
): Promise<{ valid: boolean; reason?: string; shop?: { id: string; name: string; acornAmount: number; goldenProbability: number } }> {
  try {
    // 店舗をDBから取得
    const shop = await prisma.shop.findFirst({
      where: {
        id: shopId,
        qrCodeToken: qrToken,
      },
    });

    // トークンが存在しない場合
    if (!shop) {
      return { valid: false, reason: "無効なQRコードです" };
    }

    // 有効期限を確認
    if (new Date() > shop.qrExpiresAt) {
      return { valid: false, reason: "QRコードの有効期限が切れています" };
    }

    return {
      valid: true,
      shop: {
        id: shop.id,
        name: shop.name,
        acornAmount: shop.acornAmount,
        goldenProbability: shop.goldenProbability,
      },
    };
  } catch (error) {
    console.error("QRトークン検証エラー:", error);
    return { valid: false, reason: "QRコードの検証中にエラーが発生しました" };
  }
}

/**
 * 店舗のQRコードトークンを更新する（定期的に呼び出す）
 * @param shopId 店舗ID
 */
export async function refreshQrToken(shopId: string): Promise<string> {
  const newToken = generateQrToken();
  const newExpiry = getQrExpiry();

  await prisma.shop.update({
    where: { id: shopId },
    data: {
      qrCodeToken: newToken,
      qrExpiresAt: newExpiry,
    },
  });

  return newToken;
}
