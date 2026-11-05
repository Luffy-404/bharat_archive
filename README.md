# BharatArchive

An independent, self-hostable India-focused knowledge and community platform. It is a pnpm modular monolith: Next.js public reader (`apps/web`), NestJS REST API (`apps/api`), and a shared Prisma/PostgreSQL package (`packages/database`).

## Start locally

1. `Copy-Item .env.example .env` and set a long local `JWT_SECRET`.
2. `docker compose up -d postgres` (check with `docker compose ps`; stop with `docker compose down`).
3. `pnpm install` (runs `prisma generate` automatically using the root `.env`)
4. `pnpm db:generate && pnpm db:migrate && pnpm db:seed` — all database commands read the root `.env`; set `DATABASE_URL` there (the default local Compose setup uses port `5433`).
5. `pnpm dev` — web: http://localhost:3000, API/Swagger: http://localhost:4000/api/docs

`pnpm build`, `pnpm lint`, and `pnpm test` run workspace checks. Resetting local data is deliberately manual: first stop services, then use `docker compose down -v` only when you explicitly intend to remove the named development database volume.

## Notes

Public reader pages are server rendered and have baseline metadata, a sitemap, and robots rules. Canonical URLs and structured data are not implemented yet. The API owns bearer-token authentication, authorization, validation, and content lifecycle; rate limiting and a moderation workflow UI are not implemented. Media is intentionally not part of v1; an object-storage adapter can be introduced without coupling it to content tables.
