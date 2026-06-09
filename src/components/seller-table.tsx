const SELLER_TYPE_LABELS: Record<string, string> = {
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
    <table className="w-full text-left text-sm">
      <thead>
        <tr className="border-b border-zinc-200 text-zinc-500">
          <th className="py-2 pr-4 font-medium">Vendeur</th>
          <th className="py-2 pr-4 font-medium">Type</th>
          <th className="py-2 pr-4 font-medium">Prix</th>
          <th className="py-2 pr-4 font-medium">Disponibilité</th>
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
              {offer.price ? `${offer.price} ${offer.currency ?? ""}` : "—"}
            </td>
            <td className="py-2 pr-4">{offer.availability ?? "—"}</td>
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
  );
}
