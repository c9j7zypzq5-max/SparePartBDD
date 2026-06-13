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

/** Formate un prix numeric (string côté drizzle) en monnaie française. */
function formatPrice(price: string | null, currency: string | null): string {
  if (!price) return "—";
  try {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: currency ?? "EUR",
    }).format(Number(price));
  } catch {
    return `${price} ${currency ?? ""}`.trim();
  }
}

export function SellerTable({ offers }: { offers: SellerOffer[] }) {
  if (offers.length === 0) {
    return (
      <p className="text-sm text-zinc-500">
        Aucune offre relevée pour cette pièce pour l'instant.
      </p>
    );
  }
  return (
    <>
      {/* Tableau classique à partir de sm */}
      <table className="hidden w-full text-left text-sm sm:table">
        <thead>
          <tr className="border-b border-zinc-200 text-zinc-500">
            <th className="py-2 pr-4 font-medium">Vendeur</th>
            <th className="py-2 pr-4 font-medium">Type</th>
            <th className="py-2 pr-4 font-medium">Prix</th>
            <th className="py-2 pr-4 font-medium">Disponibilité</th>
            <th className="py-2 pr-4 font-medium">Relevé le</th>
            <th className="py-2 font-medium" />
          </tr>
        </thead>
        <tbody>
          {offers.map((offer, i) => (
            <tr key={i} className="border-b border-zinc-100">
              <td className="py-2 pr-4 font-medium">{offer.sellerName}</td>
              <td className="py-2 pr-4">
                {SELLER_TYPE_LABELS[offer.sellerType] ?? offer.sellerType}
              </td>
              <td className="py-2 pr-4">
                {formatPrice(offer.price, offer.currency)}
              </td>
              <td className="py-2 pr-4">{offer.availability ?? "—"}</td>
              <td className="py-2 pr-4 text-zinc-400">
                {offer.scrapedAt.toLocaleDateString("fr-FR")}
              </td>
              <td className="py-2">
                <a
                  href={offer.url}
                  rel="nofollow sponsored noopener"
                  target="_blank"
                  className="text-blue-600 hover:underline"
                >
                  Voir l'offre →
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Cartes empilées sur mobile */}
      <div className="grid gap-3 sm:hidden">
        {offers.map((offer, i) => (
          <div key={i} className="rounded-lg border border-zinc-200 p-3">
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
            </div>
            <div className="mt-2 flex items-center justify-between text-xs">
              <span className="text-zinc-400">
                Relevé le {offer.scrapedAt.toLocaleDateString("fr-FR")}
              </span>
              <a
                href={offer.url}
                rel="nofollow sponsored noopener"
                target="_blank"
                className="font-medium text-blue-600 hover:underline"
              >
                Voir l'offre →
              </a>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
