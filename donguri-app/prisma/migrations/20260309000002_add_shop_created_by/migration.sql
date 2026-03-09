-- AlterTable
ALTER TABLE "Shop" ADD COLUMN "createdBy" TEXT;

-- AddForeignKey
ALTER TABLE "Shop" ADD CONSTRAINT "Shop_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
