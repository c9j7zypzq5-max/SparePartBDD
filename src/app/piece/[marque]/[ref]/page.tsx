import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PartCard } from "@/components/part-card";
import { SellerTable } from "@/components/seller-table";
import { StatusBadge } from "@/components/status-badge";
import { WatchlistButton } from "@/components/watchlist-button";
import { Breadcrumb } from "@/components/breadcrumb";
import { CompareButton } from "@/components/compare-button";
import { PrintButton } from "@/components/print-button";
import { generatePartDescription } from "@/lib/part-description";
import { buildPartFaq, faqJsonLd } from "@/lib/part-faq";
import { getPartDetail, getSimilarParts, getAlternativeParts } from "@/lib/queries";
import { resellersForPart } from "@/lib/resellers";
import { goHref, resolveResellerHref } from "@/lib/affiliate";
import { siteUrl } from "@/lib/site-url";

// ISR : la page est rendue à la première visite puis servie depuis le cache
// Edge de Vercel pendant 1 h — fini les requêtes BDD à chaque hit Googlebot.
export const revalidate = 3600;
export const dynamicParams = true;

// Aucune page pré-rendue au build (la BDD n'y est pas forcément accessible) :
// tout est généré à la demande puis caché — requis pour activer l'ISR sur
// une route à segments dynamiques.
export async function generateStaticParams(): Promise<{ marque: string; ref: string }[]> {
  return [];
}

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

export default async function PartPage({ params }: { params: Params }) {
  const { marque, ref } = await params;
  const detail = await getPartDetail(marque, ref);
  if (!detail) notFound();

  const { part, manufacturer, category } = detail;

  const [similarParts, alternativeParts] = await Promise.all([
    getSimilarParts(part.id, manufacturer.id, category?.id ?? null, 6),
    part.status === "obsolete"
      ? getAlternativeParts(part.id, manufacturer.id, category?.id ?? null, part.referenceNormalized, 4)
      : Promise.resolve([]),
  ]);
  const completenessScore =
    (part.description != null ? 25 : 0) +
    (part.productUrl != null ? 25 : 0) +
    (part.status !== "unknown" ? 25 : 0) +
    (category != null ? 25 : 0);

  const minPriceOffer = detail.offers.find((o) => o.offer.price != null);
  const minPrice = minPriceOffer ? parseFloat(minPriceOffer.offer.price!) : undefined;
  const currency = minPriceOffer?.offer.currency ?? "EUR";

  const priceOffers = detail.offers.filter((o) => o.offer.price != null);

  // Chaque référence propose au moins un revendeur : pour les vendeurs sans
  // offre relevée en base, on affiche un lien de recherche direct (RS,
  // Farnell, Rexel…) adapté à l'industrie et au statut de la pièce.
  const offerSellerSlugs = new Set(detail.offers.map(({ seller }) => seller.slug));
  const resellerSearchLinks = resellersForPart(manufacturer.industry, part.status)
    .filter((r) => !offerSellerSlugs.has(r.slug))
    .slice(0, 5)
    .map((r) => ({
      name: r.name,
      href: goHref({ to: r.searchUrl(part.referenceRaw), seller: r.slug, reference: part.referenceRaw, partId: part.id }),
    }));
  // ── Schema.org Product (Google Rich Results : prix, dispo, avis…) ────────
  // Conditions par type de vendeur — schema.org/OfferItemCondition
  const CONDITION_BY_SELLER_TYPE: Record<string, string> = {
    constructeur:          "https://schema.org/NewCondition",
    distributeur_officiel: "https://schema.org/NewCondition",
    aftermarket:           "https://schema.org/NewCondition",
    reconditionne:         "https://schema.org/RefurbishedCondition",
    occasion:              "https://schema.org/UsedCondition",
  };
  const availability =
    part.status === "obsolete"
      ? "https://schema.org/Discontinued"
      : "https://schema.org/InStock";

  const partUrl = `${siteUrl}/piece/${manufacturer.slug}/${part.slug}`;
  const prices = priceOffers.map((o) => parseFloat(o.offer.price!));

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: part.name,
    sku: part.referenceRaw,
    mpn: part.referenceRaw,
    brand: { "@type": "Brand", name: manufacturer.name },
    description: part.description ?? undefined,
    url: partUrl,
    ...(part.imageUrl ? { image: part.imageUrl } : {}),
    ...(category ? { category: category.name } : {}),
    ...(part.attributes && Object.keys(part.attributes).length > 0
      ? {
          additionalProperty: Object.entries(part.attributes).slice(0, 10).map(
            ([name, value]) => ({ "@type": "PropertyValue", name, value }),
          ),
        }
      : {}),
    offers: priceOffers.length > 0
      ? {
          "@type": "AggregateOffer",
          lowPrice: Math.min(...prices),
          highPrice: Math.max(...prices),
          priceCurrency: priceOffers[0].offer.currency ?? "EUR",
          offerCount: priceOffers.length,
          availability,
          offers: priceOffers.slice(0, 5).map(({ offer, seller }) => ({
            "@type": "Offer",
            price: parseFloat(offer.price!),
            priceCurrency: offer.currency ?? "EUR",
            availability,
            itemCondition:
              CONDITION_BY_SELLER_TYPE[seller.type] ?? "https://schema.org/NewCondition",
            seller: { "@type": "Organization", name: seller.name },
            url: partUrl,
          })),
        }
      : undefined,
  };

  // FAQ générée depuis les données de la fiche (visible + JSON-LD FAQPage)
  const faqItems = buildPartFaq({
    reference: part.referenceRaw,
    manufacturerName: manufacturer.name,
    name: part.name,
    description: part.description,
    status: part.status,
    categoryName: category?.name ?? null,
    lifecycleCheckedAt: part.lifecycleCheckedAt,
    replacementReference: detail.replacedBy[0]?.part.referenceRaw ?? null,
    sellerNames: detail.offers.map(({ seller }) => seller.name),
    minPrice: minPrice ?? null,
    currency,
  });

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Accueil", item: siteUrl },
      {
        "@type": "ListItem",
        position: 2,
        name: manufacturer.name,
        item: `${siteUrl}/marque/${manufacturer.slug}`,
      },
      { "@type": "ListItem", position: 3, name: part.referenceRaw, item: partUrl },
    ],
  };

  return (
    <article>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      {faqItems.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd(faqItems)) }}
        />
      )}

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
          {alternativeParts.length > 0 ? (
            <div className="mt-3 grid gap-3">
              {alternativeParts.map(({ part: p, manufacturer: m }) => (
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
          ) : (
            <p className="mt-2 text-sm text-orange-800">
              Aucune alternative connue dans notre catalogue.{" "}
              <Link href="/recherche" className="font-medium underline hover:no-underline">
                Suggérez une référence de remplacement
              </Link>
            </p>
          )}
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
              href: resolveResellerHref(offer.url, part.referenceRaw, part.id),
              scrapedAt: offer.scrapedAt,
            }))}
            searchLinks={resellerSearchLinks}
          />
        </div>
      </section>

      {faqItems.length > 0 && (
        <section className="mt-8">
          <h2 className="text-xl font-semibold">Questions fréquentes</h2>
          <div className="mt-3 max-w-3xl divide-y divide-zinc-100 rounded-xl border border-zinc-200">
            {faqItems.map((item) => (
              <details key={item.question} className="group px-5 py-4">
                <summary className="cursor-pointer list-none font-medium text-zinc-800 marker:hidden [&::-webkit-details-marker]:hidden">
                  <span className="mr-2 inline-block text-zinc-400 transition group-open:rotate-90">›</span>
                  {item.question}
                </summary>
                <p className="mt-2 pl-5 text-sm leading-relaxed text-zinc-600">{item.answer}</p>
              </details>
            ))}
          </div>
        </section>
      )}

      {similarParts.length > 0 && (
        <section className="mt-8 print-hide">
          <h2 className="text-xl font-semibold">
            Pièces similaires de {manufacturer.name}
          </h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {similarParts.map(({ part: p, manufacturer: m }) => (
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
      )}
    </article>
  );
}
