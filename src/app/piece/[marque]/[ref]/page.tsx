import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PartCard } from "@/components/part-card";
import { SellerTable } from "@/components/seller-table";
import { StatusBadge } from "@/components/status-badge";
import { generatePartDescription } from "@/lib/part-description";
import { getPartDetail } from "@/lib/queries";

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
  return {
    title: `${manufacturer.name} ${part.referenceRaw} — ${part.name}`,
    description: `${part.name} ${manufacturer.name} référence ${part.referenceRaw} : statut de fabrication, références de remplacement, pièces compatibles, vendeurs et prix.`,
    alternates: { canonical: `/piece/${marque}/${ref}` },
  };
}

export default async function PartPage({ params }: { params: Params }) {
  const { marque, ref } = await params;
  const detail = await getPartDetail(marque, ref);
  if (!detail) notFound();

  const { part, manufacturer, category } = detail;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: part.name,
    sku: part.referenceRaw,
    mpn: part.referenceRaw,
    brand: { "@type": "Brand", name: manufacturer.name },
    description: part.description ?? undefined,
    offers: detail.offers
      .filter((o) => o.offer.price)
      .map((o) => ({
        "@type": "Offer",
        price: o.offer.price,
        priceCurrency: o.offer.currency ?? "EUR",
        url: o.offer.url,
        seller: { "@type": "Organization", name: o.seller.name },
      })),
  };

  return (
    <article>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <nav className="text-sm text-zinc-500">
        <Link href={`/marque/${manufacturer.slug}`} className="hover:underline">
          {manufacturer.name}
        </Link>
        {category && (
          <>
            {" / "}
            <Link href={`/categorie/${category.slug}`} className="hover:underline">
              {category.name}
            </Link>
          </>
        )}
      </nav>

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
        <section className="mt-8">
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
    </article>
  );
}
