# SEO Strategy

## Implemented technical SEO

- Root metadata supplies title template, description, metadata base, and manifest.
- Article routes generate title/description dynamically from the public article API.
- Topics, discussions, search, sign-in, and registration have limited page-level metadata.
- `robots.txt` allows all crawlers and links to `/sitemap.xml`.
- `sitemap.xml` returns only `/`, `/topics`, `/discussions`, and `/search` using `NEXT_PUBLIC_SITE_URL` (localhost fallback).
- A web manifest and SVG icon are present.

## Not implemented

No canonical metadata (`alternates.canonical`) or JSON-LD is present in the repository. The sitemap is static: it does not include articles, topic detail pages, discussions, or profiles. The search results page is indexable and not marked `noindex`.

## Current risks

- Metadata comes from public API data, but no reliable production cache/invalidation strategy exists beyond the 60-second fetch revalidation request.
- No Open Graph/Twitter metadata, image metadata, language localisation strategy, RSS, redirects, or `lastmod`/priority/change-frequency sitemap fields are implemented.
- Seed content is publicly published by the seed script; it is visibly labelled in article UI but still discoverable/indexable if deployed.

## Content strategy currently supported

Article title, summary, body, source links, topics, author links, and related topic navigation are the available content signals. The database can retain sources and revisions, but source/revision authoring and editorial review UI are not implemented. Editorial standards, licensing policy, schema markup choices, and publishing governance require approval; see [DECISIONS.md](DECISIONS.md).

## Recommended future acceptance checks

After human approval and implementation, validate rendered metadata, canonicals, robots directives, dynamic sitemap coverage, JSON-LD, mobile rendering, internal links, and noindex policies against the deployed public URL. Do not treat this roadmap as implemented behaviour.
