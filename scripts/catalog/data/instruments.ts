import { family } from "../lib";

const keysight = { manufacturer: "Keysight", industry: "industrie", category: "Instruments de mesure" } as const;
const fluke = { manufacturer: "Fluke", industry: "industrie", category: "Instruments de mesure" } as const;

export const instruments = [
  // ── Keysight : multimètres de table ────────────────────────────────────────
  ...family(
    { ...keysight, status: "active", confidence: 75,
      describe: (name) => `${name}, multimètre numérique de table Truevolt.` },
    [
      ["34460A", "Multimètre numérique Truevolt 6½ digits, base", { "Résolution": "6½ digits" }],
      ["34470A", "Multimètre numérique Truevolt 7½ digits", { "Résolution": "7½ digits" }],
    ],
  ),
  ...family(
    { ...keysight, status: "obsolete", confidence: 70,
      describe: (name) => `${name}. Modèle arrêté : Keysight le remplace par le multimètre Truevolt équivalent.` },
    [
      ["34410A", "Multimètre numérique 6½ digits haute performance", { "Résolution": "6½ digits" }, { by: "34465A" }],
      ["34411A", "Multimètre numérique 6½ digits avec numériseur", { "Résolution": "6½ digits" }, { by: "34470A" }],
    ],
  ),
  // ── Keysight : multimètres portables ───────────────────────────────────────
  ...family(
    { ...keysight, status: "active", confidence: 70,
      describe: (name) => `${name}, multimètre numérique portable Keysight.` },
    [
      ["U1233A", "Multimètre portable U1233A, 6000 points, True RMS", { "Affichage": "6000 points" }],
      ["U1272A", "Multimètre portable U1272A, 30 000 points, True RMS", { "Affichage": "30 000 points" }],
      ["U1282A", "Multimètre portable U1282A, 60 000 points, True RMS, IP67", { "Affichage": "60 000 points" }],
    ],
  ),
  // ── Keysight : oscilloscopes ───────────────────────────────────────────────
  ...family(
    { ...keysight, status: "active", confidence: 70,
      describe: (name) => `${name}, oscilloscope InfiniiVision 1000 X.` },
    [
      ["DSOX1102G", "Oscilloscope InfiniiVision 1000 X 70 MHz 2 voies, générateur intégré", { "Bande passante": "70 MHz", "Voies": "2" }],
      ["DSOX1202G", "Oscilloscope InfiniiVision 1000 X 70 MHz 2 voies (évolutif 200 MHz), générateur intégré", { "Bande passante": "70 MHz", "Voies": "2" }],
      ["DSOX1204G", "Oscilloscope InfiniiVision 1000 X 70 MHz 4 voies (évolutif 200 MHz), générateur intégré", { "Bande passante": "70 MHz", "Voies": "4" }],
    ],
  ),
  ...family(
    { ...keysight, status: "obsolete", confidence: 70,
      describe: (name) => `${name}. Oscilloscope InfiniiVision 3000 X série A arrêté, remplacé par la série 3000T X.` },
    [
      ["DSOX3012A", "Oscilloscope InfiniiVision 3000 X 100 MHz 2 voies", { "Bande passante": "100 MHz", "Voies": "2" }, { by: "DSOX3012T" }],
      ["DSOX3014A", "Oscilloscope InfiniiVision 3000 X 100 MHz 4 voies", { "Bande passante": "100 MHz", "Voies": "4" }, { by: "DSOX3014T" }],
      ["DSOX3024A", "Oscilloscope InfiniiVision 3000 X 200 MHz 4 voies", { "Bande passante": "200 MHz", "Voies": "4" }, { by: "DSOX3024T" }],
      ["DSOX3034A", "Oscilloscope InfiniiVision 3000 X 350 MHz 4 voies", { "Bande passante": "350 MHz", "Voies": "4" }, { by: "DSOX3034T" }],
      ["DSOX3054A", "Oscilloscope InfiniiVision 3000 X 500 MHz 4 voies", { "Bande passante": "500 MHz", "Voies": "4" }, { by: "DSOX3054T" }],
    ],
  ),
  ...family(
    { ...keysight, status: "unknown", confidence: 65,
      describe: (name) => `${name}, oscilloscope InfiniiVision 3000T X à écran tactile.` },
    [
      ["DSOX3012T", "Oscilloscope InfiniiVision 3000T X 100 MHz 2 voies", { "Bande passante": "100 MHz", "Voies": "2" }],
      ["DSOX3014T", "Oscilloscope InfiniiVision 3000T X 100 MHz 4 voies", { "Bande passante": "100 MHz", "Voies": "4" }],
      ["DSOX3024T", "Oscilloscope InfiniiVision 3000T X 200 MHz 4 voies", { "Bande passante": "200 MHz", "Voies": "4" }],
      ["DSOX3034T", "Oscilloscope InfiniiVision 3000T X 350 MHz 4 voies", { "Bande passante": "350 MHz", "Voies": "4" }],
      ["DSOX3054T", "Oscilloscope InfiniiVision 3000T X 500 MHz 4 voies", { "Bande passante": "500 MHz", "Voies": "4" }],
    ],
  ),
  // ── Keysight : alimentations et générateurs ────────────────────────────────
  ...family(
    { ...keysight, status: "active", confidence: 70,
      describe: (name) => `${name}, alimentation de laboratoire programmable Keysight.` },
    [
      ["E36312A", "Alimentation triple sortie E36312A, 80 W", { "Sorties": "6 V/5 A, 25 V/1 A, 25 V/1 A" }],
      ["E36313A", "Alimentation triple sortie E36313A, 160 W", { "Sorties": "6 V/10 A, 25 V/2 A, 25 V/2 A" }],
      ["E36102B", "Alimentation simple sortie E36102B, 6 V / 5 A", { "Sortie": "6 V / 5 A" }],
      ["E36104B", "Alimentation simple sortie E36104B, 35 V / 1 A", { "Sortie": "35 V / 1 A" }],
      ["E36105B", "Alimentation simple sortie E36105B, 60 V / 0,6 A", { "Sortie": "60 V / 0,6 A" }],
      ["E36106B", "Alimentation simple sortie E36106B, 100 V / 0,4 A", { "Sortie": "100 V / 0,4 A" }],
    ],
  ),
  ...family(
    { ...keysight, status: "active", confidence: 70,
      describe: (name) => `${name}, générateur de fonctions et de formes d'onde arbitraires Keysight.` },
    [
      ["33509B", "Générateur Trueform 33500B 20 MHz 1 voie", { "Fréquence max.": "20 MHz", "Voies": "1" }],
      ["33510B", "Générateur Trueform 33500B 20 MHz 2 voies", { "Fréquence max.": "20 MHz", "Voies": "2" }],
      ["33511B", "Générateur Trueform 33500B 20 MHz 1 voie, arbitraire", { "Fréquence max.": "20 MHz", "Voies": "1" }],
      ["33512B", "Générateur Trueform 33500B 20 MHz 2 voies, arbitraire", { "Fréquence max.": "20 MHz", "Voies": "2" }],
      ["33519B", "Générateur Trueform 33500B 30 MHz 1 voie", { "Fréquence max.": "30 MHz", "Voies": "1" }],
      ["33521B", "Générateur Trueform 33500B 30 MHz 1 voie, arbitraire", { "Fréquence max.": "30 MHz", "Voies": "1" }],
      ["33611A", "Générateur Trueform 33600A 80 MHz 1 voie", { "Fréquence max.": "80 MHz", "Voies": "1" }],
      ["33612A", "Générateur Trueform 33600A 80 MHz 2 voies", { "Fréquence max.": "80 MHz", "Voies": "2" }],
      ["33621A", "Générateur Trueform 33600A 120 MHz 1 voie", { "Fréquence max.": "120 MHz", "Voies": "1" }],
      ["33622A", "Générateur Trueform 33600A 120 MHz 2 voies", { "Fréquence max.": "120 MHz", "Voies": "2" }],
    ],
  ),

  // ── Fluke : multimètres ────────────────────────────────────────────────────
  ...family(
    { ...fluke, status: "active", confidence: 75,
      describe: (name) => `${name}, multimètre numérique portable Fluke.` },
    [
      ["FLUKE-101", "Multimètre numérique Fluke 101", { "Mesure": "valeur moyenne" }],
      ["FLUKE-107", "Multimètre numérique Fluke 107", { "Mesure": "valeur moyenne" }],
      ["FLUKE-115", "Multimètre numérique Fluke 115 True RMS", { "Mesure": "True RMS" }],
      ["FLUKE-116", "Multimètre Fluke 116 True RMS pour le CVC, avec thermomètre", { "Mesure": "True RMS" }],
      ["FLUKE-175", "Multimètre numérique Fluke 175 True RMS", { "Mesure": "True RMS", "Catégorie": "CAT III 1000 V / CAT IV 600 V" }],
      ["FLUKE-177", "Multimètre numérique Fluke 177 True RMS, rétroéclairage", { "Mesure": "True RMS", "Catégorie": "CAT III 1000 V / CAT IV 600 V" }],
      ["FLUKE-287", "Multimètre enregistreur Fluke 287 True RMS", { "Mesure": "True RMS", "Affichage": "50 000 points" }],
      ["FLUKE-289", "Multimètre enregistreur industriel Fluke 289 True RMS", { "Mesure": "True RMS", "Affichage": "50 000 points" }],
      ["FLUKE-28-II", "Multimètre industriel Fluke 28 II True RMS, IP67", { "Mesure": "True RMS" }],
    ],
  ),
  ...family(
    { ...fluke, status: "obsolete", confidence: 70,
      describe: (name) => `${name}. Modèle arrêté, remplacé par son successeur dans la gamme Fluke.` },
    [
      ["FLUKE-87-3", "Multimètre numérique Fluke 87 III", null, { by: "FLUKE-87-5" }],
      ["FLUKE-187", "Multimètre enregistreur Fluke 187", null, { by: "FLUKE-287" }],
      ["FLUKE-189", "Multimètre enregistreur Fluke 189", null, { by: "FLUKE-289" }],
    ],
  ),
  // ── Fluke : pinces, testeurs d'isolement, calibrateurs ─────────────────────
  ...family(
    { ...fluke, status: "active", confidence: 75,
      describe: (name) => `${name}, instrument de mesure électrique Fluke.` },
    [
      ["FLUKE-323", "Pince multimètre Fluke 323 True RMS 400 A AC", { "Courant max.": "400 A AC" }],
      ["FLUKE-324", "Pince multimètre Fluke 324 True RMS 400 A AC, température et capacité", { "Courant max.": "400 A AC" }],
      ["FLUKE-325", "Pince multimètre Fluke 325 True RMS 400 A AC/DC", { "Courant max.": "400 A AC/DC" }],
      ["FLUKE-374-FC", "Pince multimètre Fluke 374 FC True RMS 600 A AC/DC, sans fil", { "Courant max.": "600 A AC/DC" }],
      ["FLUKE-375-FC", "Pince multimètre Fluke 375 FC True RMS 600 A AC/DC, sans fil", { "Courant max.": "600 A AC/DC" }],
      ["FLUKE-902-FC", "Pince multimètre CVC Fluke 902 FC True RMS", { "Courant max.": "600 A AC" }],
      ["FLUKE-1503", "Testeur d'isolement Fluke 1503", { "Tensions d'essai": "500 V, 1000 V" }],
      ["FLUKE-1507", "Testeur d'isolement Fluke 1507", { "Tensions d'essai": "50 V à 1000 V" }],
      ["FLUKE-1587-FC", "Multimètre d'isolement Fluke 1587 FC, sans fil", { "Tensions d'essai": "50 V à 1000 V" }],
      ["FLUKE-T6-600", "Testeur électrique Fluke T6-600 FieldSense", { "Tension max.": "600 V AC" }],
      ["FLUKE-T6-1000", "Testeur électrique Fluke T6-1000 FieldSense", { "Tension max.": "1000 V AC" }],
      ["FLUKE-725", "Calibrateur de process multifonction Fluke 725", null],
      ["FLUKE-726", "Calibrateur de process multifonction de précision Fluke 726", null],
      ["FLUKE-754", "Calibrateur de process documenteur Fluke 754 HART", null],
      ["FLUKE-789", "Multimètre de process Fluke 789 ProcessMeter", null],
    ],
  ),
  ...family(
    { ...fluke, status: "obsolete", confidence: 65,
      describe: (name) => `${name}. Version arrêtée, remplacée par la version FC (connectée sans fil).` },
    [
      ["FLUKE-374", "Pince multimètre Fluke 374 True RMS 600 A AC/DC", { "Courant max.": "600 A AC/DC" }, { by: "FLUKE-374-FC" }],
      ["FLUKE-376", "Pince multimètre Fluke 376 True RMS 1000 A AC/DC", { "Courant max.": "1000 A AC/DC" }, { by: "FLUKE-376-FC" }],
      ["FLUKE-1587", "Multimètre d'isolement Fluke 1587", null, { by: "FLUKE-1587-FC" }],
    ],
  ),
];
