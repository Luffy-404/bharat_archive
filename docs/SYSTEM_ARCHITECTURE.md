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

There is no container image for web/API, reverse-proxy setup, production environment manifest, CI pipeline, hosted database configuration, health-check orchestration beyond the API `/health` endpoint, backup policy, logging/metrics, or secret-management integration.

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
- Deployment, backup/restore, monitoring, and rate/abuse controls remain undefined for production.

See [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md), [API_DOCUMENTATION.md](API_DOCUMENTATION.md), and [DECISIONS.md](DECISIONS.md).
