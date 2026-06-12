/** Définition des plans API — importable côté client sans importer la DB. */
export const PLANS = [
  {
    id:       "free"     as const,
    name:     "Free",
    price:    0,
    quota:    1_000,
    features: ["1 000 requêtes / mois", "Endpoints /part et /search", "Support communautaire"],
  },
  {
    id:       "pro"      as const,
    name:     "Pro",
    price:    49,
    quota:    50_000,
    features: ["50 000 requêtes / mois", "Tous les endpoints", "Données d'offres incluses", "Option à l'usage : 1 €/1 000 req au-delà", "Support email"],
  },
  {
    id:       "business" as const,
    name:     "Business",
    price:    149,
    quota:    250_000,
    features: ["250 000 requêtes / mois", "Tous les endpoints", "Données d'offres incluses", "Webhooks de changement de statut", "Option à l'usage : 1 €/1 000 req au-delà", "Support prioritaire"],
  },
];

export type PlanId = (typeof PLANS)[number]["id"];
