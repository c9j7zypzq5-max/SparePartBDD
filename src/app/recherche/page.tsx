import type { Metadata } from "next";
import Link from "next/link";
import { SearchBar } from "@/components/search-bar";
import { PartCard } from "@/components/part-card";
import { SuggestionForm } from "@/components/suggestion-form";
import { searchService } from "@/lib/search/postgres-search";
import { getAllManufacturers } from "@/lib/queries";
import type { SearchOptions } from "@/lib/search/search-service";

export const dynamic = "force-dynamic";

type Search = Promise<{
  q?: string;
  industrie?: string;
  statut?: string;
  marque?: string;
  page?: string;
  sort?: string;
}>;

const PAGE_SIZE = 20;

const INDUSTRY_FILTERS = [
  { value: "", label: "Tous" },
  { value: "industrie", label: "Industrie" },
  { value: "informatique", label: "Informatique" },
];

const STATUS_FILTERS = [
  { value: "", label: "Tous statuts" },
  { value: "active", label: "Fabriquées" },
  { value: "obsolete", label: "Obsolètes" },
];

const SORT_FILTERS = [
  { value: "", label: "Pertinence" },
  { value: "price_asc", label: "Prix croissant" },
  { value: "price_desc", label: "Prix décroissant" },
  { value: "name_asc", label: "Nom A→Z" },
];

/** Construit une URL /recherche en omettant les paramètres vides. */
function buildHref(params: {
  q: string;
  industrie?: string;
  statut?: string;
  marque?: string;
  sort?: string;
  page?: number;
}): string {
  const sp = new URLSearchParams();
  sp.set("q", params.q);
  if (params.industrie) sp.set("industrie", params.industrie);
  if (params.statut) sp.set("statut", params.statut);
  if (params.marque) sp.set("marque", params.marque);
  if (params.sort) sp.set("sort", params.sort);
  if (params.page && params.page > 1) sp.set("page", String(params.page));
  return `/recherche?${sp.toString()}`;
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Search;
}): Promise<Metadata> {
  const { q } = await searchParams;
  return {
    title: q ? `Résultats pour « ${q} »` : "Recherche",
    robots: { index: false }, // les pages de résultats ne doivent pas être indexées
  };
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Search;
}) {
  const { q, industrie, statut, marque, page: pageParam, sort } = await searchParams;
  const query = q?.trim() ?? "";
  const industry = INDUSTRY_FILTERS.some((f) => f.value === industrie)
    ? industrie
    : undefined;
  const status = STATUS_FILTERS.some((f) => f.value === statut)
    ? statut
    : undefined;
  const page = Math.max(1, Number.parseInt(pageParam ?? "1", 10) || 1);

  // limit+1 : on demande une pièce de plus que la page pour savoir s'il y a
  // une page suivante, sans requête de comptage séparée.
  const [rawHits, manufacturers] = query
    ? await Promise.all([
        searchService.search(query, {
          limit: PAGE_SIZE + 1,
          offset: (page - 1) * PAGE_SIZE,
          industry: industry || undefined,
          status: status || undefined,
          manufacturerSlug: marque || undefined,
          sortBy: (sort as SearchOptions["sortBy"]) || "relevance",
        }),
        getAllManufacturers(),
      ])
    : [[], []];
  const hasNext = rawHits.length > PAGE_SIZE;
  const hits = rawHits.slice(0, PAGE_SIZE);
  const countLabel = hasNext
    ? `Plus de ${page * PAGE_SIZE} résultats`
    : `${(page - 1) * PAGE_SIZE + hits.length} résultat${(page - 1) * PAGE_SIZE + hits.length > 1 ? "s" : ""}`;

  const validSort = SORT_FILTERS.some((f) => f.value === sort) ? sort : undefined;
  const base = { q: query, industrie: industry, statut: status, marque, sort: validSort };

  return (
    <div>
      <SearchBar defaultValue={query} />

      {query && (
        <>
          <div className="mt-5 flex flex-wrap items-center gap-2">
            {INDUSTRY_FILTERS.map((f) => {
              const active = (industry ?? "") === f.value;
              return (
                <Link
                  key={f.value}
                  href={buildHref({ ...base, industrie: f.value || undefined })}
                  className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                    active
                      ? "bg-zinc-900 text-white"
                      : "border border-zinc-200 text-zinc-600 hover:border-zinc-400"
                  }`}
                >
                  {f.label}
                </Link>
              );
            })}
            <span className="ml-auto text-sm text-zinc-500">{countLabel}</span>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-2">
            {STATUS_FILTERS.map((f) => {
              const active = (status ?? "") === f.value;
              return (
                <Link
                  key={f.value}
                  href={buildHref({ ...base, statut: f.value || undefined })}
                  className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                    active
                      ? "bg-zinc-900 text-white"
                      : "border border-zinc-200 text-zinc-600 hover:border-zinc-400"
                  }`}
                >
                  {f.label}
                </Link>
              );
            })}

            <form action="/recherche" method="get" className="ml-auto flex items-center gap-2">
              <input type="hidden" name="q" value={query} />
              {industry && <input type="hidden" name="industrie" value={industry} />}
              {status && <input type="hidden" name="statut" value={status} />}
              <select
                name="marque"
                defaultValue={marque ?? ""}
                className="rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-sm text-zinc-600"
              >
                <option value="">Toutes les marques</option>
                {manufacturers.map((m) => (
                  <option key={m.id} value={m.slug}>
                    {m.name}
                  </option>
                ))}
              </select>
              <select
                name="sort"
                defaultValue={validSort ?? ""}
                className="rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-sm text-zinc-600"
              >
                {SORT_FILTERS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                className="rounded-full border border-zinc-200 px-4 py-1.5 text-sm font-medium text-zinc-600 transition hover:border-zinc-400"
              >
                Filtrer
              </button>
            </form>
          </div>
        </>
      )}

      <div className="mt-4 grid gap-3">
        {hits.map((hit) => (
          <PartCard
            key={hit.partId}
            href={`/piece/${hit.manufacturerSlug}/${hit.slug}`}
            name={hit.name}
            referenceRaw={hit.referenceRaw}
            manufacturerName={hit.manufacturerName}
            manufacturerSlug={hit.manufacturerSlug}
            status={hit.status}
            industry={hit.industry}
            watchlistData={{
              reference: hit.referenceRaw,
              manufacturer: hit.manufacturerName,
              manufacturerSlug: hit.manufacturerSlug,
              partSlug: hit.slug,
              name: hit.name,
              status: hit.status,
            }}
          />
        ))}
      </div>

      {query && (page > 1 || hasNext) && (
        <nav className="mt-8 flex items-center justify-center gap-4 text-sm font-medium">
          {page > 1 && (
            <Link
              href={buildHref({ ...base, page: page - 1 })}
              className="rounded-full border border-zinc-200 px-4 py-2 text-zinc-600 transition hover:border-zinc-400"
            >
              ← Page précédente
            </Link>
          )}
          <span className="text-zinc-500">Page {page}</span>
          {hasNext && (
            <Link
              href={buildHref({ ...base, page: page + 1 })}
              className="rounded-full border border-zinc-200 px-4 py-2 text-zinc-600 transition hover:border-zinc-400"
            >
              Page suivante →
            </Link>
          )}
        </nav>
      )}

      {query && hits.length === 0 && (
        <div className="mt-10 space-y-6">
          <div className="rounded-2xl border border-dashed border-zinc-300 p-8 text-center">
            <p className="font-medium text-zinc-700">Aucune pièce trouvée</p>
            <p className="mt-1 text-sm text-zinc-500">
              Essayez avec la référence complète, sans espaces ni tirets, ou
              élargissez les filtres d&apos;industrie, de statut ou de marque.
            </p>
          </div>
          <SuggestionForm defaultReference={query} />
        </div>
      )}
    </div>
  );
}
