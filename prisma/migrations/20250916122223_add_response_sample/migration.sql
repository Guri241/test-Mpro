-- CreateTable
CREATE TABLE "public"."ResponseSample" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "remark" TEXT,
    "sampledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ResponseSample_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ResponseSample_sessionId_itemId_sampledAt_idx" ON "public"."ResponseSample"("sessionId", "itemId", "sampledAt");

-- CreateIndex
CREATE INDEX "Response_sessionId_itemId_createdAt_idx" ON "public"."Response"("sessionId", "itemId", "createdAt");

-- AddForeignKey
ALTER TABLE "public"."ResponseSample" ADD CONSTRAINT "ResponseSample_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "public"."Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ResponseSample" ADD CONSTRAINT "ResponseSample_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "public"."TemplateItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
