import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { PartCard } from "@/components/part-card";
import { SellerTable } from "@/components/seller-table";
import { StatusBadge } from "@/components/status-badge";
import { WatchlistButton } from "@/components/watchlist-button";
import { Breadcrumb } from "@/components/breadcrumb";
import { CompareButton } from "@/components/compare-button";
import { PrintButton } from "@/components/print-button";
import { generatePartDescription } from "@/lib/part-description";
import { getPartDetail, getSimilarParts, getAlternativeParts } from "@/lib/queries";
import { siteUrl } from "@/lib/site-url";

export const dynamic = "force-dynamic";

type Params = Promise<{ marque: string; ref: string }>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { marque, ref } = await params;
  const detail = await getPartDetail(marque, ref);
  if (!detail) return { title: "Pièce introuvable" };
  const { part, manufacturer } = detail;
  const title = `${manufacturer.name} ${part.referenceRaw} — ${part.name}`;
  const description = `${part.name} ${manufacturer.name} référence ${part.referenceRaw} : statut de fabrication, références de remplacement, pièces compatibles, vendeurs et prix.`;
  return {
    title,
    description,
    alternates: { canonical: `/piece/${marque}/${ref}` },
    openGraph: {
      title,
      description,
      type: "website",
      images: [{ url: "/og-default.jpg" }],
    },
    twitter: { card: "summary" },
  };
}

async function AlternativePartsContent({
  partId,
  manufacturerId,
  categoryId,
  referenceNormalized,
}: {
  partId: number;
  manufacturerId: number;
  categoryId: number | null;
  referenceNormalized: string;
}) {
  const parts = await getAlternativeParts(partId, manufacturerId, categoryId, referenceNormalized, 4);
  if (parts.length > 0) {
    return (
      <div className="mt-3 grid gap-3">
        {parts.map(({ part: p, manufacturer: m }) => (
          <PartCard
            key={p.id}
            href={`/piece/${m.slug}/${p.slug}`}
            name={p.name}
            referenceRaw={p.referenceRaw}
            manufacturerName={m.name}
            manufacturerSlug={m.slug}
            status={p.status}
          />
        ))}
      </div>
    );
  }
  return (
    <p className="mt-2 text-sm text-orange-800">
      Aucune alternative connue dans notre catalogue.{" "}
      <Link href="/recherche" className="font-medium underline hover:no-underline">
        Suggérez une référence de remplacement
      </Link>
    </p>
  );
}

async function SimilarPartsSection({
  partId,
  manufacturerId,
  categoryId,
  manufacturerName,
}: {
  partId: number;
  manufacturerId: number;
  categoryId: number | null;
  manufacturerName: string;
}) {
  const parts = await getSimilarParts(partId, manufacturerId, categoryId, 6);
  if (parts.length === 0) return null;
  return (
    <section className="mt-8 print-hide">
      <h2 className="text-xl font-semibold">
        Pièces similaires de {manufacturerName}
      </h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {parts.map(({ part: p, manufacturer: m }) => (
          <PartCard
            key={p.id}
            href={`/piece/${m.slug}/${p.slug}`}
            name={p.name}
            referenceRaw={p.referenceRaw}
            manufacturerName={m.name}
            manufacturerSlug={m.slug}
            status={p.status}
            updatedAt={p.updatedAt}
            watchlistData={{
              reference: p.referenceRaw,
              manufacturer: m.name,
              manufacturerSlug: m.slug,
              partSlug: p.slug,
              name: p.name,
              status: p.status,
            }}
          />
        ))}
      </div>
    </section>
  );
}

export default async function PartPage({ params }: { params: Params }) {
  const { marque, ref } = await params;
  const detail = await getPartDetail(marque, ref);
  if (!detail) notFound();

  const { part, manufacturer, category } = detail;
  const completenessScore =
    (part.description != null ? 25 : 0) +
    (part.productUrl != null ? 25 : 0) +
    (part.status !== "unknown" ? 25 : 0) +
    (category != null ? 25 : 0);

  const minPriceOffer = detail.offers.find((o) => o.offer.price != null);
  const minPrice = minPriceOffer ? parseFloat(minPriceOffer.offer.price!) : undefined;
  const currency = minPriceOffer?.offer.currency ?? "EUR";

  const priceOffers = detail.offers.filter((o) => o.offer.price != null);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: part.name,
    sku: part.referenceRaw,
    mpn: part.referenceRaw,
    brand: { "@type": "Brand", name: manufacturer.name },
    description: part.description ?? undefined,
    url: `${siteUrl}/piece/${manufacturer.slug}/${part.slug}`,
    offers: priceOffers.length > 0
      ? {
          "@type": "AggregateOffer",
          lowPrice: Math.min(...priceOffers.map((o) => parseFloat(o.offer.price!))),
          priceCurrency: priceOffers[0].offer.currency ?? "EUR",
          offerCount: priceOffers.length,
          ...(part.status === "obsolete" ? { discontinued: true } : {}),
        }
      : undefined,
  };

  return (
    <article>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Breadcrumb
        items={[
          { label: manufacturer.name, href: `/marque/${manufacturer.slug}` },
          { label: part.referenceRaw, href: `/piece/${manufacturer.slug}/${part.slug}` },
        ]}
      />

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-bold tracking-tight">
          {manufacturer.name}{" "}
          <span className="font-mono">{part.referenceRaw}</span>
        </h1>
        <StatusBadge status={part.status} />
        {part.lifecycleCheckedAt && (
          <span className="text-xs text-zinc-400">
            Statut vérifié le{" "}
            {part.lifecycleCheckedAt.toLocaleDateString("fr-FR")}
          </span>
        )}
        <div className="flex flex-col items-end gap-1">
          <div className="flex h-2 w-24 overflow-hidden rounded-full bg-zinc-100">
            <div
              className={`h-full rounded-full transition-all ${
                completenessScore === 100
                  ? "bg-green-500"
                  : completenessScore >= 50
                    ? "bg-amber-400"
                    : "bg-zinc-300"
              }`}
              style={{ width: `${completenessScore}%` }}
            />
          </div>
          <span className="text-xs text-zinc-400">
            {completenessScore === 100 ? (
              <span className="text-green-600">✓ Fiche complète</span>
            ) : (
              `Complétude ${completenessScore}%`
            )}
          </span>
          {part.updatedAt && (
            <span className="text-xs text-zinc-400">
              Mis à jour le {part.updatedAt.toLocaleDateString("fr-FR")}
            </span>
          )}
        </div>
        <WatchlistButton
          entry={{
            reference: part.referenceRaw,
            manufacturer: manufacturer.name,
            manufacturerSlug: manufacturer.slug,
            partSlug: part.slug,
            name: part.name,
            status: part.status,
            minPrice,
            currency,
            dateAdded: new Date().toISOString(),
            snapshotDate: new Date().toISOString(),
          }}
        />
        <CompareButton
          entry={{
            referenceRaw: part.referenceRaw,
            name: part.name,
            manufacturerName: manufacturer.name,
            manufacturerSlug: manufacturer.slug,
            slug: part.slug,
            status: part.status,
          }}
        />
        <PrintButton />
      </div>
      <p className="mt-2 text-lg text-zinc-600">{part.name}</p>
      <p className="mt-4 max-w-3xl text-zinc-700">
        {part.description ??
          generatePartDescription(
            part.name,
            manufacturer.name,
            manufacturer.industry,
            category?.name,
          )}
      </p>
      {part.productUrl && (
        <a
          href={part.productUrl}
          target="_blank"
          rel="noopener"
          className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:border-blue-400 hover:text-blue-700"
        >
          Voir chez le fabricant ↗
        </a>
      )}

      {part.status === "obsolete" && (
        <div className="mt-6 rounded-xl border border-orange-300 bg-orange-50 px-5 py-4">
          <p className="font-semibold text-orange-900">
            ⚠️ Cette pièce est obsolète. Voici des alternatives possibles :
          </p>
          <Suspense fallback={<p className="mt-2 text-sm text-orange-800 animate-pulse">Recherche d&apos;alternatives…</p>}>
            <AlternativePartsContent
              partId={part.id}
              manufacturerId={manufacturer.id}
              categoryId={category?.id ?? null}
              referenceNormalized={part.referenceNormalized}
            />
          </Suspense>
        </div>
      )}

      {part.status === "obsolete" && detail.replacedBy.length > 0 && (
        <div className="mt-6 flex flex-wrap items-center gap-3 rounded-xl border border-amber-300 bg-amber-50 px-5 py-4">
          <span className="text-2xl">⚠️</span>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-amber-900">
              Cette pièce n&apos;est plus fabriquée
            </p>
            <p className="text-sm text-amber-800">
              Remplacement officiel :{" "}
              <Link
                href={`/piece/${detail.replacedBy[0].manufacturer.slug}/${detail.replacedBy[0].part.slug}`}
                className="font-mono font-semibold underline hover:no-underline"
              >
                {detail.replacedBy[0].part.referenceRaw}
              </Link>
            </p>
          </div>
        </div>
      )}

      {part.status === "obsolete" && detail.replacedBy.length === 0 && (
        <div className="mt-6 flex flex-wrap items-center gap-3 rounded-xl border border-zinc-300 bg-zinc-50 px-5 py-4">
          <span className="text-2xl">🔎</span>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-zinc-900">
              Pièce obsolète sans remplacement officiel connu
            </p>
            <p className="text-sm text-zinc-600">
              Le reconditionné et le surplus restent souvent disponibles —
              voir les offres ci-dessous.
            </p>
          </div>
        </div>
      )}

      {part.attributes && Object.keys(part.attributes).length > 0 && (
        <section className="mt-8">
          <h2 className="text-xl font-semibold">Caractéristiques</h2>
          <dl className="mt-3 grid max-w-xl grid-cols-2 gap-x-6 gap-y-2 text-sm">
            {Object.entries(part.attributes).map(([key, value]) => (
              <div key={key} className="contents">
                <dt className="text-zinc-500">{key}</dt>
                <dd className="font-medium">{value}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      {detail.replacedBy.length > 0 && (
        <section className="mt-8">
          <h2 className="text-xl font-semibold">
            Référence{detail.replacedBy.length > 1 ? "s" : ""} de remplacement
          </h2>
          <p className="mt-1 text-sm text-zinc-500">
            Remplacement officiel annoncé par le fabricant.
          </p>
          <div className="mt-3 grid gap-3">
            {detail.replacedBy.map(({ part: p, manufacturer: m }) => (
              <PartCard
                key={p.id}
                href={`/piece/${m.slug}/${p.slug}`}
                name={p.name}
                referenceRaw={p.referenceRaw}
                manufacturerName={m.name}
                manufacturerSlug={m.slug}
                status={p.status}
                updatedAt={p.updatedAt}
              />
            ))}
          </div>
        </section>
      )}

      {detail.replacements.length > 0 && (
        <section className="mt-8">
          <h2 className="text-xl font-semibold">Remplace les références</h2>
          <div className="mt-3 grid gap-3">
            {detail.replacements.map(({ part: p, manufacturer: m }) => (
              <PartCard
                key={p.id}
                href={`/piece/${m.slug}/${p.slug}`}
                name={p.name}
                referenceRaw={p.referenceRaw}
                manufacturerName={m.name}
                manufacturerSlug={m.slug}
                status={p.status}
                updatedAt={p.updatedAt}
              />
            ))}
          </div>
        </section>
      )}

      {detail.references.length > 0 && (
        <section className="mt-8">
          <h2 className="text-xl font-semibold">Références équivalentes</h2>
          <ul className="mt-3 grid max-w-xl gap-1 text-sm">
            {detail.references.map((r) => (
              <li key={r.id} className="flex justify-between border-b border-zinc-100 py-1">
                <span className="font-mono">{r.reference}</span>
                <span className="text-zinc-500">
                  {r.brand ? `${r.brand} · ` : ""}
                  {r.type.toUpperCase()}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {detail.compatibles.length > 0 && (
        <section className="mt-8 print-hide">
          <h2 className="text-xl font-semibold">Pièces compatibles alternatives</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Compatibilité non officielle — vérifiez les caractéristiques avant achat.
          </p>
          <div className="mt-3 grid gap-3">
            {detail.compatibles.map(({ compatibility, part: p, manufacturer: m }) => (
              <PartCard
                key={p.id}
                href={`/piece/${m.slug}/${p.slug}`}
                name={p.name}
                referenceRaw={p.referenceRaw}
                manufacturerName={m.name}
                manufacturerSlug={m.slug}
                status={p.status}
                confidence={compatibility.confidence}
              />
            ))}
          </div>
        </section>
      )}

      <section className="mt-8">
        <h2 className="text-xl font-semibold">Où acheter cette pièce</h2>
        <div className="mt-3">
          <SellerTable
            offers={detail.offers.map(({ offer, seller }) => ({
              sellerName: seller.name,
              sellerType: seller.type,
              price: offer.price,
              currency: offer.currency,
              availability: offer.availability,
              url: offer.url,
              scrapedAt: offer.scrapedAt,
            }))}
          />
        </div>
      </section>

      <Suspense fallback={null}>
        <SimilarPartsSection
          partId={part.id}
          manufacturerId={manufacturer.id}
          categoryId={category?.id ?? null}
          manufacturerName={manufacturer.name}
        />
      </Suspense>
    </article>
  );
}
