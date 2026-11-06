-- A reporter may keep one active report per piece of content. Closed reports
-- remain as moderation history and do not prevent a later report.
CREATE UNIQUE INDEX "ModerationReport_active_article_reporter_key"
ON "ModerationReport" ("reporterId", "articleId")
WHERE "articleId" IS NOT NULL AND "status" IN ('OPEN', 'REVIEWED');

CREATE UNIQUE INDEX "ModerationReport_active_discussion_reporter_key"
ON "ModerationReport" ("reporterId", "discussionId")
WHERE "discussionId" IS NOT NULL AND "status" IN ('OPEN', 'REVIEWED');

CREATE UNIQUE INDEX "ModerationReport_active_comment_reporter_key"
ON "ModerationReport" ("reporterId", "commentId")
WHERE "commentId" IS NOT NULL AND "status" IN ('OPEN', 'REVIEWED');
