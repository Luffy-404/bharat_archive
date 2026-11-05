# BharatArchive

## Product statement

BharatArchive is an independent, self-hostable, community-oriented platform for discovering, preserving, and sharing knowledge about India: its history, culture, heritage, people, places, and stories. The repository describes it as free and community-driven; it currently contains a small, seeded first-version implementation.

## Vision and mission

The vision is a durable public knowledge archive with community participation. The mission is to make India-focused material discoverable, attributable, discussable, and maintainable through articles, topics, sources, revisions, discussions, and moderation reporting.

## Goals

- Publish and browse sourced India-focused articles.
- Organise knowledge through hierarchical topics.
- Support public questions and discussions with replies.
- Enable accounts, contributor profiles, saved articles, editorial drafting, and role-based publishing.
- Preserve enough provenance to support future review: article sources and revisions are modelled.

## Audience

Readers, community contributors, editors, moderators, researchers, and people exploring India-focused knowledge. No audience segmentation, localisation policy, or accessibility target is defined in code.

## Scope and status

| Area | Status | Evidence |
| --- | --- | --- |
| Public reading, topics, discussions, search | Implemented baseline | Web routes and public REST endpoints |
| Account registration/login/settings/saved articles | Implemented baseline | Auth/account components and API controllers |
| Article creation/update API | Implemented, API-only | Editor-or-higher API endpoints; no write form |
| Sources and revisions | Stored and read for articles | Prisma schema and article detail endpoint |
| Discussion creation/comments | API implemented; UI is read-only | API controllers and route pages |
| Moderation reports/listing | API implemented; no moderation UI/workflow | Moderation controller |
| Media uploads/object storage | Planned/not implemented | README explicitly excludes media from v1 |
| Production deployment/operations | Not defined | No deployment, CI, or hosting configuration |

The approved visual direction is minimalist, editorial, mobile-first, white-background, Inter-based, blue-link, subtle-separator, and free of decorative gradients or shadows. Its concrete tokens are documented in [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md). The locked launch scope is in [MVP_SCOPE.md](MVP_SCOPE.md).

## Deliberate boundaries

This repository does not implement media handling, payment, email, social sign-in, browser-session cookies, or a public authoring/moderation interface. Planned work must not be represented as implemented; see [ROADMAP.md](ROADMAP.md) and [DECISIONS.md](DECISIONS.md).
