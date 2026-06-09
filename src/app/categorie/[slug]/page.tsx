import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PartCard } from "@/components/part-card";
import { getCategoryWithParts } from "@/lib/queries";

export const dynamic = "force-dynamic";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = await getCategoryWithParts(slug);
  if (!data) return { title: "Catégorie introuvable" };
  return {
    title: `${data.category.name} — pièces détachées par référence`,
    alternates: { canonical: `/categorie/${slug}` },
  };
}

export default async function CategoryPage({ params }: { params: Params }) {
  const { slug } = await params;
  const data = await getCategoryWithParts(slug);
  if (!data) notFound();

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight">{data.category.name}</h1>
      <p className="mt-2 text-zinc-600 capitalize">
        Industrie : {data.category.industry}
      </p>
      <div className="mt-6 grid gap-3">
        {data.parts.map(({ part, manufacturer }) => (
          <PartCard
            key={part.id}
            href={`/piece/${manufacturer.slug}/${part.slug}`}
            name={part.name}
            referenceRaw={part.referenceRaw}
            manufacturerName={manufacturer.name}
            status={part.status}
          />
        ))}
      </div>
    </div>
  );
}
