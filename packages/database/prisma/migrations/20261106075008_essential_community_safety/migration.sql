-- CreateEnum
CREATE TYPE "ModerationAction" AS ENUM ('REPORT_REVIEWED', 'REPORT_DISMISSED', 'CONTENT_HIDDEN');

-- AlterTable
ALTER TABLE "Comment" ADD COLUMN     "hiddenAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "ModerationReport" ADD COLUMN     "commentId" TEXT,
ADD COLUMN     "discussionId" TEXT;

-- CreateTable
CREATE TABLE "ModerationAudit" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "action" "ModerationAction" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ModerationAudit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ModerationAudit_reportId_createdAt_idx" ON "ModerationAudit"("reportId", "createdAt");

-- CreateIndex
CREATE INDEX "Comment_discussionId_hiddenAt_createdAt_idx" ON "Comment"("discussionId", "hiddenAt", "createdAt");

-- AddForeignKey
ALTER TABLE "ModerationReport" ADD CONSTRAINT "ModerationReport_discussionId_fkey" FOREIGN KEY ("discussionId") REFERENCES "Discussion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModerationReport" ADD CONSTRAINT "ModerationReport_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "Comment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModerationAudit" ADD CONSTRAINT "ModerationAudit_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "ModerationReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModerationAudit" ADD CONSTRAINT "ModerationAudit_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
