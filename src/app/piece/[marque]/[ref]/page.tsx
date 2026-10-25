import type { Metadata } from "next";
import Link from "next/link";
import { Suspense, cache } from "react";
import { notFound } from "next/navigation";
import { PartCard } from "@/components/part-card";
import { SellerTable } from "@/components/seller-table";
import { StatusBadge } from "@/components/status-badge";
import { WatchlistButton } from "@/components/watchlist-button";
import { Breadcrumb } from "@/components/breadcrumb";
import { CompareButton } from "@/components/compare-button";
import { CopyButton } from "@/components/copy-button";
import { PrintButton } from "@/components/print-button";
import { ExternalIcon } from "@/components/icons";
import { generatePartDescription } from "@/lib/part-description";
import {
  getPartDetail as _getPartDetail,
  getSimilarParts,
  getAlternativeParts,
  getSupersessionChain,
  getTopPartPaths,
  getPartCardExtras,
} from "@/lib/queries";
import { CompatibilityMap } from "@/components/compatibility-map";
import { siteUrl } from "@/lib/site-url";
import { formatDate, formatPrice, plural } from "@/lib/format";

// Déduplique les appels identiques dans le même cycle de rendu (generateMetadata + PartPage)
const getPartDetail = cache(_getPartDetail);

export const revalidate = 3600;
export const dynamicParams = true;

export async function generateStaticParams() {
  try {
    const paths = await getTopPartPaths(100);
    return paths.map(({ manufacturerSlug, partSlug }) => ({
      marque: manufacturerSlug,
      ref: partSlug,
    }));
  } catch {
    // Base injoignable au build (CI, preview) : les pages seront rendues à la demande.
    return [];
  }
}

type Params = Promise<{ marque: string; ref: string }>;
type ChainStep = Awaited<ReturnType<typeof getSupersessionChain>>[number];

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
      images: [{ url: `/api/og/${marque}/${ref}`, width: 1200, height: 630 }],
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
    const extras = await getPartCardExtras(parts.map(({ part }) => part));
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
            extras={extras.get(p.id)}
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

function SupersessionChainSection({
  chain,
  currentRef,
  currentSlug,
  currentManufacturerSlug,
}: {
  chain: ChainStep[];
  currentRef: string;
  currentSlug: string;
  currentManufacturerSlug: string;
}) {
  if (chain.length < 2) return null;
  return (
    <section className="mt-10">
      <h2 className="text-xl font-semibold">Chaîne de remplacement complète</h2>
      <p className="mt-1 text-sm text-zinc-500">
        Succession officielle des remplacements annoncés par le fabricant.
      </p>
      <ol className="mt-4 flex flex-wrap items-center gap-2">
        <li>
          <Link
            href={`/piece/${currentManufacturerSlug}/${currentSlug}`}
            aria-current="page"
            className="flex items-center gap-1.5 rounded-lg border border-zinc-300 bg-zinc-50 px-3 py-2 font-mono text-sm font-medium text-zinc-700 hover:border-zinc-500"
          >
            {currentRef}
            <StatusBadge status="obsolete" size="sm" />
          </Link>
        </li>
        {chain.map((step) => (
          <li key={step.id} className="flex items-center gap-2">
            <span className="text-zinc-400" aria-hidden="true">→</span>
            <Link
              href={`/piece/${step.manufacturerSlug}/${step.slug}`}
              className="flex items-center gap-1.5 rounded-lg border border-zinc-300 bg-white px-3 py-2 font-mono text-sm font-medium text-zinc-900 hover:border-blue-400 hover:text-blue-700"
            >
              {step.referenceRaw}
              <StatusBadge status={step.status} size="sm" />
            </Link>
          </li>
        ))}
      </ol>
    </section>
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
  const extras = await getPartCardExtras(parts.map(({ part }) => part));
  return (
    <section className="mt-10 print-hide">
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
            extras={extras.get(p.id)}
            watchlistData={{
              reference: p.referenceRaw,
              manufacturer: m.name,
              manufacturerSlug: m.slug,
              partSlug: p.slug,
              name: p.name,
              status: p.status,
              minPrice: extras.get(p.id)?.minPrice ?? undefined,
              currency: extras.get(p.id)?.currency,
            }}
          />
        ))}
      </div>
    </section>
  );
}

/** Case de l'encadré « en bref » sous le titre. */
function Fact({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-zinc-200 p-3 ${className}`}>
      <dt className="text-xs font-medium uppercase tracking-wide text-zinc-400">{label}</dt>
      <dd className="mt-1.5 text-sm">{children}</dd>
    </div>
  );
}

export default async function PartPage({ params }: { params: Params }) {
  const { marque, ref } = await params;
  const detail = await getPartDetail(marque, ref);
  if (!detail) notFound();

  const { part, manufacturer, category } = detail;
  const isObsolete = part.status === "obsolete";

  const [chain, relatedExtras] = await Promise.all([
    detail.replacedBy.length > 0 ? getSupersessionChain(part.id) : Promise.resolve([] as ChainStep[]),
    getPartCardExtras([...detail.replacedBy, ...detail.replacements].map(({ part: p }) => p)),
  ]);
  // Remplacement à proposer : le premier successeur encore fabriqué de la
  // chaîne (le remplacement direct peut être lui-même devenu obsolète).
  const successor = chain.find((s) => s.status === "active") ?? chain[0] ?? null;

  // Attributs du catalogue, complétés par les specs enrichies (les attributs priment)
  const characteristics = Object.entries({ ...(part.specs ?? {}), ...(part.attributes ?? {}) });

  const minPriceOffer = detail.offers.find((o) => o.offer.price != null);
  const minPrice = minPriceOffer ? parseFloat(minPriceOffer.offer.price!) : undefined;
  const currency = minPriceOffer?.offer.currency ?? "EUR";

  // AggregateOffer exige une devise unique : on agrège les offres dans la
  // devise de l'offre la moins chère (les offres sont triées par prix).
  const priceOffers = detail.offers.filter(
    (o) => o.offer.price != null && (o.offer.currency ?? "EUR") === currency,
  );
  const prices = priceOffers.map((o) => parseFloat(o.offer.price!));
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: part.name,
    sku: part.referenceRaw,
    mpn: part.referenceRaw,
    brand: { "@type": "Brand", name: manufacturer.name },
    description: part.description ?? undefined,
    category: category?.name,
    url: `${siteUrl}/piece/${manufacturer.slug}/${part.slug}`,
    offers: priceOffers.length > 0
      ? {
          "@type": "AggregateOffer",
          lowPrice: Math.min(...prices),
          highPrice: Math.max(...prices),
          priceCurrency: currency,
          offerCount: priceOffers.length,
          // schema.org n'a pas de propriété "discontinued" : l'arrêt se signale par availability
          ...(isObsolete ? { availability: "https://schema.org/Discontinued" } : {}),
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

      {/* Pas de <header> : la feuille d'impression masque tous les header. */}
      <div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            <span className="text-zinc-500">{manufacturer.name}</span>{" "}
            <span className="font-mono break-all">{part.referenceRaw}</span>
          </h1>
          <CopyButton value={part.referenceRaw} />
        </div>
        <p className="mt-1 text-lg text-zinc-700">{part.name}</p>

        <div className="no-print mt-4 flex flex-wrap gap-2">
          <WatchlistButton
            size="md"
            entry={{
              reference: part.referenceRaw,
              manufacturer: manufacturer.name,
              manufacturerSlug: manufacturer.slug,
              partSlug: part.slug,
              name: part.name,
              status: part.status,
              minPrice,
              currency,
            }}
          />
          <CompareButton
            size="md"
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
      </div>

      <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Fact label="Statut">
          <StatusBadge status={part.status} size="sm" />
          <span className="mt-1 block text-xs text-zinc-500">
            {part.lifecycleCheckedAt
              ? `Vérifié le ${formatDate(part.lifecycleCheckedAt)}`
              : "Non vérifié chez le fabricant"}
          </span>
        </Fact>
        <Fact label="Meilleur prix">
          {minPrice != null ? (
            <>
              <span className="text-base font-semibold text-zinc-900">{formatPrice(minPrice, currency)}</span>
              <a href="#offres" className="mt-0.5 block text-xs text-blue-700 hover:underline">
                {plural(detail.offers.length, "offre")} ↓
              </a>
            </>
          ) : (
            <span className="text-zinc-500">
              {detail.offers.length > 0 ? `${plural(detail.offers.length, "offre")}, prix sur demande` : "Aucune offre relevée"}
            </span>
          )}
        </Fact>
        <Fact label="Catégorie" className="col-span-2 sm:col-span-1">
          {category ? (
            <Link href={`/categorie/${category.slug}`} className="font-medium text-zinc-900 hover:text-blue-700 hover:underline">
              {category.name}
            </Link>
          ) : (
            <span className="text-zinc-500">Non classée</span>
          )}
          <span className="mt-1 block text-xs capitalize text-zinc-500">{manufacturer.industry}</span>
        </Fact>
      </dl>

      {isObsolete && successor && (
        <div
          className={`mt-6 rounded-xl border px-5 py-4 ${
            successor.status === "active" ? "border-amber-300 bg-amber-50" : "border-orange-300 bg-orange-50"
          }`}
        >
          <p className="font-semibold text-amber-900">Cette pièce n&apos;est plus fabriquée</p>
          {successor.status === "active" ? (
            <p className="mt-1 text-sm text-amber-900">
              {successor.depth > 1 ? "Remplacement actuel" : "Remplacement officiel"} :{" "}
              <Link
                href={`/piece/${successor.manufacturerSlug}/${successor.slug}`}
                className="font-mono font-semibold underline hover:no-underline"
              >
                {successor.referenceRaw}
              </Link>
              , encore fabriquée
              {successor.depth > 1 && <> (après {successor.depth} remplacements successifs, voir la chaîne ci-dessous)</>}.
            </p>
          ) : (
            <p className="mt-1 text-sm text-orange-900">
              Remplacement officiel :{" "}
              <Link
                href={`/piece/${successor.manufacturerSlug}/${successor.slug}`}
                className="font-mono font-semibold underline hover:no-underline"
              >
                {successor.referenceRaw}
              </Link>
              {" "}— attention, cette référence est elle-même obsolète. Le reconditionné et le surplus
              restent souvent disponibles (voir les offres ci-dessous).
            </p>
          )}
          <Link
            href={`/piece/${successor.manufacturerSlug}/${successor.slug}`}
            className="no-print mt-3 inline-flex items-center gap-1 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700"
          >
            Voir la fiche {successor.referenceRaw} →
          </Link>
        </div>
      )}

      {isObsolete && !successor && (
        <div className="mt-6 rounded-xl border border-orange-300 bg-orange-50 px-5 py-4">
          <p className="font-semibold text-orange-900">
            Pièce obsolète sans remplacement officiel connu
          </p>
          <p className="mt-1 text-sm text-orange-800">
            Le reconditionné et le surplus restent souvent disponibles (voir les
            offres ci-dessous). Alternatives possibles dans notre catalogue :
          </p>
          <Suspense fallback={<p className="mt-2 animate-pulse text-sm text-orange-800">Recherche d&apos;alternatives…</p>}>
            <AlternativePartsContent
              partId={part.id}
              manufacturerId={manufacturer.id}
              categoryId={category?.id ?? null}
              referenceNormalized={part.referenceNormalized}
            />
          </Suspense>
        </div>
      )}

      <p className="mt-6 max-w-3xl text-zinc-700">
        {part.description ??
          generatePartDescription(
            part.name,
            manufacturer.name,
            manufacturer.industry,
            category?.name,
          )}
      </p>
      {(part.productUrl || part.datasheetUrl) && (
        <div className="mt-4 flex flex-wrap gap-2">
          {part.productUrl && (
            <a
              href={part.productUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:border-blue-400 hover:text-blue-700"
            >
              Page produit {manufacturer.name} <ExternalIcon />
            </a>
          )}
          {part.datasheetUrl && (
            <a
              href={part.datasheetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:border-blue-400 hover:text-blue-700"
            >
              Fiche technique (PDF) <ExternalIcon />
            </a>
          )}
        </div>
      )}

      {characteristics.length > 0 && (
        <section className="mt-10">
          <h2 className="text-xl font-semibold">Caractéristiques</h2>
          <dl className="mt-3 max-w-2xl divide-y divide-zinc-100 rounded-xl border border-zinc-200 text-sm">
            {characteristics.map(([key, value]) => (
              <div key={key} className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-4 px-4 py-2">
                <dt className="text-zinc-500">{key}</dt>
                <dd className="font-medium text-zinc-900">{value}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      <section id="offres" className="mt-10">
        <h2 className="text-xl font-semibold">
          Où acheter cette pièce
          {detail.offers.length > 0 && (
            <span className="ml-2 text-base font-normal text-zinc-400">{plural(detail.offers.length, "offre")}</span>
          )}
        </h2>
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

      {detail.replacedBy.length > 0 && (
        <section className="mt-10">
          <h2 className="text-xl font-semibold">
            Remplacement{detail.replacedBy.length > 1 ? "s" : ""} officiel{detail.replacedBy.length > 1 ? "s" : ""}
          </h2>
          <p className="mt-1 text-sm text-zinc-500">
            Référence{detail.replacedBy.length > 1 ? "s" : ""} annoncée{detail.replacedBy.length > 1 ? "s" : ""} par le fabricant pour remplacer celle-ci.
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
                extras={relatedExtras.get(p.id)}
              />
            ))}
          </div>
        </section>
      )}

      <SupersessionChainSection
        chain={chain}
        currentRef={part.referenceRaw}
        currentSlug={part.slug}
        currentManufacturerSlug={manufacturer.slug}
      />

      {detail.replacements.length > 0 && (
        <section className="mt-10">
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
                extras={relatedExtras.get(p.id)}
              />
            ))}
          </div>
        </section>
      )}

      {detail.references.length > 0 && (
        <section className="mt-10">
          <h2 className="text-xl font-semibold">Références équivalentes</h2>
          <ul className="mt-3 max-w-2xl divide-y divide-zinc-100 rounded-xl border border-zinc-200 text-sm">
            {detail.references.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-4 px-4 py-2">
                <span className="font-mono break-all">{r.reference}</span>
                <span className="shrink-0 text-xs text-zinc-500">
                  {r.brand ? `${r.brand} · ` : ""}
                  {r.type.toUpperCase()}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {detail.compatibles.length > 0 && (
        <section className="mt-10 print-hide">
          <h2 className="text-xl font-semibold">Pièces compatibles alternatives</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Compatibilité non officielle — vérifiez les caractéristiques avant achat.
          </p>
          <CompatibilityMap
            mainRef={part.referenceRaw}
            mainName={part.name}
            mainManufacturer={manufacturer.name}
            items={detail.compatibles.map(({ compatibility, part: p, manufacturer: m }) => ({
              confidence: compatibility.confidence,
              part: { id: p.id, name: p.name, referenceRaw: p.referenceRaw, slug: p.slug, status: p.status },
              manufacturer: { name: m.name, slug: m.slug },
            }))}
          />
        </section>
      )}

      <p className="mt-10 text-xs text-zinc-400">
        Fiche mise à jour le {formatDate(part.updatedAt)}
      </p>

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
