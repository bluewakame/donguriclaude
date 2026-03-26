import { PrismaClient } from "@prisma/client";
import crypto from "crypto";

const prisma = new PrismaClient();

async function main() {
  console.log("シードデータを投入しています...");

  // サンプル加盟店データ
  const shops = [
    {
      name: "どんぐり珈琲 渋谷店",
      address: "東京都渋谷区道玄坂1-1-1",
      latitude: 35.6580,
      longitude: 139.7016,
      radiusMeters: 50,
      isPremium: true,
      acornAmount: 3,
      goldenProbability: 0.1,
      qrCodeToken: crypto.randomUUID(),
      qrExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24時間後
      status: "approved" as const,
    },
    {
      name: "森のベーカリー 新宿店",
      address: "東京都新宿区新宿3-1-1",
      latitude: 35.6896,
      longitude: 139.7006,
      radiusMeters: 30,
      isPremium: false,
      acornAmount: 1,
      goldenProbability: 0.05,
      qrCodeToken: crypto.randomUUID(),
      qrExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      status: "approved" as const,
    },
    {
      name: "クヌギ書店 池袋店",
      address: "東京都豊島区東池袋1-1-1",
      latitude: 35.7295,
      longitude: 139.7109,
      radiusMeters: 40,
      isPremium: false,
      acornAmount: 2,
      goldenProbability: 0.08,
      qrCodeToken: crypto.randomUUID(),
      qrExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      status: "approved" as const,
    },
  ];

  for (const shop of shops) {
    await prisma.shop.upsert({
      where: { qrCodeToken: shop.qrCodeToken },
      update: {},
      create: shop,
    });
  }

  console.log("シードデータの投入が完了しました！");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
