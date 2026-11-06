# System Architecture

## Shape

BharatArchive is a pnpm workspace modular monolith:

```text
Browser
  -> Next.js web app (apps/web, port 3000)
       -> NestJS REST API (apps/api, /api, port 4000)
            -> Prisma client (packages/database)
                 -> PostgreSQL 16 (Docker Compose, local port 5433 by default)
```

The web app is a public reader plus small client-side account/auth islands. The API contains all controllers, DTO validation, JWT authentication, roles, and persistence access. The shared package exposes Prisma client/types and owns the schema/migrations. There are no message queues, caches, object stores, email providers, search services, or external identity providers in this repository.

## Application boundaries and data flow

1. Server-rendered web routes call `apps/web/lib/api.ts`, which fetches the REST API and asks Next to revalidate fetches after 60 seconds.
2. The API receives requests under `/api`, applies Helmet, CORS, and global class-validator validation, then uses a single `Db` Prisma provider.
3. Login/register and client account mutations call the API directly from browser components. The received JWT is sent as `Authorization: Bearer <token>` from `sessionStorage`.
4. Prisma reads/writes PostgreSQL. `docker-compose.yml` is local database infrastructure only.

## Configuration and operations

Root `.env` is loaded by Prisma commands and by Nest (resolved from the repository root). Required documented variables are PostgreSQL credentials/URL, `JWT_SECRET`, `API_PORT`, `NEXT_PUBLIC_API_URL`, and `NEXT_PUBLIC_SITE_URL`. The root scripts orchestrate generate, migrate, seed, dev, build, lint, and API tests.

There is no container image for web/API, reverse-proxy setup, production environment manifest, CI pipeline, hosted database configuration, health-check orchestration beyond the API `/health` endpoint, backup policy, structured logging/metrics, or secret-management integration.

### Production-readiness audit (Phase 1, 6 November 2026)

**Implemented and verified in the repository:** Next.js builds with `pnpm --filter @bharatarchive/web build`; Nest builds with `pnpm --filter @bharatarchive/api build` and emits `apps/api/dist/main.js`; the root `pnpm build` runs Prisma generation before recursive builds. Docker Compose is intentionally a **local PostgreSQL-only** service: it binds Postgres to loopback, persists its named volume, reads `.env`, and has a `pg_isready` health check. It does not deploy the web app or API, run migrations, take backups, or provide a production proxy.

The API exposes an unauthenticated, database-dependent `GET /api/health` endpoint. It applies Helmet, an explicit CORS origin list derived from `NEXT_PUBLIC_SITE_URL`, and strict DTO validation. The API has no explicit application logger, exception filter, readiness/liveness split, rate limiter, graceful-shutdown configuration, or production-only Swagger restriction. A failed database query makes the health endpoint fail, which is suitable as a combined readiness check but means no separate liveness signal exists. No CI/CD or deployment configuration was found.

**Proposed, not implemented:** deploy the web app and API as separate services and use a managed PostgreSQL service on Railway in one project/production environment. Keep database traffic on the provider's private network; expose only the web and API HTTPS endpoints. Set the API health-check path to `/api/health`; configure the web platform's built-in HTTP check or a simple `/` check. The API currently needs a production `API_PORT` supplied explicitly because it does not read a host-provided `PORT` variable. Use `pnpm build` for build; run `node apps/api/dist/main.js` for the API service and the host's normal Next.js production start command for the web service. Run committed Prisma migrations as a separately controlled release step before application rollout; `migrate dev` is a development command and is not a production migration procedure.

The production CORS allow-list must contain only the canonical HTTPS web origin (and, temporarily if needed, its approved preview origin), comma-separated with no wildcard. `credentials: true` makes a wildcard invalid. The current use of `NEXT_PUBLIC_SITE_URL` for both browser metadata and API CORS is workable for one canonical origin but couples a public build-time setting to an API security boundary; preserve exact origin values and review this separation before adding preview deployments.

## Implemented security controls

- API Helmet middleware.
- CORS uses configured site URL(s), with credentials enabled.
- Validation rejects unknown payload keys and validates DTOs.
- Bcrypt password hashing uses cost 12.
- JWT expiry is eight hours; startup requires an explicit `JWT_SECRET` of at least 32 characters.
- Guards enforce bearer authentication and declared roles.
- Database uniqueness, foreign keys, and cascade/restrict behaviour are in migrations.
- Public author relations use explicit safe projections, and public content visibility is filtered to published records.

## Architecture inconsistencies and risks

- Rate limiting, canonical URLs, and structured data are not implemented; README records those limits accurately.
- Tokens in `sessionStorage` make them available to JavaScript in the page context; no refresh/revocation/cookie session strategy exists.
- Nest controllers and DTOs are all in one `api.module.ts`, appropriate for a small baseline but a future maintenance boundary.
- Deployment, backup/restore, monitoring, and rate/abuse controls are documented as proposed procedures in [PRODUCTION_RUNBOOK.md](PRODUCTION_RUNBOOK.md), but are not implemented in this repository.

See [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md), [API_DOCUMENTATION.md](API_DOCUMENTATION.md), and [DECISIONS.md](DECISIONS.md).
