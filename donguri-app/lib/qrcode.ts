// QRコード生成・検証ロジック

import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { logError } from "@/lib/log";

/**
 * 新しいQRコードトークンを生成する
 * @returns UUID形式のトークン文字列
 */
export function generateQrToken(): string {
  return crypto.randomUUID();
}

/**
 * QRコードの有効期限（現在時刻から10分後）を返す
 * QRコード共有・転送攻撃を防止するため短い有効期限を設定
 */
export function getQrExpiry(): Date {
  return new Date(Date.now() + 10 * 60 * 1000); // 10分後
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
    // 店舗をDBから取得（承認済み店舗のみ）
    const shop = await prisma.shop.findFirst({
      where: {
        id: shopId,
        qrCodeToken: qrToken,
        status: "approved",
      },
    });

    // トークンが存在しない、または未承認の場合
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
    logError("QRトークン検証エラー", error);
    return { valid: false, reason: "QRコードの検証中にエラーが発生しました" };
  }
}

/**
 * 店舗のQRコードトークンを更新する（定期的に呼び出す）
 * @param shopId 店舗ID
 * @returns 新しいトークンと有効期限
 */
export async function refreshQrToken(shopId: string): Promise<{ qrCodeToken: string; qrExpiresAt: Date }> {
  const qrCodeToken = generateQrToken();
  const qrExpiresAt = getQrExpiry();

  await prisma.shop.update({
    where: { id: shopId },
    data: { qrCodeToken, qrExpiresAt },
  });

  return { qrCodeToken, qrExpiresAt };
}
