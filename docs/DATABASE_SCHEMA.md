# Database Schema

Source of truth: `packages/database/prisma/schema.prisma`; PostgreSQL migrations are in `packages/database/prisma/migrations`.

## Enumerations

| Enum | Values |
| --- | --- |
| `Role` | `MEMBER`, `EDITOR`, `MODERATOR`, `ADMIN` |
| `PublicationStatus` | `DRAFT`, `PUBLISHED`, `ARCHIVED` |
| `DiscussionKind` | `DISCUSSION`, `QUESTION` |
| `ReportStatus` | `OPEN`, `REVIEWED`, `DISMISSED`, `ACTIONED` |

## Models and relationships

| Model | Key fields | Relationships |
| --- | --- | --- |
| `User` | `id` cuid; unique `email`; nullable unique `username`; `passwordHash`; `displayName`; optional `bio`; `role` | authors articles/revisions/discussions/comments; reports; saves articles |
| `Topic` | `id`; unique `slug` and `name`; `description`; nullable `parentId` | self-referential parent/children; article and discussion joins |
| `Article` | `id`; unique `slug`; title, summary, text content, status; author; publish/create/update times | author, topic joins, sources, revisions, reports, saved joins |
| `SavedArticle` | composite `userId, articleId`; `createdAt` | user/article join; both cascade on delete |
| `ArticleTopic` | composite `articleId, topicId` | article/topic many-to-many; both cascade on delete |
| `ArticleSource` | `id`; title, URL, optional licence/access time | article; cascades with article |
| `ArticleRevision` | `id`; title/content snapshot; optional note; author/time | article cascades; author is restrict-on-delete |
| `Discussion` | `id`; unique `slug`; title/body/kind/status; author/times | topic joins and comments; author is restrict-on-delete |
| `DiscussionTopic` | composite `discussionId, topicId` | discussion/topic many-to-many; both cascade on delete |
| `Comment` | `id`; body; author; optional discussion/parent | one-level-or-more reply tree; discussion cascades; author restrict; parent deletion sets child parent to null |
| `ModerationReport` | `id`; reason/status; reporter; optional article | reporter restrict; article deletion sets reference null |

## Constraints and indexes

Primary IDs default to `cuid()`. `User.email`, `User.username`, `Topic.slug`, `Topic.name`, `Article.slug`, and `Discussion.slug` are unique. `ArticleTopic`, `DiscussionTopic`, and `SavedArticle` use composite primary keys.

Explicit indexes: `Topic.parentId`; `Article(status, publishedAt)`; `ArticleTopic.topicId`; `ArticleRevision(articleId, createdAt)`; `Discussion(kind, status, createdAt)`; `ModerationReport(status, createdAt)`; and `SavedArticle.articleId`.

## Migration history

1. `20261104000000_init`: initial enums, tables, constraints, and core indexes.
2. `20261104182205_dockersetup`: makes several author foreign keys restrictive and adds article-topic/revision indexes.
3. `20261105090000_accounts_and_saved_articles`: adds `User.username`, unique username index, and `SavedArticle`.

## Data lifecycle observations

Articles default to drafts and public article, discussion, and topic-association queries filter for `PUBLISHED`. Discussions default to published. Sources and revisions are persisted but lack write endpoints in this API.
