import { family, type Row } from "../lib";

/** Vérin : [référence, alésage, course, remplacement éventuel]. */
function cylinders(label: string, rows: [string, string, string, string?][]): Row[] {
  return rows.map(([ref, bore, stroke, by]) => [
    ref,
    `${label} Ø${bore} course ${stroke} mm`,
    { "Alésage": `${bore} mm`, "Course": `${stroke} mm` },
    by ? { by } : undefined,
  ]);
}

const festo = { manufacturer: "Festo", industry: "industrie" } as const;
const smc = { manufacturer: "SMC", industry: "industrie" } as const;

export const pneumatics = [
  // ── Festo ──────────────────────────────────────────────────────────────────
  ...family(
    { ...festo, category: "Pneumatique", status: "active", confidence: 70,
      describe: (name) => `${name}. Vérin normalisé ISO 15552 DSBC double effet, amortissement pneumatique réglable, détection de position.` },
    cylinders("Vérin normalisé DSBC", [
      ["DSBC-32-50-PPVA-N3", "32", "50"], ["DSBC-32-200-PPVA-N3", "32", "200"],
      ["DSBC-40-100-PPVA-N3", "40", "100"], ["DSBC-40-200-PPVA-N3", "40", "200"],
      ["DSBC-50-100-PPVA-N3", "50", "100"], ["DSBC-63-100-PPVA-N3", "63", "100"],
      ["DSBC-63-200-PPVA-N3", "63", "200"], ["DSBC-80-100-PPVA-N3", "80", "100"],
    ]),
  ),
  ...family(
    { ...festo, category: "Pneumatique", status: "obsolete", confidence: 70,
      describe: (name) => `${name}. Vérin normalisé DNC arrêté : Festo le remplace par le DSBC de mêmes alésage et course.` },
    cylinders("Vérin normalisé DNC", [
      ["DNC-32-50-PPV-A", "32", "50", "DSBC-32-50-PPVA-N3"], ["DNC-32-200-PPV-A", "32", "200", "DSBC-32-200-PPVA-N3"],
      ["DNC-40-100-PPV-A", "40", "100", "DSBC-40-100-PPVA-N3"], ["DNC-50-100-PPV-A", "50", "100", "DSBC-50-100-PPVA-N3"],
      ["DNC-50-200-PPV-A", "50", "200", "DSBC-50-200-PPVA-N3"], ["DNC-63-100-PPV-A", "63", "100", "DSBC-63-100-PPVA-N3"],
    ]),
  ),
  ...family(
    { ...festo, category: "Pneumatique", status: "active", confidence: 65,
      describe: (name) => `${name}. Vérin rond DSNU double effet ISO 6432, avec piston magnétique pour détection de position.` },
    cylinders("Vérin rond DSNU", [
      ["DSNU-12-10-P-A", "12", "10"], ["DSNU-16-25-P-A", "16", "25"],
      ["DSNU-20-50-PPV-A", "20", "50"], ["DSNU-25-100-PPV-A", "25", "100"],
    ]),
  ),
  ...family(
    { ...festo, category: "Pneumatique", status: "active", confidence: 65,
      describe: (name) => `${name}. Vérin compact ADN double effet ISO 21287, avec piston magnétique.` },
    cylinders("Vérin compact ADN", [
      ["ADN-20-10-A-P-A", "20", "10"], ["ADN-32-25-A-P-A", "32", "25"], ["ADN-40-50-A-P-A", "40", "50"],
    ]),
  ),
  ...family(
    { ...festo, category: "Capteurs industriels", status: "active", confidence: 70,
      describe: (name) => `${name}, détecteur de position pour rainure en T des vérins Festo.` },
    [
      ["SMT-8M-A-PS-24V-E-2,5-OE", "Détecteur de proximité SMT-8M électronique PNP, câble 2,5 m", { "Sortie": "PNP, NO", "Raccordement": "câble 2,5 m" }],
      ["SMT-8M-A-PS-24V-E-0,3-M8D", "Détecteur de proximité SMT-8M électronique PNP, câble 0,3 m connecteur M8", { "Sortie": "PNP, NO", "Raccordement": "M8 3 broches" }],
      ["SME-8M-DS-24V-K-2,5-OE", "Détecteur de proximité SME-8M à contact Reed, câble 2,5 m", { "Technologie": "contact Reed", "Raccordement": "câble 2,5 m" }],
    ],
  ),

  // ── SMC ────────────────────────────────────────────────────────────────────
  ...family(
    { ...smc, category: "Pneumatique", status: "active", confidence: 70,
      describe: (name) => `${name}. Vérin compact CQ2 double effet, fixation de base traversante, avec aimant pour détection de position.` },
    cylinders("Vérin compact CDQ2B", [
      ["CDQ2B20-20DZ", "20", "20"], ["CDQ2B25-25DZ", "25", "25"], ["CDQ2B40-50DZ", "40", "50"],
      ["CDQ2B50-50DZ", "50", "50"], ["CDQ2B63-50DZ", "63", "50"],
    ]),
  ),
  ...family(
    { ...smc, category: "Pneumatique", status: "active", confidence: 70,
      describe: (name) => `${name}. Vérin guidé compact MGP à paliers lisses, double effet, avec aimant.` },
    cylinders("Vérin guidé MGPM", [
      ["MGPM16-50Z", "16", "50"], ["MGPM25-50Z", "25", "50"], ["MGPM32-50Z", "32", "50"],
    ]),
  ),
  ...family(
    { ...smc, category: "Pneumatique", status: "active", confidence: 65,
      describe: (name) => `${name}. Vérin normalisé ISO 15552 CP96 double effet, amortissement pneumatique, avec aimant.` },
    cylinders("Vérin normalisé CP96", [
      ["CP96SDB32-100", "32", "100"], ["CP96SDB40-100", "40", "100"], ["CP96SDB50-100", "50", "100"], ["CP96SDB63-100", "63", "100"],
    ]),
  ),
  ...family(
    { ...smc, category: "Pneumatique", status: "active", confidence: 65,
      describe: (name) => `${name}, électrodistributeur 5/2 série SY, bobine 24 V DC.` },
    [
      ["SY3120-5LZ-M5", "Électrodistributeur SY3000 5/2 monostable, orifices M5", { "Fonction": "5/2 monostable", "Raccordement": "M5", "Tension": "24 V DC" }],
      ["SY5120-5LZ-01", "Électrodistributeur SY5000 5/2 monostable, orifices 1/8\"", { "Fonction": "5/2 monostable", "Raccordement": "1/8\"", "Tension": "24 V DC" }],
      ["SY7120-5LZ-02", "Électrodistributeur SY7000 5/2 monostable, orifices 1/4\"", { "Fonction": "5/2 monostable", "Raccordement": "1/4\"", "Tension": "24 V DC" }],
      ["SY3220-5LZ-M5", "Électrodistributeur SY3000 5/2 bistable, orifices M5", { "Fonction": "5/2 bistable", "Raccordement": "M5", "Tension": "24 V DC" }],
      ["SY5220-5LZ-01", "Électrodistributeur SY5000 5/2 bistable, orifices 1/8\"", { "Fonction": "5/2 bistable", "Raccordement": "1/8\"", "Tension": "24 V DC" }],
    ],
  ),
];
