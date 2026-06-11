import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getManufacturerBySlug, getManufacturerPageData } from "@/lib/queries";
import { InfinitePartsList } from "@/components/infinite-parts-list";
import { BrandLogo } from "@/components/brand-logo";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 24;

type Params = Promise<{ marque: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { marque } = await params;
  const manufacturer = await getManufacturerBySlug(marque);
  if (!manufacturer) return { title: "Marque introuvable" };
  return {
    title: `Pièces détachées ${manufacturer.name} — références, remplacements, vendeurs`,
    description: `Catalogue des pièces détachées ${manufacturer.name} : statut de fabrication, références de remplacement et vendeurs.`,
    alternates: { canonical: `/marque/${marque}` },
  };
}

export default async function ManufacturerPage({ params }: { params: Params }) {
  const { marque } = await params;
  const data = await getManufacturerPageData(marque, PAGE_SIZE);
  if (!data) notFound();

  return (
    <div>
      <div className="flex items-center gap-4">
        <BrandLogo slug={marque} name={data.manufacturer.name} size={64} />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Pièces détachées {data.manufacturer.name}
          </h1>
          <p className="mt-2 text-zinc-600">
            <span className="capitalize">Industrie : {data.manufacturer.industry}</span>
            {" · "}
            {data.totalCount} pièce{data.totalCount > 1 ? "s" : ""} référencée
            {data.totalCount > 1 ? "s" : ""}
            {data.obsoleteCount > 0 && (
              <> dont {data.obsoleteCount} obsolète{data.obsoleteCount > 1 ? "s" : ""}</>
            )}
          </p>
        </div>
      </div>
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
    </div>
  );
}
