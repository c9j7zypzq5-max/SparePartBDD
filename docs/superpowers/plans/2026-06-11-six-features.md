# SparePartSearch — Six Features Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement six incremental improvements: sitemap polish, JSON-LD enhancement, category infinite scroll + nav, brand/search filter+sort, similar parts section, and enterprise homepage refactor.

**Architecture:** Each feature is an isolated commit. Features 1–2 touch existing files minimally. Feature 3 adds a new API route + generalizes the infinite list. Feature 4 threads filter/sort state from URL params through SSR → API → client. Feature 5 is a single new query + JSX section. Feature 6 rewrites page.tsx keeping existing components.

**Tech Stack:** Next.js 14 (app router, RSC), Drizzle ORM, Neon PostgreSQL, Tailwind CSS

**Pre-flight check:** `npm run build` must pass before starting. Run `npm run dev` to observe changes.

---

## Codebase state at plan creation

Several items in the spec are **already partially or fully implemented**. This plan describes the delta only:

| Spec item | Already exists | Delta |
|-----------|---------------|-------|
| Sitemap | `src/app/sitemap.ts` — covers `/`, `/marques`, `/categories`, brand pages, category pages, part pages | Add `/recherche` + `/liste`, add `lastModified`, fix `changeFrequency` (monthly for statics) |
| JSON-LD | Part page has LD+JSON with individual `Offer[]` | Upgrade to `AggregateOffer`, add `url`, add `discontinued` for obsolete |
| Category pages | `/categories` and `/categorie/[slug]` both exist (SSR, no pagination) | Add API route, add infinite scroll, sort categories by count desc, add nav link |
| Filters on brand page | None | Status filter + sort in query params + API support |
| Filters on search page | Has status + industry + brand filters | Add sort (relevance / prix asc / prix desc / nom A→Z) |
| Similar parts | Not implemented | New query + section on part page |
| Homepage | Has hero, stats×4, verticales, supersessions, brand list | Rewrite with enterprise copy, 3-col stats, BrandLogo grid×12, category tiles×6, /liste CTA |

---

## Task 1: Sitemap polish

**Files:**
- Modify: `src/app/sitemap.ts`

- [ ] **Step 1: Add missing static URLs + lastModified + correct changeFrequency**

Open `src/app/sitemap.ts`. The current export already covers most URLs. Replace the return array with:

```typescript
const now = new Date();
const STATIC_PAGES = [
  { url: siteUrl, priority: 1, changeFrequency: "weekly" as const },
  { url: `${siteUrl}/marques`, priority: 0.7, changeFrequency: "monthly" as const },
  { url: `${siteUrl}/categories`, priority: 0.7, changeFrequency: "monthly" as const },
  { url: `${siteUrl}/recherche`, priority: 0.5, changeFrequency: "monthly" as const },
  { url: `${siteUrl}/liste`, priority: 0.4, changeFrequency: "monthly" as const },
];

return [
  ...STATIC_PAGES.map((p) => ({ ...p, lastModified: now })),
  ...manufacturers.map((m) => ({
    url: `${siteUrl}/marque/${m.slug}`,
    changeFrequency: "weekly" as const,
    priority: 0.7,
    lastModified: now,
  })),
  ...categories.map((c) => ({
    url: `${siteUrl}/categorie/${c.slug}`,
    changeFrequency: "weekly" as const,
    priority: 0.6,
    lastModified: now,
  })),
  ...partPaths.map((p) => ({
    url: `${siteUrl}/piece/${p.manufacturerSlug}/${p.partSlug}`,
    changeFrequency: "weekly" as const,
    priority: 0.8,
    lastModified: now,
  })),
];
```

- [ ] **Step 2: Verify build**

```bash
npm run build 2>&1 | tail -20
```

Expected: no TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/sitemap.ts
git commit -m "feat: dynamic sitemap"
```

---

## Task 2: JSON-LD upgrade on part pages

**Files:**
- Modify: `src/app/piece/[marque]/[ref]/page.tsx` (lines 41–57)

The page already has JSON-LD. We need to:
1. Replace individual `Offer[]` with a single `AggregateOffer`
2. Add `url` to the product
3. Add `discontinued: true` in the offer for obsolete/end_of_life parts

- [ ] **Step 1: Add `siteUrl` import and replace the `jsonLd` object (lines 41–58) in the part page**

Add to imports at the top of the file:
```typescript
import { siteUrl } from "@/lib/site-url";
```

Replace the `jsonLd` variable:
```typescript
const priceOffers = detail.offers.filter((o) => o.offer.price != null);
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Product",
  name: part.name,
  sku: part.referenceRaw,
  mpn: part.referenceRaw,
  brand: { "@type": "Brand", name: manufacturer.name },
  description: part.description ?? undefined,
  url: `${siteUrl}/piece/${manufacturer.slug}/${part.slug}`,
  offers: priceOffers.length > 0
    ? {
        "@type": "AggregateOffer",
        lowPrice: Math.min(...priceOffers.map((o) => parseFloat(o.offer.price!))),
        priceCurrency: priceOffers[0].offer.currency ?? "EUR",
        offerCount: priceOffers.length,
        ...(part.status === "obsolete" ? { discontinued: true } : {}),
      }
    : undefined,
};
```

- [ ] **Step 2: Remove the now-unused `minPriceOffer` / `minPrice` / `currency` variables** that were only used for jsonLd. Keep the ones still used for `WatchlistButton`.

Check: `minPrice` and `currency` are still used for `WatchlistButton` on lines 101–102. Keep them.

- [ ] **Step 3: Verify TypeScript**

```bash
npx tsc --noEmit 2>&1 | head -30
```

- [ ] **Step 4: Commit**

```bash
git add src/app/piece/[marque]/[ref]/page.tsx
git commit -m "feat: JSON-LD structured data on part pages"
```

---

## Task 3: Category pages — infinite scroll + nav

**Files:**
- Modify: `src/lib/queries.ts` — add `getCategoryPageData` and `getCategoryPartsPaginated`
- Create: `src/app/api/categorie/[categorie]/parts/route.ts`
- Modify: `src/components/infinite-parts-list.tsx` — generalize to accept `apiPath` instead of `manufacturerSlug`
- Modify: `src/app/categorie/[slug]/page.tsx` — use paginated data + infinite scroll
- Modify: `src/app/categories/page.tsx` — sort by partsCount desc
- Modify: `src/app/layout.tsx` — add "Catégories" link in header nav

### 3a — New queries

- [ ] **Step 1: Add `getCategoryBySlug`, `getCategoryPageData`, and `getCategoryPartsPaginated` to `src/lib/queries.ts`**

Add `getCategoryBySlug` first (used by both the category page and the API route):

```typescript
export async function getCategoryBySlug(slug: string) {
  const [category] = await db
    .select()
    .from(categories)
    .where(eq(categories.slug, slug))
    .limit(1);
  return category ?? null;
}
```

Then add:

```typescript
export async function getCategoryPageData(slug: string, limit: number) {
  const [category] = await db
    .select()
    .from(categories)
    .where(eq(categories.slug, slug))
    .limit(1);
  if (!category) return null;

  const [[countRow], partRows] = await Promise.all([
    db
      .select({ total: sql<number>`count(*)::int` })
      .from(parts)
      .where(eq(parts.categoryId, category.id)),
    db
      .select({ part: parts, manufacturer: manufacturers })
      .from(parts)
      .innerJoin(manufacturers, eq(manufacturers.id, parts.manufacturerId))
      .where(eq(parts.categoryId, category.id))
      .orderBy(asc(parts.referenceNormalized))
      .limit(limit),
  ]);

  return { category, parts: partRows, totalCount: countRow.total };
}

export async function getCategoryPartsPaginated(
  categoryId: number,
  limit: number,
  offset: number,
) {
  return db
    .select({ part: parts, manufacturer: manufacturers })
    .from(parts)
    .innerJoin(manufacturers, eq(manufacturers.id, parts.manufacturerId))
    .where(eq(parts.categoryId, categoryId))
    .orderBy(asc(parts.referenceNormalized))
    .limit(limit)
    .offset(offset);
}
```

### 3b — New API route

- [ ] **Step 2: Create `src/app/api/categorie/[categorie]/parts/route.ts`**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getCategoryBySlug, getCategoryPartsPaginated } from "@/lib/queries";

const PAGE_SIZE = 24;

type Params = Promise<{ categorie: string }>;

export async function GET(req: NextRequest, { params }: { params: Params }) {
  const { categorie } = await params;
  const offset = parseInt(req.nextUrl.searchParams.get("offset") ?? "0", 10);

  const category = await getCategoryBySlug(categorie);
  if (!category) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const rows = await getCategoryPartsPaginated(category.id, PAGE_SIZE + 1, offset);
  const hasMore = rows.length > PAGE_SIZE;
  const pageRows = hasMore ? rows.slice(0, PAGE_SIZE) : rows;

  return NextResponse.json({
    parts: pageRows.map(({ part, manufacturer }) => ({
      id: part.id,
      slug: part.slug,
      name: part.name,
      referenceRaw: part.referenceRaw,
      status: part.status,
      manufacturerSlug: manufacturer.slug,
      manufacturerName: manufacturer.name,
    })),
    hasMore,
  });
}
```

### 3c — Generalize InfinitePartsList

- [ ] **Step 3: Modify `src/components/infinite-parts-list.tsx`**

The component currently hardcodes `manufacturerSlug` into the API path. Generalize it with an `apiPath` prop and support parts that carry their own `manufacturerSlug` (needed for categories where parts have mixed manufacturers).

Replace the current props interface and API call:

```typescript
type PartSummary = {
  id: number;
  slug: string;
  name: string;
  referenceRaw: string;
  status: string;
  manufacturerSlug: string;
  manufacturerName: string;
};

export function InfinitePartsList({
  apiPath,           // e.g. "/api/marque/siemens/parts" or "/api/categorie/automates/parts"
  initialParts,
  totalCount,
}: {
  apiPath: string;
  initialParts: PartSummary[];
  totalCount: number;
}) {
```

Update `loadMore` to use `apiPath`:
```typescript
const res = await fetch(`${apiPath}?offset=${offsetRef.current}`);
```

Update `PartCard` call to use `part.manufacturerSlug` and `part.manufacturerName` from each part.

**Note:** The brand page currently passes `manufacturerSlug` + `manufacturerName` at the list level because all parts share the same manufacturer. The category page needs per-part manufacturer info. The new shape handles both.

Update the brand page's `initialParts` mapping to include `manufacturerSlug` and `manufacturerName` (the brand page already knows these from `data.manufacturer`).

### 3d — Update category page

- [ ] **Step 4: Replace `src/app/categorie/[slug]/page.tsx`**

```typescript
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCategoryPageData } from "@/lib/queries";
import { InfinitePartsList } from "@/components/infinite-parts-list";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 24;
type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const data = await getCategoryPageData(slug, 1);
  if (!data) return { title: "Catégorie introuvable" };
  return {
    title: `${data.category.name} — pièces détachées par référence`,
    description: `Catalogue des pièces ${data.category.name} : statut de fabrication, remplacements et vendeurs.`,
    alternates: { canonical: `/categorie/${slug}` },
  };
}

export default async function CategoryPage({ params }: { params: Params }) {
  const { slug } = await params;
  const data = await getCategoryPageData(slug, PAGE_SIZE);
  if (!data) notFound();

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight">{data.category.name}</h1>
      <p className="mt-2 text-zinc-600 capitalize">
        Industrie : {data.category.industry} · {data.totalCount} pièce{data.totalCount > 1 ? "s" : ""} référencée{data.totalCount > 1 ? "s" : ""}
      </p>
      <InfinitePartsList
        apiPath={`/api/categorie/${slug}/parts`}
        initialParts={data.parts.map(({ part, manufacturer }) => ({
          id: part.id,
          slug: part.slug,
          name: part.name,
          referenceRaw: part.referenceRaw,
          status: part.status,
          manufacturerSlug: manufacturer.slug,
          manufacturerName: manufacturer.name,
        }))}
        totalCount={data.totalCount}
      />
    </div>
  );
}
```

### 3e — Sort categories by count descending

- [ ] **Step 5: Modify `src/app/categories/page.tsx`**

The current `getCategoriesWithCounts` returns rows ordered by name. After fetching, sort by `partsCount` descending before grouping:

```typescript
const rows = await getCategoriesWithCounts();
// Sort by partsCount descending within each industry group
const sorted = [...rows].sort((a, b) => b.partsCount - a.partsCount);
```

Use `sorted` instead of `rows` for the `byIndustry` map.

### 3f — Update brand page to use new InfinitePartsList shape

- [ ] **Step 6: Modify `src/app/marque/[marque]/page.tsx`**

Update the `InfinitePartsList` call to use the new props:

```tsx
<InfinitePartsList
  apiPath={`/api/marque/${marque}/parts`}
  initialParts={data.parts.map((p) => ({
    id: p.id,
    slug: p.slug,
    name: p.name,
    referenceRaw: p.referenceRaw,
    status: p.status,
    manufacturerSlug: marque,
    manufacturerName: data.manufacturer.name,
  }))}
  totalCount={data.totalCount}
/>
```

Also update the brand API route response to include `manufacturerSlug` and `manufacturerName`:

```typescript
parts: pageParts.map((p) => ({
  id: p.id,
  slug: p.slug,
  name: p.name,
  referenceRaw: p.referenceRaw,
  status: p.status,
  manufacturerSlug: marque,
  manufacturerName: manufacturer.name,
})),
```

### 3g — Add "Catégories" to header nav

- [ ] **Step 7: Modify `src/app/layout.tsx` header nav**

Add between "Marques" and `WatchlistCount`:

```tsx
<Link href="/categories" className="hover:text-zinc-900">
  Catégories
</Link>
```

- [ ] **Step 8: Build check**

```bash
npx tsc --noEmit && npm run build 2>&1 | tail -20
```

- [ ] **Step 9: Commit**

```bash
git add src/lib/queries.ts src/app/api/categorie src/components/infinite-parts-list.tsx \
        src/app/categorie/[slug]/page.tsx src/app/categories/page.tsx \
        src/app/marque/[marque]/page.tsx src/app/api/marque/[marque]/parts/route.ts \
        src/app/layout.tsx
git commit -m "feat: category browse pages"
```

---

## Task 4: Filters + sort on brand and search pages

**Files:**
- Modify: `src/lib/queries.ts` — new `getManufacturerPartsPaginatedFiltered`
- Modify: `src/app/api/marque/[marque]/parts/route.ts` — accept `status` + `sort` params
- Modify: `src/components/infinite-parts-list.tsx` — accept `extraParams` for query string
- Modify: `src/app/marque/[marque]/page.tsx` — read searchParams, render filter UI
- Modify: `src/lib/search/postgres-search.ts` — add `sortBy` option
- Modify: `src/lib/search/search-service.ts` — extend `SearchOptions`
- Modify: `src/app/recherche/page.tsx` — add sort filter UI

### 4a — New filtered query for brand parts

- [ ] **Step 1: Add `getManufacturerPartsPaginatedFiltered` to `src/lib/queries.ts`**

```typescript
import { desc } from "drizzle-orm"; // add to existing import

export async function getManufacturerPartsPaginatedFiltered(
  manufacturerId: number,
  limit: number,
  offset: number,
  opts: { status?: string; sort?: string } = {},
) {
  const conditions = [eq(parts.manufacturerId, manufacturerId)];
  if (opts.status === "active" || opts.status === "obsolete") {
    conditions.push(eq(parts.status, opts.status as "active" | "obsolete"));
  }

  let order;
  switch (opts.sort) {
    case "name_desc":
      order = desc(parts.referenceNormalized);
      break;
    default:
      order = asc(parts.referenceNormalized);
  }

  return db
    .select()
    .from(parts)
    .where(and(...conditions))
    .orderBy(order)
    .limit(limit)
    .offset(offset);
}
```

Also update `getManufacturerPageData` to accept optional filter opts so the SSR first page respects filters:

```typescript
export async function getManufacturerPageData(
  slug: string,
  limit: number,
  opts: { status?: string; sort?: string } = {},
) {
  // ... existing manufacturer lookup ...

  const statusCondition =
    opts.status === "active" || opts.status === "obsolete"
      ? [eq(parts.status, opts.status as "active" | "obsolete")]
      : [];

  const [[countRow], [obsoleteRow], partRows] = await Promise.all([
    db
      .select({ total: sql<number>`count(*)::int` })
      .from(parts)
      .where(and(eq(parts.manufacturerId, manufacturer.id), ...statusCondition)),
    // obsoleteCount stays global (ignores status filter)
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(parts)
      .where(and(eq(parts.manufacturerId, manufacturer.id), eq(parts.status, "obsolete"))),
    db
      .select()
      .from(parts)
      .where(and(eq(parts.manufacturerId, manufacturer.id), ...statusCondition))
      .orderBy(opts.sort === "name_desc" ? desc(parts.referenceNormalized) : asc(parts.referenceNormalized))
      .limit(limit),
  ]);

  return { manufacturer, parts: partRows, totalCount: countRow.total, obsoleteCount: obsoleteRow.count };
}
```

### 4b — Update brand API route

- [ ] **Step 2: Modify `src/app/api/marque/[marque]/parts/route.ts`**

```typescript
export async function GET(req: NextRequest, { params }: { params: Params }) {
  const { marque } = await params;
  const offset = parseInt(req.nextUrl.searchParams.get("offset") ?? "0", 10);
  const status = req.nextUrl.searchParams.get("status") ?? undefined;
  const sort = req.nextUrl.searchParams.get("sort") ?? undefined;

  const manufacturer = await getManufacturerBySlug(marque);
  if (!manufacturer) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const rows = await getManufacturerPartsPaginatedFiltered(
    manufacturer.id,
    PAGE_SIZE + 1,
    offset,
    { status, sort },
  );
  const hasMore = rows.length > PAGE_SIZE;
  const pageParts = hasMore ? rows.slice(0, PAGE_SIZE) : rows;

  return NextResponse.json({
    parts: pageParts.map((p) => ({
      id: p.id,
      slug: p.slug,
      name: p.name,
      referenceRaw: p.referenceRaw,
      status: p.status,
      manufacturerSlug: marque,
      manufacturerName: manufacturer.name,
    })),
    hasMore,
  });
}
```

Also import `getManufacturerPartsPaginatedFiltered`.

### 4c — Generalize InfinitePartsList with extraParams

- [ ] **Step 3: Add `extraParams` optional prop to `InfinitePartsList`**

```typescript
export function InfinitePartsList({
  apiPath,
  initialParts,
  totalCount,
  extraParams = {},
}: {
  apiPath: string;
  initialParts: PartSummary[];
  totalCount: number;
  extraParams?: Record<string, string>;
}) {
```

Update `loadMore` to append extraParams:

```typescript
const qs = new URLSearchParams({ offset: String(offsetRef.current), ...extraParamsRef.current });
const res = await fetch(`${apiPath}?${qs.toString()}`);
```

Add a `extraParamsRef` to avoid stale closure (similar to existing `loadingRef` pattern):

```typescript
const extraParamsRef = useRef(extraParams);
useEffect(() => { extraParamsRef.current = extraParams; }, [extraParams]);
```

**Important:** When `extraParams` changes (user changes filter), we need to reset the list. Add a `useEffect` on `extraParams` that resets `parts`, `offsetRef`, and `exhaustedRef` to their initial state. Use a stable JSON-serialized key to detect changes.

```typescript
const extraParamsKey = JSON.stringify(extraParams);
useEffect(() => {
  setParts(initialParts);
  offsetRef.current = initialParts.length;
  exhaustedRef.current = initialParts.length >= totalCount;
  setExhausted(initialParts.length >= totalCount);
}, [extraParamsKey]); // eslint-disable-line react-hooks/exhaustive-deps
```

### 4d — Brand page: read searchParams, render filter UI

- [ ] **Step 4: Modify `src/app/marque/[marque]/page.tsx`**

Add `searchParams` to the component:

```typescript
type SearchParams = Promise<{ status?: string; sort?: string }>;

export default async function ManufacturerPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { marque } = await params;
  const { status, sort } = await searchParams;
  const data = await getManufacturerPageData(marque, PAGE_SIZE, { status, sort });
  if (!data) notFound();
```

Add filter UI above `InfinitePartsList`:

```tsx
{/* Filter bar */}
<div className="mt-6 flex flex-wrap items-center gap-2">
  {[
    { value: "", label: "Tous" },
    { value: "active", label: "Actifs" },
    { value: "obsolete", label: "Obsolètes" },
  ].map((f) => {
    const active = (status ?? "") === f.value;
    const href = buildBrandHref(marque, { status: f.value || undefined, sort });
    return (
      <Link key={f.value} href={href}
        className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
          active ? "bg-zinc-900 text-white" : "border border-zinc-200 text-zinc-600 hover:border-zinc-400"
        }`}>
        {f.label}
      </Link>
    );
  })}
  <div className="ml-auto flex items-center gap-2">
    {[
      { value: "", label: "Nom A→Z" },
      { value: "name_desc", label: "Nom Z→A" },
    ].map((s) => {
      const active = (sort ?? "") === s.value;
      const href = buildBrandHref(marque, { status, sort: s.value || undefined });
      return (
        <Link key={s.value} href={href}
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
            active ? "bg-zinc-900 text-white" : "border border-zinc-200 text-zinc-600 hover:border-zinc-400"
          }`}>
          {s.label}
        </Link>
      );
    })}
  </div>
</div>
```

Add the helper at the top of the file:

```typescript
function buildBrandHref(
  slug: string,
  params: { status?: string; sort?: string },
): string {
  const sp = new URLSearchParams();
  if (params.status) sp.set("status", params.status);
  if (params.sort) sp.set("sort", params.sort);
  const qs = sp.toString();
  return `/marque/${slug}${qs ? `?${qs}` : ""}`;
}
```

Pass `extraParams` to `InfinitePartsList`:

```tsx
<InfinitePartsList
  apiPath={`/api/marque/${marque}/parts`}
  initialParts={...}
  totalCount={data.totalCount}
  extraParams={{
    ...(status ? { status } : {}),
    ...(sort ? { sort } : {}),
  }}
/>
```

### 4e — Search page: add sort

- [ ] **Step 5: Extend `SearchOptions` in `src/lib/search/search-service.ts`**

```typescript
export interface SearchOptions {
  limit?: number;
  offset?: number;
  industry?: string;
  status?: string;
  manufacturerSlug?: string;
  sortBy?: "relevance" | "price_asc" | "price_desc" | "name_asc";
}
```

- [ ] **Step 6: Update `src/lib/search/postgres-search.ts` to respect `sortBy`**

The current `ORDER BY score DESC` is at the end of the SQL. Add sort logic:

```typescript
const sortBy = options.sortBy ?? "relevance";
let orderClause;
switch (sortBy) {
  case "price_asc":
    orderClause = sql`ORDER BY (SELECT MIN(price::numeric) FROM offers WHERE part_id = p.id) ASC NULLS LAST`;
    break;
  case "price_desc":
    orderClause = sql`ORDER BY (SELECT MIN(price::numeric) FROM offers WHERE part_id = p.id) DESC NULLS LAST`;
    break;
  case "name_asc":
    orderClause = sql`ORDER BY p.name ASC`;
    break;
  default:
    orderClause = sql`ORDER BY score DESC`;
}
```

Replace the hard-coded `ORDER BY score DESC` in the raw SQL with `${orderClause}`.

- [ ] **Step 7: Update `src/app/recherche/page.tsx`**

Add `sort` to the `Search` type and read it:

```typescript
type Search = Promise<{
  q?: string;
  industrie?: string;
  statut?: string;
  marque?: string;
  page?: string;
  sort?: string;
}>;
```

Add sort pills UI (below the status filter row, above the manufacturer dropdown):

```tsx
const SORT_FILTERS = [
  { value: "", label: "Pertinence" },
  { value: "price_asc", label: "Prix croissant" },
  { value: "price_desc", label: "Prix décroissant" },
  { value: "name_asc", label: "Nom A→Z" },
];
```

Pass `sortBy` to `searchService.search`:

```typescript
sortBy: (sort as SearchOptions["sortBy"]) || "relevance",
```

Add sort to `buildHref`:

```typescript
function buildHref(params: {
  q: string;
  industrie?: string;
  statut?: string;
  marque?: string;
  sort?: string;
  page?: number;
}): string {
  // ...
  if (params.sort) sp.set("sort", params.sort);
  // ...
}
```

- [ ] **Step 8: Build check**

```bash
npx tsc --noEmit 2>&1 | head -30
```

- [ ] **Step 9: Commit**

```bash
git add src/lib/queries.ts \
        src/app/api/marque/[marque]/parts/route.ts \
        src/components/infinite-parts-list.tsx \
        src/app/marque/[marque]/page.tsx \
        src/lib/search/search-service.ts \
        src/lib/search/postgres-search.ts \
        src/app/recherche/page.tsx
git commit -m "feat: status filter and sort on brand/search pages"
```

---

## Task 5: Similar parts on product page

**Files:**
- Modify: `src/lib/queries.ts` — add `getSimilarParts`
- Modify: `src/app/piece/[marque]/[ref]/page.tsx` — add section

### 5a — New query

- [ ] **Step 1: Add `getSimilarParts` to `src/lib/queries.ts`**

Strategy: 6 parts from same manufacturer + same category. Fallback: if < 6, fill with same manufacturer only.

```typescript
export async function getSimilarParts(
  partId: number,
  manufacturerId: number,
  categoryId: number | null,
  limit = 6,
) {
  const notSelf = sql`${parts.id} != ${partId}`;

  if (categoryId != null) {
    const withCategory = await db
      .select({ part: parts, manufacturer: manufacturers })
      .from(parts)
      .innerJoin(manufacturers, eq(manufacturers.id, parts.manufacturerId))
      .where(
        and(
          eq(parts.manufacturerId, manufacturerId),
          eq(parts.categoryId, categoryId),
          notSelf,
        ),
      )
      .orderBy(asc(parts.referenceNormalized))
      .limit(limit);

    if (withCategory.length >= limit) return withCategory;

    // Fallback: fill remainder from same manufacturer
    const existingIds = withCategory.map((r) => r.part.id);
    const needed = limit - withCategory.length;
    const idExclusion = existingIds.length > 0
      ? sql`${parts.id} NOT IN (${sql.join(existingIds.map((id) => sql`${id}`), sql`, `)})`
      : sql`true`;

    const fallback = await db
      .select({ part: parts, manufacturer: manufacturers })
      .from(parts)
      .innerJoin(manufacturers, eq(manufacturers.id, parts.manufacturerId))
      .where(and(eq(parts.manufacturerId, manufacturerId), notSelf, idExclusion))
      .orderBy(asc(parts.referenceNormalized))
      .limit(needed);

    return [...withCategory, ...fallback];
  }

  return db
    .select({ part: parts, manufacturer: manufacturers })
    .from(parts)
    .innerJoin(manufacturers, eq(manufacturers.id, parts.manufacturerId))
    .where(and(eq(parts.manufacturerId, manufacturerId), notSelf))
    .orderBy(asc(parts.referenceNormalized))
    .limit(limit);
}
```

### 5b — Add section to part page

- [ ] **Step 2: Update `src/app/piece/[marque]/[ref]/page.tsx`**

Add the import:
```typescript
import { getPartDetail, getSimilarParts } from "@/lib/queries";
```

Fetch similar parts alongside the detail (add to a `Promise.all` or a separate call after `getPartDetail`). Since `getPartDetail` already runs, fetch similar parts in the page body:

```typescript
const detail = await getPartDetail(marque, ref);
if (!detail) notFound();
const { part, manufacturer, category } = detail;

const similarParts = await getSimilarParts(
  part.id,
  manufacturer.id,  // Note: getPartDetail returns manufacturer.id
  category?.id ?? null,
  6,
);
```

Wait — `getPartDetail` returns `{ part, manufacturer, category }` where `manufacturer` is from the `manufacturers` table (has `id` field). Check: yes, `manufacturer.id` is available.

Add the similar parts section just before the "Où acheter" section:

```tsx
{similarParts.length > 0 && (
  <section className="mt-8">
    <h2 className="text-xl font-semibold">
      Pièces similaires de {manufacturer.name}
    </h2>
    <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {similarParts.map(({ part: p, manufacturer: m }) => (
        <PartCard
          key={p.id}
          href={`/piece/${m.slug}/${p.slug}`}
          name={p.name}
          referenceRaw={p.referenceRaw}
          manufacturerName={m.name}
          manufacturerSlug={m.slug}
          status={p.status}
          watchlistData={{
            reference: p.referenceRaw,
            manufacturer: m.name,
            manufacturerSlug: m.slug,
            partSlug: p.slug,
            name: p.name,
            status: p.status,
          }}
        />
      ))}
    </div>
  </section>
)}
```

- [ ] **Step 3: Build check**

```bash
npx tsc --noEmit 2>&1 | head -30
```

- [ ] **Step 4: Commit**

```bash
git add src/lib/queries.ts src/app/piece/[marque]/[ref]/page.tsx
git commit -m "feat: similar parts on product page"
```

---

## Task 6: Enterprise homepage

**Files:**
- Modify: `src/app/page.tsx` — full refactor
- Modify: `src/lib/queries.ts` — add `getHomepageData` convenience function

### 6a — New homepage data query

- [ ] **Step 1: Add `getHomepageData` to `src/lib/queries.ts`**

```typescript
export async function getHomepageData() {
  const [stats, manufacturersWithCounts, categoriesWithCounts] = await Promise.all([
    getHomeStats(),
    getManufacturersWithCounts(),
    getCategoriesWithCounts(),
  ]);

  const topManufacturers = [...manufacturersWithCounts]
    .sort((a, b) => b.partsCount - a.partsCount)
    .slice(0, 12);

  const topCategories = [...categoriesWithCounts]
    .sort((a, b) => b.partsCount - a.partsCount)
    .slice(0, 8);

  const categoriesCount = categoriesWithCounts.filter((c) => c.partsCount > 0).length;

  return {
    stats: {
      partsCount: stats.partsCount,
      manufacturersCount: stats.manufacturersCount,
      categoriesCount,
    },
    topManufacturers,
    topCategories,
  };
}
```

### 6b — Rewrite page.tsx

- [ ] **Step 2: Replace `src/app/page.tsx`**

Key structural changes vs current:
- Keep `force-dynamic`
- Hero: new enterprise copy + same SearchBar component
- Stats: 3 columns (refs, marques, catégories) using new `getHomepageData`
- Remove the 4-col stats block
- Brand section: 12 top brands as logo grid using `BrandLogo` component
- Category tiles: 6–8 top categories as clickable tiles → `/categorie/[slug]`
- Liste CTA: new block
- Remove "Verticales" section (replaced by category tiles)
- Keep supersessions section
- Keep "Comment ça marche" section

```typescript
import Link from "next/link";
import { SearchBar } from "@/components/search-bar";
import { BrandLogo } from "@/components/brand-logo";
import { PartCard } from "@/components/part-card";
import { getHomepageData, getRecentSupersessions } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let data = {
    stats: { partsCount: 0, manufacturersCount: 0, categoriesCount: 0 },
    topManufacturers: [] as Awaited<ReturnType<typeof getHomepageData>>["topManufacturers"],
    topCategories: [] as Awaited<ReturnType<typeof getHomepageData>>["topCategories"],
  };
  let supersessionRows: Awaited<ReturnType<typeof getRecentSupersessions>> = [];
  try {
    [data, supersessionRows] = await Promise.all([
      getHomepageData(),
      getRecentSupersessions(4),
    ]);
  } catch {
    // DB unavailable: home stays usable without data sections.
  }

  const { stats, topManufacturers, topCategories } = data;

  return (
    <div>
      {/* Hero */}
      <section className="relative -mx-4 -mt-8 bg-zinc-950 px-4 pb-20 pt-16 text-center">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{ background: "radial-gradient(60% 50% at 50% 0%, rgba(37,99,235,0.35), transparent)" }}
        />
        <div className="relative mx-auto max-w-3xl">
          <p className="mb-4 inline-block rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1 text-sm font-medium text-blue-300">
            Industrie & Informatique
          </p>
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Le catalogue de référence{" "}
            <span className="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
              pour les pièces industrielles et IT
            </span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-zinc-400">
            Trouvez, comparez et accédez aux revendeurs en quelques secondes.
          </p>
          <div className="mt-8">
            <SearchBar autoFocus large />
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-sm text-zinc-500">
            <span>Essayez :</span>
            {["6SE6440-2UD21-5AA1", "PWR-C1-715WAC", "1756-L61"].map((ref) => (
              <Link
                key={ref}
                href={`/recherche?q=${encodeURIComponent(ref)}`}
                className="rounded-full border border-zinc-700 px-3 py-1 font-mono text-xs text-zinc-300 transition hover:border-blue-500 hover:text-blue-300"
              >
                {ref}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Key numbers */}
      {stats.partsCount > 0 && (
        <section className="relative z-10 -mt-10 mb-12">
          <div className="mx-auto grid max-w-3xl grid-cols-3 gap-3">
            {[
              { value: stats.partsCount.toLocaleString("fr-FR"), label: "références" },
              { value: stats.manufacturersCount.toLocaleString("fr-FR"), label: "marques" },
              { value: stats.categoriesCount.toLocaleString("fr-FR"), label: "catégories" },
            ].map((s) => (
              <div key={s.label} className="rounded-xl border border-zinc-200 bg-white p-4 text-center shadow-sm">
                <div className="text-2xl font-bold text-zinc-900">{s.value}</div>
                <div className="mt-1 text-xs text-zinc-500">{s.label}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Top brands grid */}
      {topManufacturers.length > 0 && (
        <section className="mb-14">
          <h2 className="text-2xl font-bold tracking-tight">Marques populaires</h2>
          <div className="mt-5 grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
            {topManufacturers.map(({ manufacturer: m }) => (
              <Link
                key={m.id}
                href={`/marque/${m.slug}`}
                className="flex flex-col items-center gap-2 rounded-xl border border-zinc-200 p-4 text-center transition hover:border-blue-400 hover:shadow-sm"
              >
                <BrandLogo slug={m.slug} name={m.name} size={40} />
                <span className="text-xs font-medium text-zinc-700">{m.name}</span>
              </Link>
            ))}
          </div>
          <div className="mt-4 text-right">
            <Link href="/marques" className="text-sm text-zinc-500 hover:text-zinc-900">
              Toutes les marques →
            </Link>
          </div>
        </section>
      )}

      {/* Category tiles */}
      {topCategories.length > 0 && (
        <section className="mb-14">
          <h2 className="text-2xl font-bold tracking-tight">Catégories principales</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {topCategories.slice(0, 8).map(({ category, partsCount }) => (
              <Link
                key={category.id}
                href={`/categorie/${category.slug}`}
                className="rounded-xl border border-zinc-200 p-4 transition hover:border-blue-400 hover:shadow-sm"
              >
                <div className="font-semibold text-zinc-900">{category.name}</div>
                <div className="mt-1 text-sm text-zinc-500">{partsCount} référence{partsCount > 1 ? "s" : ""} →</div>
              </Link>
            ))}
          </div>
          <div className="mt-4 text-right">
            <Link href="/categories" className="text-sm text-zinc-500 hover:text-zinc-900">
              Toutes les catégories →
            </Link>
          </div>
        </section>
      )}

      {/* Recent supersessions */}
      {supersessionRows.length > 0 && (
        <section className="mb-14">
          <h2 className="text-2xl font-bold tracking-tight">Pièce obsolète ? Voici son remplacement</h2>
          <p className="mt-1 text-zinc-500">Chaînes de remplacement officielles annoncées par les fabricants.</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {supersessionRows.map(({ oldPart, oldManufacturer, newPart }) => (
              <Link
                key={oldPart.id}
                href={`/piece/${oldManufacturer.slug}/${oldPart.slug}`}
                className="rounded-xl border border-zinc-200 p-4 transition hover:border-blue-400 hover:shadow-sm"
              >
                <div className="flex items-center gap-2 text-sm">
                  <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">Obsolète</span>
                  <span className="truncate font-mono text-zinc-600">{oldManufacturer.name} {oldPart.referenceRaw}</span>
                </div>
                <div className="my-2 text-zinc-400">↓ remplacée par</div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">Fabriquée</span>
                  <span className="truncate font-mono font-medium text-zinc-900">{newPart.referenceRaw}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Liste CTA */}
      <section className="mb-14 rounded-2xl border border-blue-200 bg-blue-50 p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-bold text-zinc-900">Gérez vos références</h2>
            <p className="mt-1 text-sm text-zinc-600 max-w-md">
              Constituez votre liste de pièces à surveiller, exportez-la en CSV et comparez vos références en un coup d&apos;œil.
            </p>
          </div>
          <Link
            href="/liste"
            className="shrink-0 rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            Voir ma liste →
          </Link>
        </div>
      </section>

      {/* Comment ça marche */}
      <section className="mb-8 rounded-2xl bg-zinc-50 p-8">
        <h2 className="text-2xl font-bold tracking-tight">Comment ça marche</h2>
        <div className="mt-6 grid gap-6 sm:grid-cols-3">
          {[
            { step: "1", title: "Entrez une référence", text: "Avec ou sans tirets et espaces — la recherche tolère les variantes d'écriture et les fautes de frappe." },
            { step: "2", title: "Vérifiez le statut", text: "Encore fabriquée ou obsolète ? Si elle est remplacée, la référence officielle du successeur est affichée." },
            { step: "3", title: "Comparez les vendeurs", text: "Constructeur, distributeur, reconditionné ou occasion : les offres triées par prix, avec disponibilité." },
          ].map((item) => (
            <div key={item.step}>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 font-bold text-white">{item.step}</div>
              <h3 className="mt-3 font-semibold text-zinc-900">{item.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-zinc-500">{item.text}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
```

- [ ] **Step 3: Build check + TypeScript**

```bash
npx tsc --noEmit && npm run build 2>&1 | tail -30
```

- [ ] **Step 4: Commit**

```bash
git add src/lib/queries.ts src/app/page.tsx
git commit -m "feat: enterprise-oriented homepage"
```

---

## Final step: Push

- [ ] **Push all commits**

```bash
git push
```

---

## Implementation notes

- **`getCategoryBySlug` in API route:** Added to queries.ts in Task 3, Step 1 alongside the other category queries, before the API route is created.
- **`and()` with spread:** Drizzle's `and()` accepts `...SQLWrapper[]`. When building `conditions` arrays, use `and(...conditions)`.
- **`sql` tag for NOT IN fallback:** If `existingIds` is empty, skip the NOT IN clause entirely to avoid SQL errors.
- **InfinitePartsList reset on filter change:** When the user changes filters on the brand page, Next.js does a full SSR render (new searchParams → new page), so the list always starts fresh. The `extraParamsKey` reset logic in the component is a safety net for any future client-side filter scenario.
- **`getManufacturerPartsPaginatedFiltered` import:** Remember to add it to the imports in `api/marque/[marque]/parts/route.ts`.
- **`desc` import in queries.ts:** Add `desc` to the Drizzle import at line 1.
