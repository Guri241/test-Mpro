-- DropIndex
DROP INDEX "public"."Response_sessionId_itemId_key";

-- AlterTable
ALTER TABLE "public"."Response" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- CreateIndex
CREATE INDEX "Response_sessionId_itemId_createdAt_idx" ON "public"."Response"("sessionId", "itemId", "createdAt");
