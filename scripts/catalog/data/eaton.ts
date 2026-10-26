import { family, type Row } from "../lib";

const industrial = { manufacturer: "Eaton", industry: "industrie" } as const;
const it = { manufacturer: "Eaton", industry: "informatique" } as const;

/** Contacteur DILM : [calibre, courant AC-3, puissance 400 V, contact auxiliaire intégré]. */
function dilm(coil: string, coilLabel: string, rows: [string, string, string, boolean][]): Row[] {
  return rows.map(([size, amps, kw, aux]) => [
    `DILM${size}${aux ? "-10" : ""}(${coil})`,
    `Contacteur DILM${size} 3P ${amps}, bobine ${coilLabel}`,
    { "Courant AC-3": amps, "Puissance AC-3 400 V": kw, "Bobine": coilLabel, ...(aux ? { "Contacts auxiliaires": "1 NO" } : {}) },
  ]);
}

export const eaton = [
  // ── Contacteurs DILM (Moeller) ─────────────────────────────────────────────
  ...family(
    { ...industrial, category: "Contacteurs et relais", status: "active", confidence: 70,
      describe: (name) => `${name}. Contacteur de puissance xStart DILM (ex-Moeller) pour commande de moteurs.` },
    [
      ...dilm("230V50HZ,240V60HZ", "230 V 50 Hz / 240 V 60 Hz", [
        ["7", "7 A", "3 kW", true], ["9", "9 A", "4 kW", true], ["12", "12 A", "5,5 kW", true],
        ["15", "15,5 A", "7,5 kW", true], ["17", "18 A", "7,5 kW", true], ["25", "25 A", "11 kW", true],
        ["32", "32 A", "15 kW", true], ["38", "38 A", "18,5 kW", true], ["40", "40 A", "18,5 kW", false],
        ["50", "50 A", "22 kW", false], ["65", "65 A", "30 kW", false],
      ]),
      ...dilm("24VDC", "24 V DC", [
        ["7", "7 A", "3 kW", true], ["9", "9 A", "4 kW", true], ["12", "12 A", "5,5 kW", true],
        ["17", "18 A", "7,5 kW", true], ["25", "25 A", "11 kW", true],
      ]),
    ],
  ),
  // ── Disjoncteurs-moteurs PKZM0 ─────────────────────────────────────────────
  // PKZM0-1,6 et PKZM0-2,5 sont omis : normalisées, leurs références se
  // confondent avec PKZM0-16 et PKZM0-25.
  ...family(
    { ...industrial, category: "Disjoncteurs et protection moteur", status: "active", confidence: 70,
      describe: (name) => `${name} : disjoncteur-moteur PKZM0 (ex-Moeller), protection des moteurs contre les courts-circuits et surcharges.` },
    ([
      ["PKZM0-0,16", "0,1 à 0,16 A"], ["PKZM0-0,25", "0,16 à 0,25 A"], ["PKZM0-0,4", "0,25 à 0,4 A"],
      ["PKZM0-0,63", "0,4 à 0,63 A"], ["PKZM0-1", "0,63 à 1 A"], ["PKZM0-4", "2,5 à 4 A"],
      ["PKZM0-6,3", "4 à 6,3 A"], ["PKZM0-10", "6,3 à 10 A"], ["PKZM0-12", "8 à 12 A"],
      ["PKZM0-16", "10 à 16 A"], ["PKZM0-20", "16 à 20 A"], ["PKZM0-25", "20 à 25 A"], ["PKZM0-32", "25 à 32 A"],
    ] as const).map(([ref, range]): Row => [ref, `Disjoncteur-moteur PKZM0 ${range}`, { "Plage de réglage thermique": range }]),
  ),

  // ── Relais programmables easy ──────────────────────────────────────────────
  ...family(
    { ...industrial, category: "Automates programmables", status: "active", confidence: 70,
      describe: (name) => `${name}, relais de commande programmable easyE4 programmable avec easySoft.` },
    [
      ["EASY-E4-UC-12RC1", "Relais programmable easyE4 12/24 V DC/24 V AC, 8 DI / 4 DO relais, afficheur", { "E/S": "8 DI / 4 DO relais", "Alimentation": "12/24 V DC, 24 V AC" }],
      ["EASY-E4-DC-12TC1", "Relais programmable easyE4 24 V DC, 8 DI / 4 DO transistor, afficheur", { "E/S": "8 DI / 4 DO transistor", "Alimentation": "24 V DC" }],
      ["EASY-E4-AC-12RC1", "Relais programmable easyE4 100-240 V AC, 8 DI / 4 DO relais, afficheur", { "E/S": "8 DI / 4 DO relais", "Alimentation": "100-240 V AC" }],
      ["EASY-E4-UC-12RCX1", "Relais programmable easyE4 12/24 V DC/24 V AC, 8 DI / 4 DO relais, sans afficheur", { "E/S": "8 DI / 4 DO relais" }],
      ["EASY-E4-DC-16TE1", "Module d'extension easyE4 24 V DC, 8 DI / 8 DO transistor", { "E/S": "8 DI / 8 DO transistor" }, { category: "Modules d'E/S déportées" }],
      ["EASY-E4-UC-16RE1", "Module d'extension easyE4 12/24 V DC/24 V AC, 8 DI / 8 DO relais", { "E/S": "8 DI / 8 DO relais" }, { category: "Modules d'E/S déportées" }],
    ],
  ),
  ...family(
    { ...industrial, category: "Automates programmables", status: "obsolete", confidence: 55,
      describe: (name) => `${name}. Relais programmable easy500/700 en fin de commercialisation : Eaton oriente vers easyE4 (statut à confirmer).` },
    [
      ["EASY512-DC-RC", "Relais programmable easy512 24 V DC, 8 DI / 4 DO relais", { "E/S": "8 DI / 4 DO relais" }, { by: "EASY-E4-UC-12RC1" }],
      ["EASY512-AC-R", "Relais programmable easy512 100-240 V AC, 8 DI / 4 DO relais", { "E/S": "8 DI / 4 DO relais" }, { by: "EASY-E4-AC-12RC1" }],
      ["EASY719-DC-RC", "Relais programmable easy719 24 V DC, 12 DI / 6 DO relais", { "E/S": "12 DI / 6 DO relais" }],
      ["EASY719-AC-RC", "Relais programmable easy719 100-240 V AC, 12 DI / 6 DO relais", { "E/S": "12 DI / 6 DO relais" }],
    ],
  ),

  // ── Onduleurs ──────────────────────────────────────────────────────────────
  ...family(
    { ...it, category: "Onduleurs", status: "active", confidence: 65,
      describe: (name) => `${name}, onduleur Eaton pour serveurs, réseau et postes de travail.` },
    [
      ["5SC500i", "Onduleur 5SC 500 VA line-interactive, tour", { "Puissance": "500 VA / 350 W", "Technologie": "line-interactive" }],
      ["5SC750i", "Onduleur 5SC 750 VA line-interactive, tour", { "Puissance": "750 VA / 525 W", "Technologie": "line-interactive" }],
      ["5SC1000i", "Onduleur 5SC 1000 VA line-interactive, tour", { "Puissance": "1000 VA / 700 W", "Technologie": "line-interactive" }],
      ["5SC1500i", "Onduleur 5SC 1500 VA line-interactive, tour", { "Puissance": "1500 VA / 1050 W", "Technologie": "line-interactive" }],
      ["9SX1000I", "Onduleur 9SX 1000 VA on-line double conversion, tour", { "Puissance": "1000 VA / 900 W", "Technologie": "on-line double conversion" }],
      ["9SX1500I", "Onduleur 9SX 1500 VA on-line double conversion, tour", { "Puissance": "1500 VA / 1350 W", "Technologie": "on-line double conversion" }],
      ["9SX2000I", "Onduleur 9SX 2000 VA on-line double conversion, tour", { "Puissance": "2000 VA / 1800 W", "Technologie": "on-line double conversion" }],
      ["9SX3000I", "Onduleur 9SX 3000 VA on-line double conversion, tour", { "Puissance": "3000 VA / 2700 W", "Technologie": "on-line double conversion" }],
      ["9PX1500IRT2U", "Onduleur 9PX 1500 VA on-line, rack/tour 2U", { "Puissance": "1500 VA / 1500 W", "Technologie": "on-line double conversion" }],
      ["9PX2200IRT2U", "Onduleur 9PX 2200 VA on-line, rack/tour 2U", { "Puissance": "2200 VA / 2200 W", "Technologie": "on-line double conversion" }],
      ["9PX3000IRT2U", "Onduleur 9PX 3000 VA on-line, rack/tour 2U", { "Puissance": "3000 VA / 3000 W", "Technologie": "on-line double conversion" }],
      ["EL650FR", "Onduleur Ellipse ECO 650 VA, prises françaises", { "Puissance": "650 VA / 400 W", "Technologie": "off-line" }],
      ["EL800USBFR", "Onduleur Ellipse ECO 800 VA USB, prises françaises", { "Puissance": "800 VA / 500 W", "Technologie": "off-line" }],
      ["EL1200USBFR", "Onduleur Ellipse ECO 1200 VA USB, prises françaises", { "Puissance": "1200 VA / 750 W", "Technologie": "off-line" }],
      ["EL1600USBFR", "Onduleur Ellipse ECO 1600 VA USB, prises françaises", { "Puissance": "1600 VA / 1000 W", "Technologie": "off-line" }],
    ],
  ),
];
