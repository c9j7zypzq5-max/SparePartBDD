# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev              # Start Next.js dev server
npm run build            # Production build
npm run typecheck        # TypeScript type-check only (tsc --noEmit)
npm test                 # Unit tests (node:test via tsx, no database)
npm run test:integration # Integration tests — needs TEST_DATABASE_URL (DB name must contain "test"; tables are truncated)

npm run db:push          # Push Drizzle schema to database (pg_trgm extension must exist first)
npm run db:studio        # Open Drizzle Studio (visual DB browser)
npm run seed             # Seed demo data (~30 parts, 6 industries)

npm run push             # CLI: POST a JSON batch to /api/ingest
npm run lifecycle        # Weekly lifecycle check script (Mac mini)
npm run catalog:build    # Check the curated catalogue and regenerate data/catalogue/<edition>/ (JSON lots + idempotent SQL)
npm run catalog:load     # Load those lots into DATABASE_URL through the ingest pipeline
```

Tests live in `tests/unit` (pure functions) and `tests/integration` (real Postgres: ingest, search, lifecycle). CI (`.github/workflows/ci.yml`) runs typecheck, both test suites against Postgres 16, and the build. Validate changes with `npm run typecheck`, `npm test`, and `npm run build`.

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

- `SearchService` interface abstracts the implementation (easy swap to Meilisearch). `searchOptionsFromParams()` validates URL params (enums, bounded limit/offset).
- `query-parser.ts` splits the query: a manufacturer name anywhere in it (1–3 words, matched by slug against a 5-min in-memory cache) becomes a brand boost; reference terms = whole normalized remainder (weight 1) + reference-looking tokens weighted by their share of the input.
- `PostgresSearchService` only generates candidates through indexes — never a full scan: exact match (btree), substring/prefix/similarity (`pg_trgm` GIN on `parts` and `part_references`), full-text through the `searchDocument()` expression (`src/db/search-document.ts`, name weight A, description weight B) backed by a GIN expression index — queries must use that exact helper or Postgres won't use the index. It is deliberately not a generated column: Drizzle selects every schema column, so a new column breaks all queries until `db:push` runs. Score = ref × 10 + text (+3 brand bonus); ordering always ends with `p.id` for stable pagination. A brand-only query returns that brand's parts.
- Accepts filters: `industry`, `status`, `manufacturerSlug`, `categorySlug`, `inStock`, `sortBy`.

### Ingestion Pipeline (`src/lib/ingest-pipeline.ts`)

`ingestParts(parts, source)` runs a **two-pass upsert**:

1. **Pass 1**: each part is validated (`ingest-validation.ts`), then manufacturer/category/seller IDs are resolved (cached per batch) and the part + its cross-refs + offers are written in **one transaction per part**. Builds a `partRegistry` (`"manufacturerSlug|normalizedRef" → partId`).
2. **Pass 2**: supersessions & compatibilities — resolved via the registry, **falling back to a DB lookup** for parts ingested in earlier batches.

Updates never erase data: omitted/empty fields keep their DB value (COALESCE), `status` only changes to `active`/`obsolete` and never overrides a definitive lifecycle verdict (`lifecycleCheckedAt` set and `needsReview` false), offers without a price keep the last price, and manufacturer/category/seller names and types are first-write-wins. Result: `errors` (rejected parts → HTTP 207) and `warnings` (skipped relations). `POST /api/ingest` is protected by `INGEST_API_KEY` Bearer auth (`requireApiKey()`, constant-time) and caps batches at 500 parts.

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
- **All queries centralised**: `src/lib/queries.ts` contains the page data-fetching functions (e.g. `getCheapestOffers()` pairs price and currency from the same offer) — check here before writing new DB queries.
- **Enums**: value lists live in `src/lib/ingest-types.ts` (`INDUSTRIES`, `PART_STATUSES`, …) and feed both the Postgres enums in `schema.ts` and validation.
- **Security**: `/admin/*` is guarded by HTTP Basic auth in `src/middleware.ts` (`ADMIN_USER`/`ADMIN_PASSWORD`; 404 in production without a password). Public endpoints use `rateLimitResponse(req, bucket, { limit })` (per-endpoint, per-IP, in-memory) and `intParam`/`enumParam` (`src/lib/params.ts`) for query params.
- **Shared helpers**: `src/lib/format.ts` (`formatPrice`, `formatDate` with a fixed Europe/Paris timezone to avoid hydration mismatches), `src/lib/csv.ts` (escaping, CSV-injection guard, UTF-8 BOM), `src/lib/part-export.ts` (brand/category exports).
- **PartCard** is a server-compatible component using a "stretched link" (`after:absolute after:inset-0`): never wrap interactive buttons in the `<Link>`; interactive children sit above it with `relative z-10`. Lists pass `extras` from `getPartCardExtras()` (two batched queries: best price, offer count and, for obsolete parts, the first still-manufactured successor in the supersession chain) — `withCardExtras()` does it for search hits, and the part page uses the same "first active successor" rule.
- **Status display**: always `StatusBadge` (`size="sm" | "md"`), labels from `STATUS_LABELS` / `statusLabel()` in `format.ts` — no ad-hoc status chips.
- **Search UI**: `SearchBar` is an ARIA combobox (variants `hero` / `page` / `header`, `/` shortcut, previous suggestion request aborted on each keystroke). `HeaderSearch` shows the compact one on every page except `/` and `/recherche`. `/recherche` filter selects navigate on change (`FilterSelect`, `<noscript>` submit fallback); the "stock" filter is labelled « Avec prix » (it keeps parts with a priced offer).
- **Bulk search**: `/technicien` is the only bulk page (`/recherche-lot` redirects to it in `next.config.ts`).
- **localStorage pages** (`/liste`, `/comparer`): render nothing until mounted, never an empty state before the list has been read.
- **Print stylesheet** hides every `<header>` element: don't use `<header>` for page content (the part page title block is a `<div>`); mark UI chrome with `no-print`.
- **Extended catalogue**: `scripts/catalog/data/*.ts` holds hand-curated real references (one `family()` per product range): no prices or offers, no `productUrl` (the lifecycle check would read a wrong URL's 404 as "obsolete"), `unknown` when the lifecycle isn't established, confidence < 60 for doubtful end-of-life (→ `/admin/review`). `catalog:build` rejects duplicate normalized references, unresolved replacements/compatibles and cycles, skips parts already in `neon-catalog.sql`, and orders lots so a replacement is loaded before the part it replaces. Edit the data, never the generated `data/catalogue/<edition>/` files; loading paths are in `data/catalogue/README.md`.
- **No `loading.tsx` under `/recherche`**: with Next 15.5 it made client navigations between two `/recherche?…` URLs (filter chips, `router.push`) never commit. `SearchLoadMore` is keyed on the query so a filter change resets loaded results.

## Environment Variables

```bash
DATABASE_URL              # Postgres (local or Neon) — pg_trgm extension required
TEST_DATABASE_URL         # Dedicated DB for integration tests (name must contain "test")
NEXT_PUBLIC_SITE_URL      # Canonical/OG base URL
INGEST_API_KEY            # Bearer token for /api/ingest, /api/lifecycle/*, /api/repair/*
ADMIN_USER / ADMIN_PASSWORD # HTTP Basic auth for /admin/* (user defaults to "admin")
INGEST_URL                # Base URL targeted by scripts (push, lifecycle, accumulate)
GEMINI_API_KEY            # Optional: accumulate.ts uses Gemini instead of Ollama
MOUSER_API_KEY            # Optional distributor API
FARNELL_API_KEY           # Optional distributor API
RS_API_KEY                # Optional distributor API
```
