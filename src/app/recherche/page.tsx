import type { Metadata } from "next";
import Link from "next/link";
import { unstable_cache } from "next/cache";
import { SearchBar } from "@/components/search-bar";
import { PartCard } from "@/components/part-card";
import { SuggestionForm } from "@/components/suggestion-form";
import { SearchLoadMore } from "@/components/search-load-more";
import { FilterSelect, FiltersPanel, type FilterOption } from "@/components/search-filters";
import { searchService } from "@/lib/search/postgres-search";
import { withCardExtras, type SearchResult } from "@/lib/search/search-results";
import { getAllManufacturers, getAllCategories, getManufacturersSuggestions } from "@/lib/queries";
import { SEARCH_SORTS, type SearchIndustry, type SearchStatus } from "@/lib/search/search-service";
import { REFERENCE_EXAMPLES } from "@/lib/search-examples";
import { enumParam } from "@/lib/params";

const getCachedManufacturers = unstable_cache(
  getAllManufacturers,
  ["all-manufacturers"],
  { revalidate: 600 },
);

const getCachedCategories = unstable_cache(
  getAllCategories,
  ["all-categories"],
  { revalidate: 600 },
);

export const dynamic = "force-dynamic";

type Search = Promise<{
  q?: string;
  industrie?: string;
  statut?: string;
  marque?: string;
  categorie?: string;
  page?: string;
  sort?: string;
  stock?: string;
}>;

const PAGE_SIZE = 20;

const INDUSTRY_FILTERS: { value: SearchIndustry | ""; label: string }[] = [
  { value: "", label: "Tous secteurs" },
  { value: "industrie", label: "Industrie" },
  { value: "informatique", label: "Informatique" },
];

const STATUS_FILTERS: { value: SearchStatus | ""; label: string }[] = [
  { value: "", label: "Tous statuts" },
  { value: "active", label: "Fabriquées" },
  { value: "obsolete", label: "Obsolètes" },
];

const SORT_FILTERS = [
  { value: "", label: "Tri : pertinence" },
  { value: "price_asc", label: "Tri : prix croissant" },
  { value: "price_desc", label: "Tri : prix décroissant" },
  { value: "name_asc", label: "Tri : nom A→Z" },
];

type HrefParams = {
  q: string;
  industrie?: string;
  statut?: string;
  marque?: string;
  categorie?: string;
  sort?: string;
  stock?: boolean;
  page?: number;
};

/** Construit une URL /recherche en omettant les paramètres vides. */
function buildHref(params: HrefParams): string {
  const sp = new URLSearchParams();
  sp.set("q", params.q);
  if (params.industrie) sp.set("industrie", params.industrie);
  if (params.statut) sp.set("statut", params.statut);
  if (params.marque) sp.set("marque", params.marque);
  if (params.categorie) sp.set("categorie", params.categorie);
  if (params.sort) sp.set("sort", params.sort);
  if (params.stock) sp.set("stock", "1");
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
    robots: { index: false },
    alternates: { canonical: "/recherche" },
  };
}

/** Groupe de filtres exclusifs (liens) présenté comme un sélecteur segmenté. */
function Segment({ label, items }: { label: string; items: { label: string; href: string; active: boolean }[] }) {
  return (
    <div role="group" aria-label={label} className="inline-flex flex-wrap rounded-full border border-zinc-200 bg-white p-0.5">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          scroll={false}
          aria-current={item.active ? "true" : undefined}
          className={`rounded-full px-3 py-1 text-sm font-medium transition ${
            item.active ? "bg-zinc-900 text-white" : "text-zinc-600 hover:text-zinc-900"
          }`}
        >
          {item.label}
        </Link>
      ))}
    </div>
  );
}

/** Page sans requête : aide à formuler la recherche plutôt qu'une page vide. */
function SearchLanding() {
  const tips = [
    {
      title: "Par référence",
      text: "Avec ou sans espaces, tirets ni points : la recherche les ignore et tolère les fautes de frappe.",
      examples: REFERENCE_EXAMPLES,
    },
    {
      title: "Marque + référence",
      text: "Le nom du fabricant, où qu'il soit dans la saisie, fait remonter ses pièces en premier.",
      examples: ["Siemens 6ES7214", "Cisco PWR-C1"],
    },
    {
      title: "Par désignation",
      text: "Un type de pièce, une caractéristique : la recherche porte aussi sur les noms et descriptions.",
      examples: ["variateur", "alimentation serveur"],
    },
  ];
  return (
    <div className="mt-10">
      <h1 className="text-2xl font-bold tracking-tight">Rechercher une pièce</h1>
      <p className="mt-2 max-w-2xl text-zinc-600">
        Statut de fabrication, remplacement officiel et offres des vendeurs, à partir d&apos;une
        simple référence.
      </p>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {tips.map((tip) => (
          <div key={tip.title} className="rounded-xl border border-zinc-200 p-4">
            <h2 className="font-semibold text-zinc-900">{tip.title}</h2>
            <p className="mt-1 text-sm text-zinc-500">{tip.text}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {tip.examples.map((example) => (
                <Link
                  key={example}
                  href={buildHref({ q: example })}
                  className="rounded-full border border-zinc-200 px-3 py-1 font-mono text-xs text-zinc-700 transition hover:border-blue-400 hover:text-blue-700"
                >
                  {example}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium">
        <Link href="/technicien" className="text-blue-700 hover:underline">
          Plusieurs références à vérifier ? Recherche par lot →
        </Link>
        <Link href="/marques" className="text-zinc-600 hover:text-zinc-900 hover:underline">
          Parcourir les marques
        </Link>
        <Link href="/categories" className="text-zinc-600 hover:text-zinc-900 hover:underline">
          Parcourir les catégories
        </Link>
      </div>
    </div>
  );
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Search;
}) {
  const { q, industrie, statut, marque, categorie, page: pageParam, sort, stock } = await searchParams;
  const query = q?.trim() ?? "";

  if (!query) {
    return (
      <div>
        <SearchBar autoFocus shortcut />
        <SearchLanding />
      </div>
    );
  }

  const industry = enumParam(industrie, ["industrie", "informatique"] as const);
  const status = enumParam(statut, ["active", "obsolete"] as const);
  const validSort = enumParam(sort, SEARCH_SORTS.filter((s) => s !== "relevance"));
  const inStock = stock === "1";
  const page = Math.max(1, Number.parseInt(pageParam ?? "1", 10) || 1);
  const offset = (page - 1) * PAGE_SIZE;

  // limit+1 : on demande une pièce de plus que la page pour savoir s'il y a
  // une page suivante, sans requête de comptage séparée.
  const [rawHits, manufacturers, allCategories] = await Promise.all([
    searchService.search(query, {
      limit: PAGE_SIZE + 1,
      offset,
      industry,
      status,
      manufacturerSlug: marque || undefined,
      categorySlug: categorie || undefined,
      sortBy: validSort ?? "relevance",
      inStock: inStock || undefined,
    }),
    getCachedManufacturers(),
    getCachedCategories(),
  ]);
  const hasNext = rawHits.length > PAGE_SIZE;
  const [hits, manufacturerSuggestions]: [SearchResult[], { name: string; slug: string }[]] =
    await Promise.all([
      withCardExtras(rawHits.slice(0, PAGE_SIZE)),
      rawHits.length === 0 ? getManufacturersSuggestions(query) : [],
    ]);

  const countLabel = hasNext
    ? `Plus de ${offset + PAGE_SIZE} résultats`
    : `${offset + hits.length} résultat${offset + hits.length > 1 ? "s" : ""}`;
  const base: HrefParams = { q: query, industrie: industry, statut: status, marque, categorie, sort: validSort, stock: inStock || undefined };
  const activeFilters = [industry, status, inStock || undefined, marque, categorie].filter(Boolean).length;
  const clearFiltersHref = buildHref({ q: query, sort: validSort });
  const loadMoreQuery = new URLSearchParams({
    q: query,
    ...(industry ? { industrie: industry } : {}),
    ...(status ? { statut: status } : {}),
    ...(marque ? { marque } : {}),
    ...(categorie ? { categorie } : {}),
    ...(validSort ? { sort: validSort } : {}),
    ...(inStock ? { stock: "1" } : {}),
  }).toString();

  const selectOptions = (
    key: "marque" | "categorie" | "sort",
    allLabel: string | null,
    items: { value: string; label: string }[],
  ): FilterOption[] =>
    [...(allLabel ? [{ value: "", label: allLabel }] : []), ...items].map((item) => ({
      ...item,
      href: buildHref({ ...base, [key]: item.value || undefined }),
    }));

  return (
    <div>
      <SearchBar defaultValue={query} shortcut />

      <div className="mt-6 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h1 className="text-xl font-semibold tracking-tight">
          Résultats pour «&nbsp;<span className="font-mono">{query}</span>&nbsp;»
        </h1>
        <p className="text-sm text-zinc-500">{countLabel}</p>
      </div>

      <FiltersPanel activeCount={activeFilters}>
        <div className="flex flex-wrap items-center gap-2">
          <Segment
            label="Secteur"
            items={INDUSTRY_FILTERS.map((f) => ({
              label: f.label,
              href: buildHref({ ...base, industrie: f.value || undefined }),
              active: (industry ?? "") === f.value,
            }))}
          />
          <Segment
            label="Statut de fabrication"
            items={STATUS_FILTERS.map((f) => ({
              label: f.label,
              href: buildHref({ ...base, statut: f.value || undefined }),
              active: (status ?? "") === f.value,
            }))}
          />
          <Link
            href={buildHref({ ...base, stock: !inStock || undefined })}
            scroll={false}
            aria-current={inStock ? "true" : undefined}
            title="Uniquement les pièces ayant au moins une offre avec un prix"
            className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
              inStock
                ? "bg-green-700 text-white"
                : "border border-zinc-200 text-zinc-600 hover:border-zinc-400"
            }`}
          >
            {inStock ? "✓ " : ""}Avec prix
          </Link>
        </div>
        <form action="/recherche" method="get" className="flex flex-wrap items-center gap-2">
          <input type="hidden" name="q" value={query} />
          {industry && <input type="hidden" name="industrie" value={industry} />}
          {status && <input type="hidden" name="statut" value={status} />}
          {inStock && <input type="hidden" name="stock" value="1" />}
          <FilterSelect
            name="marque"
            label="Marque"
            value={marque ?? ""}
            options={selectOptions("marque", "Toutes les marques", manufacturers.map((m) => ({ value: m.slug, label: m.name })))}
          />
          {allCategories.length > 0 && (
            <FilterSelect
              name="categorie"
              label="Catégorie"
              value={categorie ?? ""}
              options={selectOptions("categorie", "Toutes les catégories", allCategories.map((c) => ({ value: c.slug, label: c.name })))}
            />
          )}
          <FilterSelect
            name="sort"
            label="Tri des résultats"
            value={validSort ?? ""}
            options={selectOptions("sort", null, SORT_FILTERS)}
          />
          <noscript>
            <button
              type="submit"
              className="rounded-full border border-zinc-200 px-4 py-1.5 text-sm font-medium text-zinc-600"
            >
              Filtrer
            </button>
          </noscript>
          {activeFilters > 0 && (
            <Link href={clearFiltersHref} scroll={false} className="ml-1 text-sm text-zinc-500 underline hover:text-zinc-900">
              Effacer les filtres
            </Link>
          )}
        </form>
      </FiltersPanel>

      <div className="mt-5 grid gap-3">
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
            updatedAt={hit.updatedAt}
            extras={hit.extras}
            watchlistData={{
              reference: hit.referenceRaw,
              manufacturer: hit.manufacturerName,
              manufacturerSlug: hit.manufacturerSlug,
              partSlug: hit.slug,
              name: hit.name,
              status: hit.status,
              minPrice: hit.extras.minPrice ?? undefined,
              currency: hit.extras.currency,
            }}
          />
        ))}
      </div>

      {page > 1 && (
        <nav aria-label="Pagination" className="mt-4 flex items-center justify-center gap-4 text-sm font-medium">
          <Link
            href={buildHref({ ...base, page: page - 1 })}
            className="rounded-full border border-zinc-200 px-4 py-2 text-zinc-600 transition hover:border-zinc-400"
          >
            ← Page précédente
          </Link>
          <span className="text-zinc-500">Page {page}</span>
        </nav>
      )}

      {hits.length > 0 && (
        <SearchLoadMore
          // Remonté à chaque nouvelle recherche : un changement de filtre
          // (navigation client) ne doit pas conserver les résultats chargés avant.
          key={`${loadMoreQuery}|${offset}`}
          initialHasMore={hasNext}
          initialOffset={offset + hits.length}
          searchQuery={loadMoreQuery}
        />
      )}

      {hits.length === 0 && (
        <div className="mt-8 space-y-6">
          <div className="rounded-2xl border border-dashed border-zinc-300 p-8 text-center">
            {activeFilters > 0 ? (
              <>
                <p className="font-medium text-zinc-700">Aucun résultat avec ces filtres.</p>
                <Link
                  href={clearFiltersHref}
                  className="mt-4 inline-block rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700"
                >
                  Effacer les filtres ({activeFilters})
                </Link>
              </>
            ) : (
              <>
                <p className="font-medium text-zinc-700">
                  Aucun résultat pour &laquo;&nbsp;{query}&nbsp;&raquo;
                </p>
                {manufacturerSuggestions.length > 0 && (
                  <div className="mt-3">
                    <p className="text-sm text-zinc-500">Voir les pièces de :</p>
                    <div className="mt-2 flex flex-wrap justify-center gap-2">
                      {manufacturerSuggestions.map((m) => (
                        <Link
                          key={m.slug}
                          href={`/marque/${m.slug}`}
                          className="rounded-full border border-zinc-300 px-4 py-1.5 text-sm font-medium text-zinc-700 transition hover:border-blue-400 hover:text-blue-600"
                        >
                          {m.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
                <ul className="mx-auto mt-4 max-w-md space-y-1 text-left text-sm text-zinc-500">
                  <li>• Vérifiez les caractères ambigus : la lettre O et le chiffre 0, la lettre I et le chiffre 1.</li>
                  <li>• Essayez le début de la référence seulement (ex : « 6ES7214 »).</li>
                  <li>• Ajoutez ou retirez le nom du fabricant.</li>
                </ul>
              </>
            )}
          </div>
          {activeFilters === 0 && <SuggestionForm defaultReference={query} />}
        </div>
      )}
    </div>
  );
}
