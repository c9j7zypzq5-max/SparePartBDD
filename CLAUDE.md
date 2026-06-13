# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev              # Start Next.js dev server
npm run build            # Production build
npx tsc --noEmit        # TypeScript type-check only

npm run db:push          # Push Drizzle schema to database
npm run db:studio        # Open Drizzle Studio (visual DB browser)
npm run seed             # Seed demo data (~30 parts, 6 industries)

npm run push             # CLI: POST a JSON batch to /api/ingest
npm run lifecycle        # Weekly lifecycle check script (Mac mini)
```

No test suite is configured. Type-check with `npx tsc --noEmit` and validate with `npm run build`.

## Architecture

**SparePartSearch** is a Next.js 15 (App Router) fullstack application for searching industrial spare parts. Users search by OEM reference (e.g. "Siemens 6ES7214-1AG40-0XB0") and get manufacturing status, replacement chains, and vendor offers.

### Core Layers

```
src/
├── app/              # Next.js pages + API routes
├── db/               # Drizzle schema + DB client
├── lib/              # Business logic (queries, pipelines, search)
├── components/       # Reusable React components
└── scripts/          # CLI tools (seed, ingest/push, lifecycle/check)
```

### Data Model (`src/db/schema.ts`)

Eight tables with key relationships:

- **parts** — core entity, identified by `manufacturerId + referenceNormalized` (unique index). Carries `status` (active/obsolete/unknown), `confidenceScore`, `needsReview`, `lifecycleCheckedAt`.
- **part_references** — cross-references (OEM variants, EAN, MPN) linked to a part; `referenceNormalized` is indexed for search.
- **supersessions** — official replacement chain (oldPartId → newPartId).
- **compatibilities** — non-official alternatives with a `confidence` float (0–1).
- **offers** — seller × part pricing, with `scrapedAt` for freshness.
- **sellers**, **manufacturers**, **categories** — lookup tables with `slug` as URL key.

### Reference Normalization (`src/lib/normalize.ts`)

All cross-source matching relies on `normalizeReference()`: strips everything except alphanumerics, uppercases.  
`"11 42 7 953 129"` → `"11427953129"`

This is the deduplication key everywhere. Never match references without normalizing first.

### Search (`src/lib/search/`)

- `SearchService` interface abstracts the implementation (easy swap to Meilisearch).
- `PostgresSearchService` runs a hybrid SQL query: two CTEs (`ref_matches` via trigram + exact, `text_matches` via full-text), merged and ranked with reference score weighted 10× over text score.
- Accepts filters: `industry`, `status`, `manufacturerSlug`, `sortBy`.

### Ingestion Pipeline (`src/lib/ingest-pipeline.ts`)

`ingestParts(parts, source)` runs a **two-pass upsert**:

1. **Pass 1**: manufacturers → categories → parts → part_references → offers. Builds a `partRegistry` (`"manufacturerSlug|normalizedRef" → partId`).
2. **Pass 2**: supersessions & compatibilities — requires both parts to already exist, resolved via the registry.

Per-part errors are collected and returned without stopping the batch. The route `POST /api/ingest` is protected by `INGEST_API_KEY` Bearer auth.

### Lifecycle Monitoring (`src/lib/lifecycle-pipeline.ts`)

`applyLifecycleReport()` processes verdicts from the Mac mini script:
- `active` → status=active, needsReview=false
- `obsolete` → status=obsolete, needsReview=false
- `ambiguous` → status unchanged, needsReview=true
- `error` → no change (retried next run)

### Key Design Decisions

- **SEO**: Part detail pages (`/piece/[marque]/[ref]`) have JSON-LD, canonical URLs, and Open Graph. The search results page (`/recherche`) is `noindex`.
- **Path alias**: `@/*` maps to `src/*` (configured in `tsconfig.json`).
- **Infinite scroll**: Brand and category list pages use `InfinitePartsList` (client component) backed by `/api/marque/[marque]/parts` and `/api/categorie/[slug]/parts` with offset pagination.
- **All queries centralised**: `src/lib/queries.ts` contains 40+ data-fetching functions — check here before writing new DB queries.

## Environment Variables

```bash
DATABASE_URL              # Postgres (local or Neon)
NEXT_PUBLIC_SITE_URL      # Canonical/OG base URL
INGEST_API_KEY            # Bearer token for /api/ingest and /api/lifecycle
MOUSER_API_KEY            # Optional distributor API
FARNELL_API_KEY           # Optional distributor API
RS_API_KEY                # Optional distributor API
```
