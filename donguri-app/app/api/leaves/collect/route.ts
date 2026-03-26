// 葉っぱ収集API（マップ上で葉っぱを拾う）
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logError } from "@/lib/log";

// 1日あたりの葉っぱ収集上限
const DAILY_LEAF_COLLECT_LIMIT = 50;

// 葉っぱの種類と重み（donguri準拠）
const LEAF_TYPES = [
  { emoji: "🌿", weight: 75, value: 1, label: "葉っぱ" },
  { emoji: "🍂", weight: 20, value: 2, label: "紅葉の葉" },
  { emoji: "🌸", weight: 5, value: 3, label: "花びら（レア！）" },
] as const;

function drawLeafType() {
  const total = LEAF_TYPES.reduce((sum, t) => sum + t.weight, 0);
  let rand = Math.random() * total;
  for (const type of LEAF_TYPES) {
    rand -= type.weight;
    if (rand <= 0) return type;
  }
  return LEAF_TYPES[0];
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { leafId, latitude, longitude } = body;

  if (!leafId || typeof leafId !== "string") {
    return NextResponse.json({ ok: false, error: "leafId が必要です" }, { status: 400 });
  }

  // leafId の形式バリデーション（UUID形式のみ許可し、任意文字列の偽造を防止）
  const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!UUID_REGEX.test(leafId)) {
    return NextResponse.json({ ok: false, error: "leafId の形式が無効です" }, { status: 400 });
  }

  // 位置情報は必須（位置偽装を完全には防げないが、最低限の検証を行う）
  if (typeof latitude !== "number" || typeof longitude !== "number") {
    return NextResponse.json({ ok: false, error: "位置情報が必要です" }, { status: 400 });
  }
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    return NextResponse.json({ ok: false, error: "位置情報の値が範囲外です" }, { status: 400 });
  }

  const userId = session.user.id;

  // 1日あたりの収集数をチェック（JST基準）
  const nowJst = new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Tokyo" });
  const today = new Date(nowJst + "T00:00:00+09:00");

  const todayCollections = await prisma.leafCollection.count({
    where: {
      userId,
      collectedAt: { gte: today },
    },
  });

  if (todayCollections >= DAILY_LEAF_COLLECT_LIMIT) {
    return NextResponse.json({
      ok: false,
      error: `本日の葉っぱ収集上限（${DAILY_LEAF_COLLECT_LIMIT}回）に達しました`,
    }, { status: 429 });
  }

  const leaf = drawLeafType();

  try {
    await prisma.$transaction(async (tx) => {
      // leafId の重複チェック（ユニーク制約で二重収集を防止）
      await tx.leafCollection.create({
        data: {
          id: crypto.randomUUID(),
          userId,
          leafId,
        },
      });

      await tx.user.update({
        where: { id: userId },
        data: { leafBalance: { increment: leaf.value } },
      });

      await tx.tokenTransaction.create({
        data: {
          userId,
          type: "earn",
          amount: leaf.value,
          tokenType: "leaf",
          note: `マップ探索: ${leaf.emoji} ${leaf.label}を拾った${latitude && longitude ? `（緯度: ${Number(latitude).toFixed(4)}, 経度: ${Number(longitude).toFixed(4)}）` : ""}`,
        },
      });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  } catch (error: unknown) {
    // ユニーク制約違反 = 既に収集済み
    const e = error as { code?: string };
    if (e.code === "P2002") {
      return NextResponse.json({
        ok: false,
        error: "この葉っぱはすでに収集済みです",
      }, { status: 409 });
    }
    throw error;
  }

  return NextResponse.json({
    ok: true,
    leaf: {
      emoji: leaf.emoji,
      label: leaf.label,
      value: leaf.value,
      isRare: leaf.value >= 3,
    },
    message: `${leaf.emoji} ${leaf.label}を拾った！（+${leaf.value}枚）`,
  });
}
