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
