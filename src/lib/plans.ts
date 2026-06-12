/** Définition des plans API — importable côté client sans importer la DB. */
export const PLANS = [
  {
    id:       "free"       as const,
    name:     "Free",
    price:    0,
    quota:    1_000,
    features: ["1 000 requêtes / mois", "Endpoints /part et /search", "Support communautaire"],
    stripePriceId: null as string | null,
  },
  {
    id:       "pro"        as const,
    name:     "Pro",
    price:    49,
    quota:    50_000,
    features: ["50 000 requêtes / mois", "Tous les endpoints", "Données d'offres incluses", "Support email"],
    stripePriceId: null as string | null,
  },
  {
    id:       "enterprise" as const,
    name:     "Enterprise",
    price:    null as number | null,
    quota:    10_000_000,
    features: ["Illimité", "Accès bulk export", "SLA garanti", "Support dédié"],
    stripePriceId: null as string | null,
  },
];
