-- AlterTable
ALTER TABLE "Shop" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'pending';
ALTER TABLE "Shop" ADD COLUMN "reviewedAt" TIMESTAMP(3);
ALTER TABLE "Shop" ADD COLUMN "reviewNote" TEXT;

-- Update existing shops to 'approved' status (already active shops)
UPDATE "Shop" SET "status" = 'approved' WHERE "status" = 'pending';
