# Roadmap

## Completed baseline

- pnpm monorepo with Next.js web app, NestJS API, Prisma package, PostgreSQL Compose service, migrations, and development seed data.
- Public reader routes for home, articles, topics, discussions, profiles, and search.
- Account registration/login, JWT guards/roles, settings, saved articles, account lists.
- Content/discussion/comment/report persistence and REST endpoints.
- Basic responsive editorial shell and approved Inter lightweight typography.
- Basic robots, sitemap, manifest, Swagger, health endpoint, and API test harness.

## Completed Phase 0: secure public baseline

- Public user/author relations have explicit safe selections; password hashes are not returned by public endpoints.
- Public detail and topic relations filter published content.
- Topic relation writes validate and de-duplicate IDs.
- API startup requires an explicit JWT secret; regression tests cover configuration and public-query safety.
- Duplicate nested web layouts were removed and README claims now reflect implemented behaviour.

## Locked MVP priorities

The initial MVP is defined in [MVP_SCOPE.md](MVP_SCOPE.md). Before broader feature development: decide the contribution/moderation model, establish production operating basics, build the smallest required editor workflow, then either complete minimal community workflows or deliberately defer public creation.

## Upcoming phases (planned, not implemented)

### Phase 1: production-readiness audit (completed; procedures proposed, not implemented)

- Audited the deployment shape, Compose configuration, environment handling, CORS, health endpoint, builds, migrations, logging, rate-limit status, and CI/CD status.
- Recorded a cost-conscious hosting recommendation, minimum backup/restore policy, monitoring/incident procedures, secret ownership, and abuse-control policy in [PRODUCTION_RUNBOOK.md](PRODUCTION_RUNBOOK.md).
- No infrastructure, application code, schema, dependency, or deployment change was made in this phase.

### Phase 1a: launch reliability implementation and approvals

Approve the production provider/budget and owners; then implement production hosting, secret storage, migrations, backups/restore rehearsal, monitoring, CI/CD, rate/abuse protection, legal/privacy/community policy, source/licensing policy, and a decision on whether public discussions are writable at launch. The audit does not count as implementation.

### Phase 2: safe authoring and optional community workflow

Web workflows for editor article drafting/editing and approved source/revision handling. If public discussion creation launches, add simple discussion/reply/report/review workflows; otherwise keep it read-only. Depends on Phase 1 decisions.

### Phase 3: publication quality and discovery

Dynamic sitemap/canonicals/structured data, noindex strategy, richer metadata, content-quality process, and reliable cache invalidation. Depends on production URL, publication lifecycle policy, and source/licensing standards.

### Post-MVP: operating at scale

High availability, longer log retention, auditability, performance strategy, media/object-storage integration, and scaling beyond the minimum launch operations. Depends on hosting, privacy, budget, and retention decisions.

### Explicitly deferred

Followers, messaging, notifications, gamification, subscriptions, AI recommendations, advanced analytics, native mobile applications, and media remain out of scope for the initial MVP.

## Dependencies and blockers

Every future phase relies on human approval for legal/privacy/licensing, moderation policy, production infrastructure, and authentication/session posture. Do not use the current development seed as publishable content.
