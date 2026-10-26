import { family, type Row } from "../lib";

const base = { manufacturer: "APC", industry: "informatique" } as const;

/** Onduleur : [référence, puissance apparente, remplacement éventuel]. */
function ups(label: string, rows: [string, string, string?][]): Row[] {
  return rows.map(([ref, va, by]) => [ref, `${label} ${va}`, { "Puissance": va }, by ? { by } : undefined]);
}

export const apc = [
  // ── Smart-UPS ──────────────────────────────────────────────────────────────
  ...family(
    { ...base, category: "Onduleurs", status: "active", confidence: 65,
      describe: (name) => `${name}. Onduleur line-interactive Smart-UPS SMT (APC by Schneider Electric), sortie sinusoïdale, prises IEC.` },
    [
      ...ups("Onduleur Smart-UPS SMT tour", [
        ["SMT750I", "750 VA"], ["SMT1000I", "1000 VA"], ["SMT1500I", "1500 VA"], ["SMT2200I", "2200 VA"], ["SMT3000I", "3000 VA"],
      ]),
      ...ups("Onduleur Smart-UPS SMT tour SmartConnect", [
        ["SMT750IC", "750 VA"], ["SMT1000IC", "1000 VA"], ["SMT1500IC", "1500 VA"], ["SMT2200IC", "2200 VA"], ["SMT3000IC", "3000 VA"],
      ]),
      ...ups("Onduleur Smart-UPS SMT rack 2U", [
        ["SMT750RMI2U", "750 VA"], ["SMT1000RMI2U", "1000 VA"], ["SMT1500RMI2U", "1500 VA"], ["SMT2200RMI2U", "2200 VA"], ["SMT3000RMI2U", "3000 VA"],
      ]),
      ...ups("Onduleur Smart-UPS SMT rack 2U SmartConnect", [
        ["SMT750RMI2UC", "750 VA"], ["SMT1000RMI2UC", "1000 VA"], ["SMT1500RMI2UC", "1500 VA"], ["SMT2200RMI2UC", "2200 VA"], ["SMT3000RMI2UC", "3000 VA"],
      ]),
    ],
  ),
  ...family(
    { ...base, category: "Onduleurs", status: "obsolete", confidence: 75,
      describe: (name) => `${name}. Smart-UPS SUA arrêté : APC le remplace par le Smart-UPS SMT de même puissance.` },
    [
      ...ups("Onduleur Smart-UPS SUA tour", [
        ["SUA750I", "750 VA", "SMT750I"], ["SUA1000I", "1000 VA", "SMT1000I"], ["SUA1500I", "1500 VA", "SMT1500I"],
        ["SUA2200I", "2200 VA", "SMT2200I"], ["SUA3000I", "3000 VA", "SMT3000I"],
      ]),
      ...ups("Onduleur Smart-UPS SUA rack 2U", [
        ["SUA750RMI2U", "750 VA", "SMT750RMI2U"], ["SUA1000RMI2U", "1000 VA", "SMT1000RMI2U"], ["SUA1500RMI2U", "1500 VA", "SMT1500RMI2U"],
        ["SUA2200RMI2U", "2200 VA", "SMT2200RMI2U"], ["SUA3000RMI2U", "3000 VA", "SMT3000RMI2U"],
      ]),
    ],
  ),
  ...family(
    { ...base, category: "Onduleurs", status: "active", confidence: 65,
      describe: (name) => `${name}. Onduleur on-line double conversion Smart-UPS SRT (APC by Schneider Electric).` },
    [
      ...ups("Onduleur Smart-UPS SRT tour", [
        ["SRT1000XLI", "1000 VA"], ["SRT1500XLI", "1500 VA"], ["SRT2200XLI", "2200 VA"], ["SRT3000XLI", "3000 VA"],
        ["SRT5KXLI", "5000 VA"], ["SRT6KXLI", "6000 VA"], ["SRT8KXLI", "8000 VA"], ["SRT10KXLI", "10 000 VA"],
      ]),
      ...ups("Onduleur Smart-UPS SRT rack/tour", [
        ["SRT1000RMXLI", "1000 VA"], ["SRT1500RMXLI", "1500 VA"], ["SRT2200RMXLI", "2200 VA"], ["SRT3000RMXLI", "3000 VA"], ["SRT5KRMXLI", "5000 VA"],
      ]),
    ],
  ),
  ...family(
    { ...base, category: "Onduleurs", status: "obsolete", confidence: 65,
      describe: (name) => `${name}. Smart-UPS RT (SURT) arrêté : APC le remplace par le Smart-UPS SRT.` },
    ups("Onduleur Smart-UPS RT", [
      ["SURT1000XLI", "1000 VA", "SRT1000XLI"], ["SURT2000XLI", "2000 VA", "SRT2200XLI"], ["SURT3000XLI", "3000 VA", "SRT3000XLI"],
      ["SURT5000XLI", "5000 VA", "SRT5KXLI"], ["SURT6000XLI", "6000 VA", "SRT6KXLI"], ["SURT10000XLI", "10 000 VA", "SRT10KXLI"],
    ]),
  ),
  // ── Back-UPS ───────────────────────────────────────────────────────────────
  ...family(
    { ...base, category: "Onduleurs", status: "active", confidence: 60,
      describe: (name) => `${name}, onduleur Back-UPS (APC by Schneider Electric) pour postes de travail et petits équipements.` },
    [
      ...ups("Onduleur Back-UPS BX AVR, prises IEC", [
        ["BX750MI", "750 VA"], ["BX950MI", "950 VA"], ["BX1200MI", "1200 VA"], ["BX1600MI", "1600 VA"],
      ]),
      ...ups("Onduleur Back-UPS BX AVR, prises françaises", [
        ["BX750MI-FR", "750 VA"], ["BX950MI-FR", "950 VA"], ["BX1200MI-FR", "1200 VA"], ["BX1600MI-FR", "1600 VA"],
      ]),
      ...ups("Onduleur Back-UPS ES, prises françaises", [["BE700G-FR", "700 VA"], ["BE850G2-FR", "850 VA"]]),
      ...ups("Onduleur Back-UPS Pro", [["BR900G-FR", "900 VA"], ["BR1500GI", "1500 VA"], ["BR1600SI", "1600 VA"]]),
    ],
  ),

  // ── Batteries de remplacement ──────────────────────────────────────────────
  ...family(
    { ...base, category: "Batteries d'onduleur", status: "active", confidence: 70,
      describe: (name) => `${name} : bloc de batteries plomb étanche d'origine APC, remplaçable à chaud sur la plupart des modèles.` },
    [
      ["RBC6", "Cartouche de batterie de remplacement APC n° 6", { "Onduleurs compatibles": "SMT1000I, SMT1000IC, SUA1000I" }],
      ["RBC7", "Cartouche de batterie de remplacement APC n° 7", { "Onduleurs compatibles": "SMT1500I, SMT1500IC, SUA1500I" }],
      ["RBC48", "Cartouche de batterie de remplacement APC n° 48", { "Onduleurs compatibles": "SMT750I, SMT750IC, SUA750I" }],
      ["RBC55", "Cartouche de batterie de remplacement APC n° 55", { "Onduleurs compatibles": "SMT2200I, SMT3000I, SUA2200I, SUA3000I" }],
      ["RBC43", "Cartouche de batterie de remplacement APC n° 43", { "Onduleurs compatibles": "SMT2200RMI2U, SMT3000RMI2U, SUA2200RMI2U, SUA3000RMI2U" }],
    ],
  ),

  // ── Cartes de gestion réseau ───────────────────────────────────────────────
  ...family(
    { ...base, category: "Modules réseau et mémoire", status: "active", confidence: 70,
      describe: (name) => `${name}, carte de gestion réseau pour onduleurs Smart-UPS (supervision SNMP/Web, arrêt des serveurs).` },
    [
      ["AP9640", "Carte de gestion réseau UPS Network Management Card 3", { "Génération": "NMC3" }],
      ["AP9641", "Carte de gestion réseau UPS Network Management Card 3 avec supervision d'environnement", { "Génération": "NMC3" }],
    ],
  ),
  ...family(
    { ...base, category: "Modules réseau et mémoire", status: "obsolete", confidence: 65,
      describe: (name) => `${name}. Carte de gestion réseau de génération précédente arrêtée, remplacée par la génération suivante.` },
    [
      ["AP9630", "Carte de gestion réseau UPS Network Management Card 2", { "Génération": "NMC2" }, { by: "AP9640" }],
      ["AP9631", "Carte de gestion réseau UPS Network Management Card 2 avec supervision d'environnement", { "Génération": "NMC2" }, { by: "AP9641" }],
      ["AP9617", "Carte de gestion réseau UPS Network Management Card", { "Génération": "NMC1" }, { by: "AP9630" }],
      ["AP9619", "Carte de gestion réseau UPS Network Management Card avec supervision d'environnement", { "Génération": "NMC1" }, { by: "AP9631" }],
    ],
  ),
];
