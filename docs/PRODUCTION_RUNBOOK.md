# Production Runbook

Status: Phase 1 audit, 6 November 2026. Everything labelled **proposed** is a procedure to approve and implement; it is not present in the repository or deployed.

## Audit snapshot

| Area | Implemented now | Gap before production |
| --- | --- | --- |
| Web | Next.js 15 application; `pnpm --filter @bharatarchive/web build` | No deploy config, container, start script, or host configuration. |
| API | NestJS API, `pnpm --filter @bharatarchive/api build`, compiled entry `apps/api/dist/main.js` | No production start script, structured logs, exception handling policy, graceful shutdown, rate limit, or CI/CD. |
| Database | Prisma/PostgreSQL 16; committed migrations; local Compose database with loopback binding, volume, and `pg_isready` check | No managed production DB, backup, restore rehearsal, connection limit, or production migration command. |
| Health and security | `GET /api/health` queries Postgres; Helmet, explicit CORS list, validation, bcrypt, JWT startup validation | No liveness/readiness split, alerting, secret manager, or production Swagger policy. |
| Secrets | `.env` is gitignored; `.env.example` contains placeholders | No environment separation or rotation record. |

## Recommended launch architecture — proposed

Use one Railway project with separate production services for the Next.js web app and NestJS API, plus Railway PostgreSQL. Use the provider's private network for API-to-database traffic; only the custom-domain web service and API HTTPS endpoint are public. Configure the web service with the canonical domain and the API with `/api/health` as its health check. Do not enable serverless sleep for the API if an uptime monitor or predictable login latency is required.

This is deliberately a single-region, non-HA baseline. It avoids Kubernetes, a self-managed VM, a proxy fleet, and a separate cache until measured demand warrants them. Railway's current Hobby plan has a US$5 monthly minimum including US$5 usage; resource use beyond that is metered. Railway PostgreSQL is a maintained single-node service, with private networking and optional backups/PITR. Review current provider terms at purchase time: [Railway pricing](https://docs.railway.com/pricing/plans), [PostgreSQL](https://docs.railway.com/databases/postgresql), and [backup/restore guide](https://railway.com/guides/postgres-backups-restores).

### Estimated monthly cost (estimates, not quotes)

At a planning conversion of **₹90/US$**, a small always-on web service, API, single PostgreSQL instance, and modest traffic should be budgeted at **₹1,500–₹3,000/month** on Railway, including the US$5 plan minimum and modest metered resources. Add approximately **₹100–₹500/month** for small offsite backup storage and **₹70–₹150/month** averaged for a `.in`/`.org`-style domain registration; the exact registrar cost varies. Use a free external uptime tier initially. Set a hard provider spend limit and an email alert at ₹2,000 and ₹3,000. This estimate excludes paid email, transactional messaging, professional monitoring, taxes, and a future HA database.

## Deployment procedure — proposed

1. Create isolated `development`, `test`, and `production` environments. Production must be a separate provider project/environment with no shared database or secret values.
2. Store production variables in the provider's encrypted environment store, restricted to the deployment owner and one backup custodian. Never put production values in `.env`, Git, build logs, tickets, Swagger examples, or browser-exposed variables.
3. Configure web build as `pnpm build` only if its deployment is isolated from API build output, otherwise use `pnpm --filter @bharatarchive/web build`; configure the API build as `pnpm --filter @bharatarchive/api build` and start it with `node apps/api/dist/main.js`. Confirm the selected host supplies the compatible Next.js production start command for the web service.
4. Before release, CI must use the lockfile and run `pnpm install --frozen-lockfile`, `pnpm lint`, `pnpm test`, and `pnpm build`. No CI/CD workflow exists yet.
5. Apply committed migrations exactly once, as a separately logged release job, using Prisma's production-safe deploy command (not `prisma migrate dev`). Take/confirm a backup first. Do not run seed data in production.
6. Deploy API, wait for `/api/health` to return HTTP 200 and `{"status":"ok","database":"ok"}`, then deploy web. Smoke-test public reading, search, registration/login, and one authorized mutation with a non-production account.
7. If the application fails its health check, stop rollout, retain logs, and roll back the application image. A database rollback requires its own approved restore procedure; never assume app rollback reverses a migration.

## Environment and secrets — proposed

| Variable | Visibility | Required in production | Owner / rotation |
| --- | --- | --- | --- |
| `DATABASE_URL` | Private | Yes; private-network PostgreSQL connection with TLS/provider requirements | Infrastructure owner; rotate after suspected exposure, personnel/admin change, or at least annually. |
| `JWT_SECRET` | Private | Yes; random 32+ character secret, unique to production | Security/deployment owner; rotate on exposure. Rotation invalidates current 8-hour bearer tokens, so schedule and announce it. |
| `API_PORT` | Private configuration | Yes for the current API implementation; set to the host-routed port | Deployment owner; not secret. |
| `NODE_ENV` | Private configuration | Yes, `production` | Deployment owner; not secret. |
| `NEXT_PUBLIC_API_URL` | Public, build-time | Yes; canonical HTTPS API base ending in `/api` | Deployment owner; not secret. |
| `NEXT_PUBLIC_SITE_URL` | Public, build-time and currently API CORS input | Yes; one canonical HTTPS web origin, no trailing ambiguity | Deployment owner; not secret. |
| `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, `POSTGRES_PORT` | Private/local Compose only | No, unless the chosen provider explicitly needs them outside `DATABASE_URL` | Development/DB owner; never set browser-visible. |

At startup the implementation validates `JWT_SECRET` only. Before production, startup validation must also fail closed on missing/invalid `NODE_ENV`, `DATABASE_URL`, `API_PORT`, `NEXT_PUBLIC_API_URL`, and `NEXT_PUBLIC_SITE_URL`; it must reject non-HTTPS public URLs and an empty/wildcard CORS origin. This is a required future implementation item, not done today. Build public `NEXT_PUBLIC_*` values only from non-secret configuration: Next.js embeds them in client output.

Maintain a private access/rotation register: variable name, environment, owner, last rotation, next review, and revocation steps—not secret values. Development uses local `.env`; tests use controlled test-only values and a disposable database; production uses provider secrets. Never point test or development at production.

## Database reliability — proposed

### Minimum policy

Use provider-managed Postgres with private networking. Take an encrypted compressed logical `pg_dump` once every 24 hours to an offsite, access-controlled object store in a different failure domain. Retain 35 daily backups and 3 month-end backups. Alert on any failed backup or missing daily object. Enable provider snapshots and point-in-time recovery when the selected plan supports them within budget; they supplement, but do not replace, portable offsite dumps.

Set an initial database connection cap through the provider/pooler and deploy no more than one API replica until connection use is measured. Size the API Prisma connection pool beneath the database's usable connection limit, reserving capacity for migration, backup, and admin access. A practical early target is 10–15 application connections and a database cap of 25–30, subject to the provider's actual limit. Connection pooling and exact environment settings require implementation/host confirmation.

### Restore procedure

1. Declare the incident owner and freeze writes: put the API into maintenance mode or stop it; preserve the affected database and logs.
2. Choose the recovery point with the product owner: latest valid logical dump for broad recovery, or provider PITR for a known timestamp. Do not restore over the only source database.
3. Provision a separate, isolated target database. Restore with `pg_restore`/`psql` according to the dump format, using temporary credentials; never print connection strings.
4. Validate row counts, critical tables, migration history, sample article/account reads, and API health against the restored target. Record the recovery-point timestamp and data loss window.
5. Obtain incident-owner approval, switch `DATABASE_URL` in a controlled deployment, verify health and user flows, then retain the original database until the post-incident review approves disposal.

### Restore rehearsal

Perform a restore rehearsal before launch and quarterly thereafter. Restore the latest backup into a non-production database, run the validation above, measure recovery time and data loss window, delete the rehearsal environment, and record date, owner, backup timestamp, success/failure, and corrective actions. A backup never restored is unverified.

## Monitoring, logging, and incident response — proposed

Minimum launch monitoring: an external HTTPS monitor every five minutes for the web home page and `/api/health`; provider alerts for failed deployment, service crash/restart, database unavailable, resource/spend threshold, and backup failure; and a shared incident destination reaching the named primary owner and backup. Free uptime monitoring is adequate at this stage.

Use provider log retention initially, but implement structured API logs before launch: timestamp, severity, request/correlation ID, route, status, latency, deployment/version, and sanitized error code. Never log passwords, bearer tokens, JWTs, cookies, database URLs, or request bodies by default. Capture unhandled errors with a lightweight error tracker only after a product owner chooses a vendor and data-processing posture. Check provider deployment status after every release; a successful build is not a successful deployment.

Severity guide: P1 = public site/API unavailable or suspected secret/data exposure; acknowledge within 15 minutes. P2 = material function degraded with workaround; acknowledge within 1 hour. P3 = non-urgent defect; schedule in normal planning. The primary incident owner coordinates, the backup owner can revoke/restore, and the product owner approves user communications and data-recovery choices. For P1: acknowledge alert, stop harmful rollout/disable writes, assess scope, recover or roll back, validate, communicate status, and document a blameless review within two business days.

## Rate limiting and abuse protection — proposed, not implemented

Existing controls are authentication/roles, validation, payload-length constraints, and CORS; there is no application or edge rate limit. Apply limits at the API edge with IP and account dimensions where authenticated. Return `429` with a retry indication, log only sanitized metadata, and use short temporary blocks rather than permanent automated bans.

| Route class | Proposed limit | Additional control |
| --- | --- | --- |
| Login | 5 attempts / IP / 15 minutes; 10 / account / hour | Generic credential error; temporary IP/account cooldown. |
| Registration | 3 / IP / hour; 10 / day | Add CAPTCHA or email verification only if abuse is observed/approved. |
| Search | 60 / IP / minute | Enforce query minimum already present; cap pagination in future implementation. |
| Public reads (articles, topics, profiles, discussions) | 120 / IP / minute | Cache safe GETs at CDN/host when canonical URL policy is approved. |
| Discussion/comment creation | 5 / account / 10 minutes and 20 / day; 10 / IP / hour | Require authenticated accounts; queue/review or restrict new accounts if abuse occurs. |
| Reports | 5 / account / day; 10 / IP / day | Deduplicate target/reason and alert moderators on bursts. |

## Launch acceptance checklist — proposed

- [ ] Provider, region, spend cap, domain, primary owner, backup custodian, and incident contacts approved.
- [ ] All production variables entered without exposing values; public URLs are HTTPS and CORS matches the canonical web origin exactly.
- [ ] CI gates pass; production build is reproducible from the lockfile.
- [ ] Migration completed once, backup succeeded, and a restore rehearsal passed.
- [ ] Web, API health, database, failed deployment, spend, and backup alerts reach both owners.
- [ ] Rate-limit policy is implemented and tested before public authentication or contribution endpoints launch.
- [ ] Production smoke test, privacy/community/editorial approvals, and rollback decision recorded.
