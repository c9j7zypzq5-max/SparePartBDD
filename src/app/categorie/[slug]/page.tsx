import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCategoryPageData } from "@/lib/queries";
import { InfinitePartsList } from "@/components/infinite-parts-list";
import { Breadcrumb } from "@/components/breadcrumb";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 24;

type Params = Promise<{ slug: string }>;

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

export default async function CategoryPage({ params }: { params: Params }) {
  const { slug } = await params;
  const data = await getCategoryPageData(slug, PAGE_SIZE);
  if (!data) notFound();

  return (
    <div>
      <Breadcrumb items={[{ label: "Catégories", href: "/categories" }, { label: data.category.name, href: `/categorie/${slug}` }]} />
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{data.category.name}</h1>
          <p className="mt-2 text-zinc-600 capitalize">
            Industrie : {data.category.industry}
            {" · "}
            {data.totalCount} pièce{data.totalCount > 1 ? "s" : ""} référencée
            {data.totalCount > 1 ? "s" : ""}
          </p>
        </div>
        <a
          href={`/api/categorie/${slug}/export`}
          className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:border-zinc-500 hover:text-zinc-900"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-4 w-4">
            <path d="M8 1a.75.75 0 0 1 .75.75v6.19l1.97-1.97a.75.75 0 0 1 1.06 1.06l-3.25 3.25a.75.75 0 0 1-1.06 0L4.22 7.03a.75.75 0 0 1 1.06-1.06L7.25 7.94V1.75A.75.75 0 0 1 8 1zM2.5 13.75A.75.75 0 0 1 3.25 13h9.5a.75.75 0 0 1 0 1.5h-9.5a.75.75 0 0 1-.75-.75z" />
          </svg>
          Exporter CSV
        </a>
      </div>
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
