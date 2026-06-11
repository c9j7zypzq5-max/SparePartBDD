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
        Industrie : {data.category.industry}
        {" · "}
        {data.totalCount} pièce{data.totalCount > 1 ? "s" : ""} référencée
        {data.totalCount > 1 ? "s" : ""}
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
