import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PartCard } from "@/components/part-card";
import { getManufacturerWithParts } from "@/lib/queries";

export const dynamic = "force-dynamic";

type Params = Promise<{ marque: string }>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { marque } = await params;
  const data = await getManufacturerWithParts(marque);
  if (!data) return { title: "Marque introuvable" };
  return {
    title: `Pièces détachées ${data.manufacturer.name} — références, remplacements, vendeurs`,
    description: `Catalogue des pièces détachées ${data.manufacturer.name} : statut de fabrication, références de remplacement et vendeurs.`,
    alternates: { canonical: `/marque/${marque}` },
  };
}

export default async function ManufacturerPage({ params }: { params: Params }) {
  const { marque } = await params;
  const data = await getManufacturerWithParts(marque);
  if (!data) notFound();

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight">
        Pièces détachées {data.manufacturer.name}
      </h1>
      <p className="mt-2 text-zinc-600 capitalize">
        Industrie : {data.manufacturer.industry}
      </p>
      <div className="mt-6 grid gap-3">
        {data.parts.map((part) => (
          <PartCard
            key={part.id}
            href={`/piece/${data.manufacturer.slug}/${part.slug}`}
            name={part.name}
            referenceRaw={part.referenceRaw}
            manufacturerName={data.manufacturer.name}
            status={part.status}
          />
        ))}
      </div>
    </div>
  );
}
