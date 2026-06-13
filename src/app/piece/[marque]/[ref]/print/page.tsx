import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPartDetail } from "@/lib/queries";
import { generatePartDescription } from "@/lib/part-description";
import { siteUrl } from "@/lib/site-url";

type Params = Promise<{ marque: string; ref: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { marque, ref } = await params;
  const detail = await getPartDetail(marque, ref);
  if (!detail) return { title: "Pièce introuvable" };
  return {
    title: `Fiche ${detail.manufacturer.name} ${detail.part.referenceRaw}`,
    robots: { index: false },
  };
}

export default async function PrintPage({ params }: { params: Params }) {
  const { marque, ref } = await params;
  const detail = await getPartDetail(marque, ref);
  if (!detail) notFound();

  const { part, manufacturer, category } = detail;
  const partUrl = `${siteUrl}/piece/${manufacturer.slug}/${part.slug}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(partUrl)}&color=1a1a1a&bgcolor=ffffff`;
  const description =
    part.description ??
    generatePartDescription(part.name, manufacturer.name, manufacturer.industry, category?.name);

  const priceOffers = detail.offers.filter((o) => o.offer.price != null);

  return (
    <>
      <style>{`
        @media screen {
          header, footer, .no-print { display: none !important; }
          main { max-width: 100% !important; padding: 0 !important; }
        }
      `}</style>
      <script
        dangerouslySetInnerHTML={{
          __html: "window.onload = function(){ window.print(); }",
        }}
      />
      <div className="mx-auto max-w-3xl p-8 font-sans text-zinc-900">
        <div className="mb-6 flex items-start justify-between border-b border-zinc-200 pb-6">
          <div>
            <div className="text-xs font-medium uppercase tracking-widest text-zinc-400">
              SparePartSearch — fiche produit
            </div>
            <h1 className="mt-1 text-2xl font-bold">
              {manufacturer.name}{" "}
              <span className="font-mono">{part.referenceRaw}</span>
            </h1>
            <p className="mt-1 text-zinc-600">{part.name}</p>
          </div>
          <div className="shrink-0 text-right text-xs text-zinc-400">
            <div>
              {part.status === "active" && (
                <span className="rounded bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
                  Fabriquée
                </span>
              )}
              {part.status === "obsolete" && (
                <span className="rounded bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
                  Obsolète
                </span>
              )}
              {part.status === "unknown" && (
                <span className="rounded bg-zinc-100 px-2 py-0.5 text-xs font-semibold text-zinc-500">
                  Statut inconnu
                </span>
              )}
            </div>
            <div className="mt-1">{new Date().toLocaleDateString("fr-FR")}</div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrUrl} alt="QR code" width={80} height={80} className="mt-2 ml-auto" />
          </div>
        </div>

        <section className="mb-6">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-zinc-400">
            Description
          </h2>
          <p className="text-sm leading-relaxed text-zinc-700">{description}</p>
        </section>

        <section className="mb-6 grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-semibold text-zinc-500">Fabricant</span>
            <div className="mt-0.5 text-zinc-900">{manufacturer.name}</div>
          </div>
          {category && (
            <div>
              <span className="font-semibold text-zinc-500">Catégorie</span>
              <div className="mt-0.5 text-zinc-900">{category.name}</div>
            </div>
          )}
          {part.productUrl && (
            <div className="col-span-2">
              <span className="font-semibold text-zinc-500">Page fabricant</span>
              <div className="mt-0.5 break-all text-blue-700">{part.productUrl}</div>
            </div>
          )}
        </section>

        {part.attributes && Object.keys(part.attributes).length > 0 && (
          <section className="mb-6">
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-zinc-400">
              Caractéristiques techniques
            </h2>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
              {Object.entries(part.attributes).map(([key, value]) => (
                <div key={key} className="contents">
                  <dt className="text-zinc-500">{key}</dt>
                  <dd className="font-medium text-zinc-900">{value}</dd>
                </div>
              ))}
            </dl>
          </section>
        )}

        {detail.replacedBy.length > 0 && (
          <section className="mb-6">
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-zinc-400">
              Remplacée par
            </h2>
            <ul className="space-y-1 text-sm">
              {detail.replacedBy.map(({ part: p, manufacturer: m }) => (
                <li key={p.id} className="font-mono">
                  {m.name} {p.referenceRaw}
                </li>
              ))}
            </ul>
          </section>
        )}

        {detail.references.length > 0 && (
          <section className="mb-6">
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-zinc-400">
              Références équivalentes
            </h2>
            <ul className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
              {detail.references.map((r) => (
                <li key={r.id} className="flex justify-between border-b border-zinc-100 py-0.5">
                  <span className="font-mono">{r.reference}</span>
                  <span className="text-zinc-400">{r.type.toUpperCase()}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {priceOffers.length > 0 && (
          <section className="mb-6">
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-zinc-400">
              Offres vendeurs
            </h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 text-left text-xs font-semibold text-zinc-500">
                  <th className="pb-1 pr-4">Vendeur</th>
                  <th className="pb-1 pr-4">Prix</th>
                  <th className="pb-1 pr-4">Disponibilité</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {priceOffers.map(({ offer, seller }) => (
                  <tr key={offer.id}>
                    <td className="py-1 pr-4 font-medium">{seller.name}</td>
                    <td className="py-1 pr-4 font-mono">
                      {parseFloat(offer.price!).toLocaleString("fr-FR", {
                        minimumFractionDigits: 2,
                      })}{" "}
                      {offer.currency ?? "EUR"}
                    </td>
                    <td className="py-1 pr-4 text-zinc-500">
                      {offer.availability ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        <div className="mt-8 border-t border-zinc-200 pt-4 text-xs text-zinc-400">
          Données issues de SparePartSearch — à titre informatif uniquement.
          Vérifiez les informations auprès du fabricant avant tout achat.
        </div>
      </div>
    </>
  );
}
