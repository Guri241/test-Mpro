/*
  Warnings:

  - A unique constraint covering the columns `[sessionId,itemId]` on the table `Response` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "public"."Response_sessionId_itemId_createdAt_idx";

-- CreateIndex
CREATE UNIQUE INDEX "Response_sessionId_itemId_key" ON "public"."Response"("sessionId", "itemId");
