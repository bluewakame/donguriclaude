// 葉っぱ収集API（マップ上で葉っぱを拾う）
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

  if (!leafId) {
    return NextResponse.json({ ok: false, error: "leafId が必要です" }, { status: 400 });
  }

  const userId = session.user.id;
  const leaf = drawLeafType();

  await prisma.$transaction(async (tx) => {
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
        note: `マップ探索: ${leaf.emoji} ${leaf.label}を拾った${latitude && longitude ? `（緯度: ${latitude.toFixed(4)}, 経度: ${longitude.toFixed(4)}）` : ""}`,
      },
    });
  });

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
