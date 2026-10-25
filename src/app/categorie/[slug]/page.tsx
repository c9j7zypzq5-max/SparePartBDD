import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCategoryPageData, getPartCardExtras } from "@/lib/queries";
import { InfinitePartsList } from "@/components/infinite-parts-list";
import { Breadcrumb } from "@/components/breadcrumb";
import { DownloadIcon } from "@/components/icons";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 24;

type Params = Promise<{ slug: string }>;
type SearchParams = Promise<{ page?: string }>;

function buildCategoryHref(slug: string, page: number): string {
  return page > 1 ? `/categorie/${slug}?page=${page}` : `/categorie/${slug}`;
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const data = await getCategoryPageData(slug, 1);
  if (!data) return { title: "Catégorie introuvable" };
  const title = `${data.category.name} — pièces détachées par référence`;
  const description = `Catalogue des pièces ${data.category.name} : statut de fabrication, remplacements et vendeurs.`;
  return {
    title,
    description,
    alternates: { canonical: `/categorie/${slug}` },
    openGraph: {
      title,
      description,
      type: "website",
      images: [{ url: "/og-default.jpg" }],
    },
    twitter: { card: "summary" },
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { slug } = await params;
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);
  const offset = (page - 1) * PAGE_SIZE;
  const data = await getCategoryPageData(slug, PAGE_SIZE, { offset });
  if (!data) notFound();

  const hasNextPage = data.totalCount > page * PAGE_SIZE;
  const extras = await getPartCardExtras(data.parts.map(({ part }) => part));

  return (
    <div>
      <Breadcrumb items={[{ label: "Catégories", href: "/categories" }, { label: data.category.name, href: `/categorie/${slug}` }]} />
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{data.category.name}</h1>
          <p className="mt-2 text-zinc-600">
            <span className="capitalize">{data.category.industry}</span>
            {" · "}
            {data.totalCount} pièce{data.totalCount > 1 ? "s" : ""} référencée
            {data.totalCount > 1 ? "s" : ""}
          </p>
        </div>
        <a
          href={`/api/categorie/${slug}/export`}
          className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:border-zinc-500 hover:text-zinc-900"
        >
          <DownloadIcon />
          Exporter CSV
        </a>
      </div>
      {page > 1 && (
        <p className="mt-3 text-sm text-zinc-500">Page {page}</p>
      )}
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
          extras: extras.get(part.id),
        }))}
        totalCount={data.totalCount}
        initialOffset={offset}
      />

      {/* Pagination sans JavaScript uniquement (sinon chargement au défilement). */}
      {(page > 1 || hasNextPage) && (
        <noscript>
          <nav aria-label="Pagination" className="mt-8 flex items-center justify-center gap-4 text-sm font-medium">
            {page > 1 && (
              <Link
                href={buildCategoryHref(slug, page - 1)}
                className="rounded-full border border-zinc-200 px-4 py-2 text-zinc-600 transition hover:border-zinc-400"
              >
                ← Page précédente
              </Link>
            )}
            <span className="text-zinc-500">Page {page}</span>
            {hasNextPage && (
              <Link
                href={buildCategoryHref(slug, page + 1)}
                className="rounded-full border border-zinc-200 px-4 py-2 text-zinc-600 transition hover:border-zinc-400"
              >
                Page suivante →
              </Link>
            )}
          </nav>
        </noscript>
      )}
    </div>
  );
}
