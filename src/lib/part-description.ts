const INDUSTRY_PHRASES: Record<string, string> = {
  industrie: "applications d'automatisation industrielle",
  informatique: "systèmes informatiques et réseaux",
  automobile: "équipements automobiles",
  electromenager: "appareils électroménagers",
  hvac: "installations de chauffage, ventilation et climatisation",
  electronique: "systèmes électroniques",
};

export function generatePartDescription(
  name: string,
  manufacturerName: string,
  industry?: string | null,
  categoryName?: string | null,
): string {
  const sentences: string[] = [`${name} de ${manufacturerName}.`];

  if (categoryName) {
    sentences.push(`Composant de la catégorie ${categoryName.toLowerCase()}.`);
  } else if (industry && INDUSTRY_PHRASES[industry]) {
    sentences.push(`Pièce pour ${INDUSTRY_PHRASES[industry]}.`);
  }

  return sentences.join(" ");
}
