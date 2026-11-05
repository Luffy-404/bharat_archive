# API Documentation

Base URL: `NEXT_PUBLIC_API_URL`, default `http://localhost:4000/api`. Swagger is exposed at `/api/docs`. Bodies are JSON. Validation rejects undeclared fields. Protected routes require `Authorization: Bearer <accessToken>`.

## Authentication and account

| Method/path | Access | Request | Response/behaviour |
| --- | --- | --- | --- |
| `POST /auth/register` | Public | `email`, `password` 10–128 chars, `displayName` 2–80 chars | JWT and `{id,email,role,displayName}`; duplicate email returns 403 |
| `POST /auth/login` | Public | `email`, `password` | Same token payload; invalid credentials return 401 |
| `GET /account/me` | Bearer | — | Account-safe selected fields |
| `PATCH /account/settings` | Bearer | required `displayName`; optional lowercase-hyphen `username`; optional `bio` <=280 | Updated selected fields; unavailable username maps to 403 |
| `GET /account/articles` | Bearer | — | Caller’s articles, including statuses |
| `GET /account/saved` | Bearer | — | Saved-article join records with article, author, and topic data |
| `POST /account/saved/:articleId` | Bearer | — | Creates/idempotently returns save for published article |
| `PATCH /account/saved/:articleId` | Bearer | — | Deletes matching save(s), returns `{saved:false}` |

## Content

| Method/path | Access | Request/query | Response/behaviour |
| --- | --- | --- | --- |
| `GET /topics` | Public | — | Topics with parent and children, name ascending |
| `GET /topics/:slug` | Public | — | Topic, hierarchy, linked articles/discussions and authors; 404 if absent |
| `GET /articles` | Public | optional `page` (15/page) | Published articles, author, topics; newest published first |
| `GET /articles/:slug` | Public | — | Published article with author, topics, sources, revisions; 404 otherwise |
| `POST /articles` | Editor/Moderator/Admin | `title`, `slug`, `summary`, `content`, optional `topicIds`, optional `status` | Creates article, defaults to draft; sets publish time only for initially published status |
| `PATCH /articles/:id` | Bearer author or editorial role | Same required `ArticleDto` fields, optional topics/status | Updates article; first transition to published sets `publishedAt` |
| `GET /discussions` | Public | optional `kind` | Published discussions, author/topics/comment count; max 30 |
| `GET /discussions/:slug` | Public | — | Discussion plus nested top-level comments/replies and authors |
| `POST /discussions` | Bearer | title/slug/body, optional kind/topic IDs | Creates discussion; model default status is published |
| `POST /discussions/:id/comments` | Bearer | `body` 2–10,000 chars, optional `parentId` | Creates comment without validating discussion/parent existence first |
| `GET /search` | Public | `q`, optional `page` | `{articles,topics,discussions,page}`; `q` shorter than two returns empty lists |
| `GET /profiles/:id` | Public | — | Public profile fields and published article summaries |

## Moderation and system

| Method/path | Access | Request | Response/behaviour |
| --- | --- | --- | --- |
| `POST /moderation/reports` | Bearer | `reason` 5–1,000 chars, optional `articleId` | Creates report, default `OPEN` |
| `GET /moderation/reports` | Moderator/Admin | — | Reports with reporter and article, newest first |
| `GET /health` | Public | — | Runs `SELECT 1`, returns `{status:'ok',database:'ok'}` |

## Important implementation notes

- JWT payload is `sub`, `email`, and `role`; expiry is eight hours.
- There is no route to refresh/revoke tokens, delete accounts, change passwords, attach sources, create revisions, change a report’s status, or archive content.
- `PATCH /articles/:id` uses a non-partial DTO despite being PATCH, so all required article fields must be provided.
- Public article, topic, discussion, comment, reply, search, profile, saved-article, and moderation-report author relations use explicit safe selections. Public content detail and topic associations filter for `PUBLISHED` records.
- Article and discussion `topicIds` are de-duplicated and checked against existing topics before relation writes. Unknown IDs return 404; omitted IDs leave article topics unchanged on update or create no topic joins.
- List/search endpoints do not return total-count or pagination metadata beyond echoing the search page.
