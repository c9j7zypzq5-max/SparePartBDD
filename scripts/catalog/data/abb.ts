import { family, type Row } from "../lib";

const base = { manufacturer: "ABB", industry: "industrie" } as const;

/** Variateur : [référence, puissance, remplacement éventuel]. */
function drives(series: string, supply: string, rows: [string, string, string?][]): Row[] {
  return rows.map(([ref, kw, by]) => [
    ref,
    `Variateur ${series} ${kw} ${supply}`,
    { "Puissance": kw, "Alimentation": `3 ph ${supply}` },
    by ? { by } : undefined,
  ]);
}

/** Contacteur AF : [référence, calibre AC-3, puissance 400 V, contacts auxiliaires, bobine]. */
function afContactors(rows: [string, string, string, string, string][]): Row[] {
  return rows.map(([ref, amps, kw, aux, coil]) => [
    ref,
    `Contacteur AF 3P ${amps}, bobine ${coil}`,
    { "Courant AC-3": amps, "Puissance AC-3 400 V": kw, "Contacts auxiliaires": aux, "Bobine": coil },
  ]);
}

export const abb = [
  // ── ACS580 (général) ───────────────────────────────────────────────────────
  ...family(
    { ...base, category: "Variateurs de vitesse", status: "active", confidence: 80,
      describe: (name) => `${name}. Variateur général ACS580-01 montage mural, filtre CEM et self intégrés, assistants de mise en service.` },
    drives("ACS580-01", "380-480 V", [
      ["ACS580-01-02A7-4", "0,75 kW"], ["ACS580-01-03A4-4", "1,1 kW"], ["ACS580-01-04A1-4", "1,5 kW"],
      ["ACS580-01-05A7-4", "2,2 kW"], ["ACS580-01-07A3-4", "3 kW"], ["ACS580-01-09A5-4", "4 kW"],
      ["ACS580-01-12A7-4", "5,5 kW"], ["ACS580-01-033A-4", "15 kW"], ["ACS580-01-039A-4", "18,5 kW"],
      ["ACS580-01-062A-4", "30 kW"], ["ACS580-01-073A-4", "37 kW"], ["ACS580-01-106A-4", "55 kW"],
      ["ACS580-01-145A-4", "75 kW"],
    ]),
  ),
  // ── ACS550 (arrêté → ACS580 de même puissance) ─────────────────────────────
  ...family(
    { ...base, category: "Variateurs de vitesse", status: "obsolete", confidence: 75,
      describe: (name) => `${name}. Gamme ACS550 arrêtée : ABB la remplace par l'ACS580 de même puissance.` },
    drives("ACS550-01", "380-480 V", [
      ["ACS550-01-03A3-4", "1,1 kW", "ACS580-01-03A4-4"], ["ACS550-01-04A1-4", "1,5 kW", "ACS580-01-04A1-4"],
      ["ACS550-01-05A4-4", "2,2 kW", "ACS580-01-05A7-4"], ["ACS550-01-06A9-4", "3 kW", "ACS580-01-07A3-4"],
      ["ACS550-01-08A8-4", "4 kW", "ACS580-01-09A5-4"], ["ACS550-01-012A-4", "5,5 kW", "ACS580-01-12A7-4"],
      ["ACS550-01-023A-4", "11 kW", "ACS580-01-026A-4"], ["ACS550-01-031A-4", "15 kW", "ACS580-01-033A-4"],
      ["ACS550-01-045A-4", "22 kW", "ACS580-01-046A-4"], ["ACS550-01-059A-4", "30 kW", "ACS580-01-062A-4"],
      ["ACS550-01-087A-4", "45 kW", "ACS580-01-088A-4"], ["ACS550-01-125A-4", "55 kW", "ACS580-01-106A-4"],
      ["ACS550-01-157A-4", "75 kW", "ACS580-01-145A-4"],
    ]),
  ),
  // ── ACS880 (industriel) ────────────────────────────────────────────────────
  ...family(
    { ...base, category: "Variateurs de vitesse", status: "active", confidence: 80,
      describe: (name) => `${name}. Variateur industriel ACS880-01 à commande directe de couple (DTC), montage mural.` },
    drives("ACS880-01", "380-415 V", [
      ["ACS880-01-02A4-3", "0,75 kW"], ["ACS880-01-03A3-3", "1,1 kW"], ["ACS880-01-04A0-3", "1,5 kW"],
      ["ACS880-01-05A6-3", "2,2 kW"], ["ACS880-01-07A2-3", "3 kW"], ["ACS880-01-09A4-3", "4 kW"],
      ["ACS880-01-12A6-3", "5,5 kW"], ["ACS880-01-017A-3", "7,5 kW"], ["ACS880-01-032A-3", "15 kW"],
      ["ACS880-01-038A-3", "18,5 kW"], ["ACS880-01-045A-3", "22 kW"], ["ACS880-01-072A-3", "37 kW"],
      ["ACS880-01-087A-3", "45 kW"], ["ACS880-01-105A-3", "55 kW"], ["ACS880-01-145A-3", "75 kW"],
    ]),
  ),

  // ── Contacteurs AF ─────────────────────────────────────────────────────────
  ...family(
    { ...base, category: "Contacteurs et relais", status: "active", confidence: 80,
      describe: (name) => `${name}. Contacteur tripolaire AF à bobine électronique large plage (AC/DC), pour commande de moteurs.` },
    afContactors([
      ["AF12-30-10-13", "12 A", "5,5 kW", "1 NO", "100-250 V AC/DC"],
      ["AF30-30-00-13", "32 A", "15 kW", "aucun", "100-250 V AC/DC"],
      ["AF38-30-00-13", "38 A", "18,5 kW", "aucun", "100-250 V AC/DC"],
      ["AF40-30-00-13", "40 A", "18,5 kW", "aucun", "100-250 V AC/DC"],
      ["AF80-30-11-13", "80 A", "37 kW", "1 NO + 1 NC", "100-250 V AC/DC"],
      ["AF96-30-11-13", "96 A", "45 kW", "1 NO + 1 NC", "100-250 V AC/DC"],
      ["AF09-30-01-13", "9 A", "4 kW", "1 NC", "100-250 V AC/DC"],
      ["AF09-30-10-11", "9 A", "4 kW", "1 NO", "24-60 V AC / 20-60 V DC"],
      ["AF16-30-10-11", "18 A", "7,5 kW", "1 NO", "24-60 V AC / 20-60 V DC"],
      ["AF26-30-00-11", "26 A", "11 kW", "aucun", "24-60 V AC / 20-60 V DC"],
    ]),
  ),
  ...family(
    { ...base, category: "Contacteurs et relais", status: "active", confidence: 70,
      describe: (name) => `${name}. Contacteur AF..Z à faible consommation de bobine, commandable directement par une sortie d'automate.` },
    afContactors([
      ["AF09Z-30-10-21", "9 A", "4 kW", "1 NO", "24 V DC"],
      ["AF16Z-30-10-21", "18 A", "7,5 kW", "1 NO", "24 V DC"],
    ]),
  ),
  // ── Contacteurs A (arrêtés → AF) ───────────────────────────────────────────
  ...family(
    { ...base, category: "Contacteurs et relais", status: "obsolete", confidence: 65,
      describe: (name) => `${name}. Gamme A arrêtée : ABB oriente vers le contacteur AF de même calibre (bobine large plage).` },
    [
      ["A9-30-10-80", "Contacteur A9 3P 9 A, bobine 220-230 V 50 Hz", { "Courant AC-3": "9 A" }, { by: "AF09-30-10-13" }],
      ["A12-30-10-80", "Contacteur A12 3P 12 A, bobine 220-230 V 50 Hz", { "Courant AC-3": "12 A" }, { by: "AF12-30-10-13" }],
      ["A16-30-10-80", "Contacteur A16 3P 17 A, bobine 220-230 V 50 Hz", { "Courant AC-3": "17 A" }, { by: "AF16-30-10-13" }],
      ["A30-30-10-80", "Contacteur A30 3P 32 A, bobine 220-230 V 50 Hz", { "Courant AC-3": "32 A" }, { by: "AF30-30-00-13" }],
      ["A40-30-00-80", "Contacteur A40 3P 37 A, bobine 220-230 V 50 Hz", { "Courant AC-3": "37 A" }, { by: "AF40-30-00-13" }],
      ["A50-30-11-80", "Contacteur A50 3P 50 A, bobine 220-230 V 50 Hz", { "Courant AC-3": "50 A" }, { by: "AF52-30-00-13" }],
      ["A63-30-11-80", "Contacteur A63 3P 65 A, bobine 220-230 V 50 Hz", { "Courant AC-3": "65 A" }, { by: "AF65-30-00-13" }],
      ["A75-30-11-80", "Contacteur A75 3P 75 A, bobine 220-230 V 50 Hz", { "Courant AC-3": "75 A" }, { by: "AF80-30-11-13" }],
    ],
  ),

  // ── Disjoncteurs-moteurs MS116 / MS132 ─────────────────────────────────────
  // MS116-1.0, MS116-1.6, MS132-1.0, MS132-1.6 et MS132-2.5 sont omis : une
  // fois normalisées, leurs références se confondent avec MS116-10, MS116-16,
  // MS132-10, MS132-16 et MS132-25.
  ...family(
    { ...base, category: "Disjoncteurs et protection moteur", status: "active", confidence: 75,
      describe: (name) => `${name} : disjoncteur-moteur magnéto-thermique compact (45 mm), protection contre les courts-circuits, surcharges et pertes de phase.` },
    ([
      ["MS116-0.16", "0,10 à 0,16 A"], ["MS116-0.25", "0,16 à 0,25 A"], ["MS116-0.4", "0,25 à 0,40 A"],
      ["MS116-0.63", "0,40 à 0,63 A"], ["MS116-2.5", "1,6 à 2,5 A"],
      ["MS116-4.0", "2,5 à 4,0 A"], ["MS116-6.3", "4,0 à 6,3 A"], ["MS116-10", "6,3 à 10 A"],
      ["MS116-12", "8,0 à 12 A"], ["MS116-16", "10 à 16 A"],
    ] as const).map(([ref, range]): Row => [ref, `Disjoncteur-moteur MS116 ${range}`, { "Plage de réglage thermique": range }]),
  ),
  ...family(
    { ...base, category: "Disjoncteurs et protection moteur", status: "active", confidence: 75,
      describe: (name) => `${name} : disjoncteur-moteur magnéto-thermique MS132, pouvoir de coupure élevé, protection contre les courts-circuits, surcharges et pertes de phase.` },
    ([
      ["MS132-0.16", "0,10 à 0,16 A"], ["MS132-0.25", "0,16 à 0,25 A"], ["MS132-0.4", "0,25 à 0,40 A"],
      ["MS132-0.63", "0,40 à 0,63 A"], ["MS132-4.0", "2,5 à 4,0 A"],
      ["MS132-6.3", "4,0 à 6,3 A"], ["MS132-10", "6,3 à 10 A"], ["MS132-12", "8,0 à 12 A"],
      ["MS132-16", "10 à 16 A"], ["MS132-20", "16 à 20 A"], ["MS132-25", "20 à 25 A"], ["MS132-32", "25 à 32 A"],
    ] as const).map(([ref, range]): Row => [ref, `Disjoncteur-moteur MS132 ${range}`, { "Plage de réglage thermique": range }]),
  ),

  // ── Disjoncteurs modulaires S200 ───────────────────────────────────────────
  ...family(
    { ...base, category: "Disjoncteurs et protection moteur", status: "active", confidence: 75,
      describe: (name) => `${name} : disjoncteur modulaire System pro M compact S200, pouvoir de coupure 6 kA, montage rail DIN.` },
    [
      ["S201-C6", "Disjoncteur S201 1P 6 A courbe C", { "Pôles": "1P", "Calibre": "6 A", "Courbe": "C" }, { oem: ["2CDS251001R0064"] }],
      ["S201-C10", "Disjoncteur S201 1P 10 A courbe C", { "Pôles": "1P", "Calibre": "10 A", "Courbe": "C" }, { oem: ["2CDS251001R0104"] }],
      ["S201-C16", "Disjoncteur S201 1P 16 A courbe C", { "Pôles": "1P", "Calibre": "16 A", "Courbe": "C" }, { oem: ["2CDS251001R0164"] }],
      ["S201-C20", "Disjoncteur S201 1P 20 A courbe C", { "Pôles": "1P", "Calibre": "20 A", "Courbe": "C" }, { oem: ["2CDS251001R0204"] }],
      ["S201-C25", "Disjoncteur S201 1P 25 A courbe C", { "Pôles": "1P", "Calibre": "25 A", "Courbe": "C" }, { oem: ["2CDS251001R0254"] }],
      ["S201-C32", "Disjoncteur S201 1P 32 A courbe C", { "Pôles": "1P", "Calibre": "32 A", "Courbe": "C" }, { oem: ["2CDS251001R0324"] }],
      ["S202-C16", "Disjoncteur S202 2P 16 A courbe C", { "Pôles": "2P", "Calibre": "16 A", "Courbe": "C" }, { oem: ["2CDS252001R0164"] }],
      ["S203-C16", "Disjoncteur S203 3P 16 A courbe C", { "Pôles": "3P", "Calibre": "16 A", "Courbe": "C" }, { oem: ["2CDS253001R0164"] }],
      ["S203-C32", "Disjoncteur S203 3P 32 A courbe C", { "Pôles": "3P", "Calibre": "32 A", "Courbe": "C" }, { oem: ["2CDS253001R0324"] }],
    ],
  ),

  // ── Alimentations CP-E ─────────────────────────────────────────────────────
  ...family(
    { ...base, category: "Alimentations industrielles", status: "active", confidence: 70,
      describe: (name) => `${name}. Alimentation à découpage CP-E pour rail DIN, entrée large plage 100-240 V AC.` },
    [
      ["CP-E 24/0.75", "Alimentation CP-E 24 V / 0,75 A", { "Sortie": "24 V DC / 0,75 A" }],
      ["CP-E 24/1.25", "Alimentation CP-E 24 V / 1,25 A", { "Sortie": "24 V DC / 1,25 A" }],
      ["CP-E 24/2.5", "Alimentation CP-E 24 V / 2,5 A", { "Sortie": "24 V DC / 2,5 A" }],
      ["CP-E 24/5.0", "Alimentation CP-E 24 V / 5 A", { "Sortie": "24 V DC / 5 A" }],
      ["CP-E 24/20.0", "Alimentation CP-E 24 V / 20 A", { "Sortie": "24 V DC / 20 A" }],
    ],
  ),

  // ── Automates AC500 ────────────────────────────────────────────────────────
  ...family(
    { ...base, category: "Automates programmables", status: "active", confidence: 70,
      describe: (name) => `${name}, automate AC500 V3 programmable avec Automation Builder (CODESYS), deux ports Ethernet.` },
    [
      ["PM5630-2ETH", "Processeur AC500 V3 PM5630-2ETH", { "Communication": "2 x Ethernet" }],
      ["PM5650-2ETH", "Processeur AC500 V3 PM5650-2ETH", { "Communication": "2 x Ethernet" }],
      ["PM5670-2ETH", "Processeur AC500 V3 PM5670-2ETH", { "Communication": "2 x Ethernet" }],
    ],
  ),
  ...family(
    { ...base, category: "Automates programmables", status: "unknown", confidence: 65,
      describe: (name) => `${name}, automate AC500 V2. Gamme en phase de fin de vie : ABB oriente les nouveaux projets vers l'AC500 V3.` },
    [
      ["PM573-ETH", "Processeur AC500 V2 PM573-ETH", { "Communication": "Ethernet" }],
      ["PM583-ETH", "Processeur AC500 V2 PM583-ETH", { "Communication": "Ethernet" }],
      ["PM590-ETH", "Processeur AC500 V2 PM590-ETH", { "Communication": "Ethernet" }],
      ["PM591-ETH", "Processeur AC500 V2 PM591-ETH", { "Communication": "Ethernet" }],
    ],
  ),
  ...family(
    { ...base, category: "Modules d'E/S déportées", status: "active", confidence: 70,
      describe: (name) => `${name}, module d'E/S S500 pour automates AC500 et coupleurs de bus déportés.` },
    [
      ["DI524", "Module S500 32 entrées TOR 24 V DC", { "Voies": "32 DI" }],
      ["DO524", "Module S500 32 sorties TOR transistor 24 V DC", { "Voies": "32 DO" }],
      ["DC532", "Module S500 16 entrées + 16 voies configurables E/S", { "Voies": "16 DI + 16 DC" }],
      ["DX522", "Module S500 8 entrées TOR / 8 sorties relais", { "Voies": "8 DI / 8 DO relais" }],
      ["AI523", "Module S500 16 entrées analogiques", { "Voies": "16 AI" }],
      ["AO523", "Module S500 16 sorties analogiques", { "Voies": "16 AO" }],
      ["AX521", "Module S500 4 entrées / 4 sorties analogiques", { "Voies": "4 AI / 4 AO" }],
      ["AX522", "Module S500 8 entrées / 8 sorties analogiques", { "Voies": "8 AI / 8 AO" }],
    ],
  ),
];
