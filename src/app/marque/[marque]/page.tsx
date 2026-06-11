import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getManufacturerBySlug, getManufacturerPageData } from "@/lib/queries";
import { InfinitePartsList } from "@/components/infinite-parts-list";
import { BrandLogo } from "@/components/brand-logo";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 24;

type Params = Promise<{ marque: string }>;
type SearchParams = Promise<{ status?: string; sort?: string }>;

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

  const STATUS_FILTERS = [
    { value: "", label: "Tous" },
    { value: "active", label: "Actifs" },
    { value: "obsolete", label: "Obsolètes" },
  ];

  const SORT_OPTIONS = [
    { value: "", label: "Nom A→Z" },
    { value: "name_desc", label: "Nom Z→A" },
  ];

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

      {/* Filter bar */}
      <div className="mt-6 flex flex-wrap items-center gap-2">
        {STATUS_FILTERS.map((f) => {
          const active = (status ?? "") === f.value;
          return (
            <Link
              key={f.value}
              href={buildBrandHref(marque, { status: f.value || undefined, sort })}
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
        <div className="ml-auto flex items-center gap-2">
          {SORT_OPTIONS.map((s) => {
            const active = (sort ?? "") === s.value;
            return (
              <Link
                key={s.value}
                href={buildBrandHref(marque, { status, sort: s.value || undefined })}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                  active
                    ? "bg-zinc-900 text-white"
                    : "border border-zinc-200 text-zinc-600 hover:border-zinc-400"
                }`}
              >
                {s.label}
              </Link>
            );
          })}
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
        extraParams={{
          ...(status ? { status } : {}),
          ...(sort ? { sort } : {}),
        }}
      />
    </div>
  );
}
