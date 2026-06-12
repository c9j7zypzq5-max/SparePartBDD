/**
 * FAQ auto-générée des pages pièces : questions que les techniciens tapent
 * réellement dans Google ("X est-il obsolète ?", "par quoi remplacer X ?").
 * Affichée sur la fiche ET exposée en JSON-LD FAQPage — cible les featured
 * snippets et les recherches vocales en longue traîne.
 */

export interface FaqItem {
  question: string;
  answer: string;
}

export interface PartFaqInput {
  reference: string;
  manufacturerName: string;
  name: string;
  description: string | null;
  status: string;
  categoryName: string | null;
  lifecycleCheckedAt: Date | null;
  /** Référence de remplacement officielle (si obsolète) */
  replacementReference: string | null;
  /** Vendeurs avec offre relevée, prix min en tête */
  sellerNames: string[];
  minPrice: number | null;
  currency: string;
}

export function buildPartFaq(input: PartFaqInput): FaqItem[] {
  const {
    reference, manufacturerName, name, description, status, categoryName,
    lifecycleCheckedAt, replacementReference, sellerNames, minPrice, currency,
  } = input;
  const full = `${manufacturerName} ${reference}`;
  const items: FaqItem[] = [];

  // 1. Identification de la pièce
  items.push({
    question: `Qu'est-ce que la référence ${reference} de ${manufacturerName} ?`,
    answer: description
      ? `La référence ${full} correspond à : ${name}. ${description}`
      : `La référence ${full} correspond à : ${name}${categoryName ? ` (catégorie ${categoryName})` : ""}.`,
  });

  // 2. Statut de fabrication
  const checkedNote = lifecycleCheckedAt
    ? ` (statut vérifié le ${lifecycleCheckedAt.toLocaleDateString("fr-FR")})`
    : "";
  if (status === "obsolete") {
    items.push({
      question: `La ${full} est-elle obsolète ?`,
      answer: `Oui, la ${full} n'est plus fabriquée${checkedNote}. Elle reste généralement disponible en reconditionné, en surplus ou d'occasion chez les revendeurs spécialisés.`,
    });
  } else if (status === "active") {
    items.push({
      question: `La ${full} est-elle toujours fabriquée ?`,
      answer: `Oui, la ${full} est actuellement commercialisée par ${manufacturerName}${checkedNote}.`,
    });
  }

  // 3. Remplacement (uniquement si obsolète)
  if (status === "obsolete") {
    items.push({
      question: `Par quoi remplacer la ${full} ?`,
      answer: replacementReference
        ? `Le remplacement officiel de la ${full} est la référence ${manufacturerName} ${replacementReference}.`
        : `Aucun remplacement officiel n'est connu pour la ${full}. Les alternatives sont le reconditionné, le surplus, ou une pièce compatible de même catégorie${categoryName ? ` (${categoryName})` : ""}.`,
    });
  }

  // 4. Où acheter
  if (sellerNames.length > 0) {
    const sellers = sellerNames.slice(0, 4).join(", ");
    const priceNote = minPrice != null
      ? ` Prix constaté à partir de ${minPrice.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} ${currency}.`
      : "";
    items.push({
      question: `Où acheter la ${full} ?`,
      answer: `La ${full} est proposée par ${sellers}.${priceNote}`,
    });
  }

  return items;
}

/** Objet JSON-LD schema.org FAQPage prêt à sérialiser. */
export function faqJsonLd(items: FaqItem[]): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };
}
