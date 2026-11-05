# Product Requirements Document

The initial launch boundary is defined in [MVP_SCOPE.md](MVP_SCOPE.md). This document records current implemented behaviour and requirements, not implied feature commitments.

## Current functional requirements

### Public experience

- Readers can view published articles, topics, topic detail, public discussions, discussion detail, contributor profiles, and search results.
- Article detail renders article text, source links, topic links, author link, estimated reading time, and a development-seed warning when content matches development wording.
- Search queries published articles, topics, and published discussions when `q` contains at least two trimmed characters. The present UI renders only article and topic results.
- Sitemap lists four static URLs; robots allows indexing. See [SEO_STRATEGY.md](SEO_STRATEGY.md).

### Accounts and contributions

- A visitor can register with email, password, and display name, then sign in with email/password.
- The browser stores the returned access token and basic user object in `sessionStorage`.
- Signed-in users can read and update their settings, view their own articles, and save/unsave published articles through the API.
- Editors, moderators, and administrators can create articles. Authors may update their own article; editorial roles may update any article.
- Signed-in users can create discussions, reply to discussions, and report an article. Moderators and administrators can list reports.

### Explicitly absent from the current web UI

There is no implemented form for writing articles, creating discussions, replying, saving/unsaving, or filing/reviewing reports. Links such as `/write` resolve to placeholder copy, not authoring. Source and revision creation are also not exposed by the API.

## Non-functional requirements embodied in code

- **Rendering:** Public pages are async server components that call the API with a 60-second fetch revalidation setting.
- **Validation:** Nest global validation whitelists, transforms, and rejects unknown body properties. DTO limits are enforced on API writes.
- **Authentication/authorisation:** Bearer JWTs expire after eight hours; role checks are enforced on relevant routes.
- **Database:** PostgreSQL via Prisma with unique keys, relationship constraints, and selected indexes; see [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md).
- **Security middleware:** API uses Helmet and CORS restricted to `NEXT_PUBLIC_SITE_URL` values (or localhost fallback).
- **Responsive presentation:** CSS has desktop, tablet, and mobile breakpoints, including mobile navigation.

## Requirements not yet established

The repository does not define SLOs, backups, retention, audit logs, accessibility conformance, content licensing policy, privacy policy text, moderation SLAs, abuse prevention limits, observability, incident response, or a production deployment model. These require product/engineering decisions; see [DECISIONS.md](DECISIONS.md).

## Acceptance principles for future work

Future features should preserve the public/content lifecycle boundaries, document API/schema changes first, and distinguish draft from public content. Any claims about factual content, source review, or moderation must be backed by implemented workflow rather than seed data or placeholder text.
