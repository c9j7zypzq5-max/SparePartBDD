import { formatDate, formatPrice } from "@/lib/format";
import { ExternalIcon } from "./icons";

export const SELLER_TYPE_LABELS: Record<string, string> = {
  constructeur: "Constructeur",
  distributeur_officiel: "Distributeur officiel",
  aftermarket: "Aftermarket",
  reconditionne: "Reconditionné",
  occasion: "Occasion",
};

export interface SellerOffer {
  sellerName: string;
  sellerType: string;
  price: string | null;
  currency: string | null;
  availability: string | null;
  url: string;
  /** Date du relevé de l'offre */
  scrapedAt: Date;
}

function BestPriceBadge() {
  return (
    <span className="ml-2 inline-block rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
      Meilleur prix
    </span>
  );
}

/** Offres triées par prix croissant (getPartDetail) : la première offre chiffrée est la moins chère. */
export function SellerTable({ offers }: { offers: SellerOffer[] }) {
  if (offers.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-zinc-300 p-5 text-sm text-zinc-500">
        Aucune offre relevée pour cette pièce pour l&apos;instant. Ajoutez-la à votre liste pour la
        retrouver facilement.
      </p>
    );
  }
  // Mis en avant seulement si la comparaison a un sens : plusieurs prix, une seule devise.
  const priced = offers.filter((o) => o.price != null);
  const comparable = priced.length > 1 && new Set(priced.map((o) => o.currency ?? "EUR")).size === 1;
  const bestIndex = comparable ? offers.findIndex((o) => o.price != null) : -1;
  return (
    <>
      {/* Tableau classique à partir de sm */}
      <table className="hidden w-full text-left text-sm sm:table">
        <thead>
          <tr className="border-b border-zinc-200 text-zinc-500">
            <th scope="col" className="py-2 pr-4 font-medium">Vendeur</th>
            <th scope="col" className="py-2 pr-4 font-medium">Type</th>
            <th scope="col" className="py-2 pr-4 font-medium">Prix</th>
            <th scope="col" className="py-2 pr-4 font-medium">Disponibilité</th>
            <th scope="col" className="py-2 pr-4 font-medium">Relevé le</th>
            <th scope="col" className="py-2 font-medium"><span className="sr-only">Lien</span></th>
          </tr>
        </thead>
        <tbody>
          {offers.map((offer, i) => (
            <tr key={i} className={`border-b border-zinc-100 ${i === bestIndex ? "bg-green-50/50" : ""}`}>
              <td className="py-2.5 pr-4 font-medium">{offer.sellerName}</td>
              <td className="py-2.5 pr-4">
                {SELLER_TYPE_LABELS[offer.sellerType] ?? offer.sellerType}
              </td>
              <td className="py-2.5 pr-4 whitespace-nowrap">
                <span className="font-semibold">{formatPrice(offer.price, offer.currency)}</span>
                {i === bestIndex && <BestPriceBadge />}
              </td>
              <td className="py-2.5 pr-4">{offer.availability ?? "—"}</td>
              <td className="py-2.5 pr-4 text-zinc-400">
                {formatDate(offer.scrapedAt)}
              </td>
              <td className="py-2.5 text-right">
                <a
                  href={offer.url}
                  rel="nofollow sponsored noopener"
                  target="_blank"
                  className="inline-flex items-center gap-1 rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium whitespace-nowrap text-zinc-700 transition hover:border-blue-400 hover:text-blue-700"
                >
                  Voir l&apos;offre <ExternalIcon />
                  <span className="sr-only"> chez {offer.sellerName} (nouvel onglet)</span>
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Cartes empilées sur mobile */}
      <div className="grid gap-3 sm:hidden">
        {offers.map((offer, i) => (
          <div
            key={i}
            className={`rounded-lg border p-3 ${i === bestIndex ? "border-green-300 bg-green-50/50" : "border-zinc-200"}`}
          >
            <div className="flex items-baseline justify-between gap-2">
              <span className="font-medium text-zinc-900">
                {offer.sellerName}
              </span>
              <span className="font-semibold text-zinc-900">
                {formatPrice(offer.price, offer.currency)}
              </span>
            </div>
            <div className="mt-1 text-xs text-zinc-500">
              {SELLER_TYPE_LABELS[offer.sellerType] ?? offer.sellerType}
              {offer.availability && <> · {offer.availability}</>}
              {i === bestIndex && <BestPriceBadge />}
            </div>
            <div className="mt-2 flex items-center justify-between text-xs">
              <span className="text-zinc-400">
                Relevé le {formatDate(offer.scrapedAt)}
              </span>
              <a
                href={offer.url}
                rel="nofollow sponsored noopener"
                target="_blank"
                className="inline-flex items-center gap-1 font-medium text-blue-700 hover:underline"
              >
                Voir l&apos;offre <ExternalIcon />
                <span className="sr-only"> chez {offer.sellerName} (nouvel onglet)</span>
              </a>
            </div>
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs text-zinc-400">
        Prix relevés à la date indiquée, hors frais de port. Vérifiez le prix et la disponibilité sur
        le site du vendeur.
      </p>
    </>
  );
}
