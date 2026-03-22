-- セキュリティ改善マイグレーション

-- #5: User にロールフィールドを追加
ALTER TABLE "User" ADD COLUMN "role" TEXT NOT NULL DEFAULT 'user';

-- #3: VisitLog に visitDate カラムを追加し、同日来店のユニーク制約を追加
ALTER TABLE "VisitLog" ADD COLUMN "visitDate" TEXT;

-- 既存の VisitLog レコードに visitDate を設定
UPDATE "VisitLog" SET "visitDate" = TO_CHAR("visitedAt", 'YYYY-MM-DD') WHERE "visitDate" IS NULL;

-- visitDate を NOT NULL に変更
ALTER TABLE "VisitLog" ALTER COLUMN "visitDate" SET NOT NULL;

-- 同日来店のユニーク制約
CREATE UNIQUE INDEX "VisitLog_userId_shopId_visitDate_key" ON "VisitLog"("userId", "shopId", "visitDate");

-- #1: 葉っぱ収集記録テーブル（二重収集防止）
CREATE TABLE "LeafCollection" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "leafId" TEXT NOT NULL,
    "collectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeafCollection_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "LeafCollection_userId_leafId_key" ON "LeafCollection"("userId", "leafId");

ALTER TABLE "LeafCollection" ADD CONSTRAINT "LeafCollection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- #4: 残高が負にならないようにCHECK制約を追加
ALTER TABLE "User" ADD CONSTRAINT "User_acornBalance_non_negative" CHECK ("acornBalance" >= 0);
ALTER TABLE "User" ADD CONSTRAINT "User_leafBalance_non_negative" CHECK ("leafBalance" >= 0);
ALTER TABLE "User" ADD CONSTRAINT "User_goldenAcornBalance_non_negative" CHECK ("goldenAcornBalance" >= 0);
