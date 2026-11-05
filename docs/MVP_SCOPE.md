# MVP Scope Lock

## Launch outcome

Launch the smallest reliable BharatArchive that lets people read useful published knowledge, find it through topics and search, and make a straightforward, moderated contribution. It should feel like an early knowledge/community site: simple pages, clear links, direct forms, and no engagement machinery.

This scope is a product target. “Implemented” below describes repository evidence, not launch approval.

## Final MVP feature list

| Capability | MVP status | Current evidence / gap |
| --- | --- | --- |
| Read published articles | Implemented | Public list/detail routes show text, author, topics, and sources. |
| Browse topics | Implemented | Topic list/detail routes expose published related content. |
| Search knowledge | Partially implemented | API searches published articles, topics, and discussions; the web page renders articles and topics but not discussion results. |
| Reader accounts | Implemented baseline | Email/password registration, login, settings, and bearer authentication. |
| Editorial article contribution | Incomplete | Editor-or-higher create/update API exists; no web drafting/editing interface or source/revision write path exists. |
| Community discussion and replies | Incomplete | Create/reply API exists; web UI is read-only. |
| Basic moderation | Incomplete | Report/list API exists; no reporting or review UI and no API action to change report status. |
| Publication safety | Implemented baseline | Public content visibility filters and safe public user projections are tested. |
| Launch operations | Missing | Production deployment, backups, monitoring, rate limits, and incident ownership are undefined. |

## Minimal launch requirements

1. Replace seed-only public content with reviewed, sourced launch content.
2. Provide a simple editor-only web form for draft/create/edit article workflows, including topic selection. Source attachment and revision policy must be decided before exposing contributor publishing.
3. Choose one of two approved community options: ship a minimal discussion/reply/report/review workflow, or defer public discussion creation and launch the existing read-only discussion pages only with editorial content.
4. Make search results complete for every content type that the API advertises, or narrow the API/UI wording consistently.
5. Define and implement production deployment, database backup/restore, secrets handling, basic monitoring, and rate/abuse protection.
6. Approve privacy, terms/community guidance, editorial/source policy, and a minimal moderation process.
7. Verify production URL metadata, robots, sitemap, mobile rendering, and error behaviour against the chosen launch host.

## Explicitly deferred

Followers, direct messaging, notifications, gamification, subscriptions, AI recommendations, advanced analytics, native mobile applications, payments, social sign-in, media uploads, external search infrastructure, and broad localisation are out of the initial MVP. Saved articles and public profiles may remain available because they already exist, but neither is required for launch.

## Recommended implementation order

1. Product-owner decisions: contributor/editor policy, moderation option, source/licensing rules, session posture, and launch operations owner.
2. Launch reliability: hosting, secrets, backups/restore rehearsal, monitoring, rate limiting, and production smoke checks.
3. Knowledge contribution: the smallest editor article workflow and source/revision policy needed for reviewed launch content.
4. Community decision: either minimal creation/reply/report/review UI or intentional deferral of public contribution.
5. Search completion and publication/SEO verification.
6. Content population and launch acceptance testing.

## Non-goals

Do not introduce social-network mechanics or broad platform infrastructure to compensate for missing editorial workflow. The MVP should prefer a small trusted editorial group, limited contribution paths, and simple pages over feature breadth.

See [PRD.md](PRD.md) for current behaviour, [ROADMAP.md](ROADMAP.md) for execution sequencing, and [DECISIONS.md](DECISIONS.md) for approvals still required.
