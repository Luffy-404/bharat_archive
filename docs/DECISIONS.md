# Decisions and Open Decisions

## Decisions evidenced in the repository

| Decision | Rationale/evidence |
| --- | --- |
| Modular monolith | Workspace separates Next web, Nest API, and Prisma DB package without distributed services. |
| PostgreSQL + Prisma | Schema, migrations, typed client, local Compose database. |
| REST API + Swagger | Nest controllers under `/api`; Swagger at `/api/docs`. |
| JWT bearer auth with roles | API issues eight-hour signed tokens and uses member/editor/moderator/admin guards. |
| Email/password authentication | Bcrypt hashes; no external identity provider. |
| Public content lifecycle | Articles default to draft and public article queries filter `PUBLISHED`; discussions default to published. |
| No media in v1 | README expressly defers object storage/media adapter. |
| Inter editorial interface | Root font setup and final typography CSS implement the approved design direction. |
| Phase 1 production audit is documentation only | The audit found no deployed infrastructure or CI/CD configuration and intentionally made no application or infrastructure change. |

## Proposed production baseline (requires approval; not implemented)

| Proposal | Why it is the smallest practical baseline |
| --- | --- |
| One Railway production project: separate Next.js web and NestJS API services plus Railway PostgreSQL | One bill, private service-to-database networking, managed platform operations, and independent web/API deployment without operating a VM or Kubernetes. |
| Start with Railway Hobby and fixed cost alerts | It includes US$5 of usage and supports an early-stage single-owner service; increase only after measured traffic/reliability needs justify it. |
| Daily PostgreSQL logical export to encrypted, access-controlled offsite object storage; retain 35 daily copies, 3 monthly copies, and test a restore quarterly | A portable, provider-independent recovery copy is more important than complex redundancy at launch. Enable provider snapshots/PITR only after confirming plan eligibility and cost. |
| GitHub Actions (or equivalent) gated CI before deployment | Run install-lockfile validation, lint, API tests, and production build; a deployment must not be the first build verification. |
| External HTTPS uptime check of web home and API health every 5 minutes, routed to a named owner | Detects user-visible failure without buying a full observability suite. |

## Decisions requiring human approval

1. **Production security:** require a real `JWT_SECRET`, choose cookie vs sessionStorage token handling, token refresh/revocation, password reset, email verification, account deletion, and session management.
2. **Editorial governance:** define who can publish/archive, what constitutes a revision, source requirements, fact-checking, licensing, and treatment of historical/cultural disputes.
3. **Moderation:** define report categories, review states/actions, permissions, audit logging, appeals, response timelines, and privacy handling.
4. **Content visibility:** public API publication filters are implemented; decide whether public discussion creation/replies should launch or remain editorial/read-only initially.
5. **Production operations:** approve or replace the proposed Railway baseline; choose domain registrar, production owner and backup custodian, TLS/custom-domain setup, secret manager, migration/deploy authority, offsite backup storage, monitoring destination, alert route, and incident owner.
6. **SEO:** approve canonical/structured-data design, dynamic sitemap scope, search index/noindex policy, Open Graph assets, and seed-content deployment policy.
7. **Accessibility/localisation:** set supported languages/scripts, localisation process, WCAG target, performance budgets, and mobile browser support.
8. **Abuse/performance:** approve the proposed launch rate policy, caching/pagination limits, moderation automation, and data retention.

## Code/documentation inconsistencies to resolve

- Static placeholder copy says sign-in/register forms are absent, but working `AuthForm` components exist.
- Navigation exposes `/write`, but it is placeholder copy rather than a working authoring flow.

## MVP scope lock

The initial launch excludes followers, messaging, notifications, gamification, subscriptions, AI recommendations, advanced analytics, and native mobile applications. [MVP_SCOPE.md](MVP_SCOPE.md) lists the minimal launch requirements and the remaining decisions that require product-owner approval.

These are observations, not approved implementation changes. See [SYSTEM_ARCHITECTURE.md](SYSTEM_ARCHITECTURE.md) for their current technical context.
