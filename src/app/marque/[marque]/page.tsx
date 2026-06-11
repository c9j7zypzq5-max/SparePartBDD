import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getManufacturerBySlug, getManufacturerPageData } from "@/lib/queries";
import { InfinitePartsList } from "@/components/infinite-parts-list";
import { BrandLogo } from "@/components/brand-logo";
import { Breadcrumb } from "@/components/breadcrumb";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 24;

type Params = Promise<{ marque: string }>;
type SearchParams = Promise<{ status?: string; sort?: string; page?: string }>;

function buildBrandHref(
  slug: string,
  params: { status?: string; sort?: string; page?: number },
): string {
  const sp = new URLSearchParams();
  if (params.status) sp.set("status", params.status);
  if (params.sort) sp.set("sort", params.sort);
  if (params.page && params.page > 1) sp.set("page", String(params.page));
  const qs = sp.toString();
  return `/marque/${slug}${qs ? `?${qs}` : ""}`;
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { marque } = await params;
  const manufacturer = await getManufacturerBySlug(marque);
  if (!manufacturer) return { title: "Marque introuvable" };
  const title = `Pièces détachées ${manufacturer.name} — références, remplacements, vendeurs`;
  const description = `Catalogue des pièces détachées ${manufacturer.name} : statut de fabrication, références de remplacement et vendeurs.`;
  return {
    title,
    description,
    alternates: { canonical: `/marque/${marque}` },
    openGraph: {
      title,
      description,
      type: "website",
      images: [{ url: "/og-default.jpg" }],
    },
    twitter: { card: "summary" },
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
  const { status, sort, page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);
  const offset = (page - 1) * PAGE_SIZE;
  const data = await getManufacturerPageData(marque, PAGE_SIZE, { status, sort, offset });
  if (!data) notFound();

  const hasNextPage = data.totalCount > page * PAGE_SIZE;

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
      <Breadcrumb items={[{ label: "Marques", href: "/marques" }, { label: data.manufacturer.name, href: `/marque/${marque}` }]} />
      <div className="flex flex-wrap items-center justify-between gap-4">
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
        <a
          href={`/api/marque/${marque}/export`}
          className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:border-zinc-500 hover:text-zinc-900"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-4 w-4">
            <path d="M8 1a.75.75 0 0 1 .75.75v6.19l1.97-1.97a.75.75 0 0 1 1.06 1.06l-3.25 3.25a.75.75 0 0 1-1.06 0L4.22 7.03a.75.75 0 0 1 1.06-1.06L7.25 7.94V1.75A.75.75 0 0 1 8 1zM2.5 13.75A.75.75 0 0 1 3.25 13h9.5a.75.75 0 0 1 0 1.5h-9.5a.75.75 0 0 1-.75-.75z" />
          </svg>
          Exporter CSV
        </a>
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
      {page > 1 && (
        <p className="mt-3 text-sm text-zinc-500">Page {page}</p>
      )}

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
        initialOffset={offset}
        extraParams={{
          ...(status ? { status } : {}),
          ...(sort ? { sort } : {}),
        }}
      />

      {(page > 1 || hasNextPage) && (
        <nav className="mt-8 flex items-center justify-center gap-4 text-sm font-medium">
          {page > 1 && (
            <Link
              href={buildBrandHref(marque, { status, sort, page: page - 1 })}
              className="rounded-full border border-zinc-200 px-4 py-2 text-zinc-600 transition hover:border-zinc-400"
            >
              ← Page précédente
            </Link>
          )}
          <span className="text-zinc-500">Page {page}</span>
          {hasNextPage && (
            <Link
              href={buildBrandHref(marque, { status, sort, page: page + 1 })}
              className="rounded-full border border-zinc-200 px-4 py-2 text-zinc-600 transition hover:border-zinc-400"
            >
              Page suivante →
            </Link>
          )}
        </nav>
      )}
    </div>
  );
}
