import { family, replacedBy, type Row } from "../lib";

const base = { manufacturer: "Schneider Electric", industry: "industrie" } as const;

/** Contacteur TeSys D 3 pôles : [référence, calibre AC-3, puissance AC-3 400 V, bobine]. */
function tesysD(rows: [string, string, string, string][]): Row[] {
  return rows.map(([ref, amps, kw, coil]) => [
    ref,
    `Contacteur TeSys D 3P ${amps}, bobine ${coil}`,
    { "Courant AC-3": amps, "Puissance AC-3 400 V": kw, "Bobine": coil, "Contacts auxiliaires": "1 NO + 1 NC" },
  ]);
}

export const schneider = [
  // ── TeSys D : contacteurs ──────────────────────────────────────────────────
  ...family(
    { ...base, category: "Contacteurs et relais", status: "active", confidence: 85,
      describe: (name) => `${name}. Contacteur tripolaire TeSys Deca pour commande de moteurs, montage rail DIN ou platine.` },
    tesysD([
      ["LC1D12M7", "12 A", "5,5 kW", "220 V AC"],
      ["LC1D38M7", "38 A", "18,5 kW", "220 V AC"],
      ["LC1D50AM7", "50 A", "22 kW", "220 V AC"],
      ["LC1D95M7", "95 A", "45 kW", "220 V AC"],
      ["LC1D09P7", "9 A", "4 kW", "230 V AC"],
      ["LC1D12P7", "12 A", "5,5 kW", "230 V AC"],
      ["LC1D18P7", "18 A", "7,5 kW", "230 V AC"],
      ["LC1D25P7", "25 A", "11 kW", "230 V AC"],
      ["LC1D32P7", "32 A", "15 kW", "230 V AC"],
      ["LC1D09BD", "9 A", "4 kW", "24 V DC"],
      ["LC1D12BD", "12 A", "5,5 kW", "24 V DC"],
      ["LC1D18BD", "18 A", "7,5 kW", "24 V DC"],
      ["LC1D25BD", "25 A", "11 kW", "24 V DC"],
      ["LC1D32BD", "32 A", "15 kW", "24 V DC"],
      ["LC1D09B7", "9 A", "4 kW", "24 V AC"],
      ["LC1D18B7", "18 A", "7,5 kW", "24 V AC"],
    ]),
  ),
  ...family(
    { ...base, category: "Contacteurs et relais", status: "obsolete", confidence: 80,
      describe: (name) => `${name}, ancienne version TeSys D remplacée par la version « A » de même calibre.` },
    [
      ["LC1D40M7", "Contacteur TeSys D 3P 40 A, bobine 220 V AC (ancienne version)", { "Courant AC-3": "40 A", "Bobine": "220 V AC" }, replacedBy("LC1D40AM7")],
      ["LC1D50M7", "Contacteur TeSys D 3P 50 A, bobine 220 V AC (ancienne version)", { "Courant AC-3": "50 A", "Bobine": "220 V AC" }, replacedBy("LC1D50AM7")],
      ["LC1D65M7", "Contacteur TeSys D 3P 65 A, bobine 220 V AC (ancienne version)", { "Courant AC-3": "65 A", "Bobine": "220 V AC" }, replacedBy("LC1D65AM7")],
    ],
  ),
  ...family(
    { ...base, category: "Contacteurs et relais", status: "active", confidence: 85,
      describe: (name) => `${name} pour contacteurs TeSys D.` },
    [
      ["LRD06", "Relais thermique TeSys LRD 1-1,6 A", { "Plage de réglage": "1 à 1,6 A", "Classe": "10A" }],
      ["LRD07", "Relais thermique TeSys LRD 1,6-2,5 A", { "Plage de réglage": "1,6 à 2,5 A", "Classe": "10A" }],
      ["LRD10", "Relais thermique TeSys LRD 4-6 A", { "Plage de réglage": "4 à 6 A", "Classe": "10A" }],
      ["LRD12", "Relais thermique TeSys LRD 5,5-8 A", { "Plage de réglage": "5,5 à 8 A", "Classe": "10A" }],
      ["LRD16", "Relais thermique TeSys LRD 9-13 A", { "Plage de réglage": "9 à 13 A", "Classe": "10A" }],
      ["LRD21", "Relais thermique TeSys LRD 12-18 A", { "Plage de réglage": "12 à 18 A", "Classe": "10A" }],
      ["LRD32", "Relais thermique TeSys LRD 23-32 A", { "Plage de réglage": "23 à 32 A", "Classe": "10A" }],
      ["LRD340", "Relais thermique TeSys LRD 30-40 A", { "Plage de réglage": "30 à 40 A", "Classe": "10A" }],
      ["LRD350", "Relais thermique TeSys LRD 37-50 A", { "Plage de réglage": "37 à 50 A", "Classe": "10A" }],
      ["LADN11", "Bloc de contacts auxiliaires frontal 1 NO + 1 NC", null],
      ["LADN22", "Bloc de contacts auxiliaires frontal 2 NO + 2 NC", null],
    ],
  ),

  // ── TeSys GV2 : disjoncteurs-moteurs ───────────────────────────────────────
  ...family(
    { ...base, category: "Disjoncteurs et protection moteur", status: "active", confidence: 85,
      describe: (name) => `${name} : disjoncteur-moteur magnéto-thermique TeSys GV2ME à commande par boutons-poussoirs, protection des moteurs contre les courts-circuits et surcharges.` },
    ([
      ["GV2ME01", "0,1 à 0,16 A"], ["GV2ME02", "0,16 à 0,25 A"], ["GV2ME03", "0,25 à 0,40 A"],
      ["GV2ME04", "0,40 à 0,63 A"], ["GV2ME05", "0,63 à 1 A"], ["GV2ME06", "1 à 1,6 A"],
      ["GV2ME07", "1,6 à 2,5 A"], ["GV2ME10", "4 à 6,3 A"], ["GV2ME16", "9 à 14 A"],
      ["GV2ME20", "13 à 18 A"], ["GV2ME21", "17 à 23 A"], ["GV2ME22", "20 à 25 A"], ["GV2ME32", "24 à 32 A"],
    ] as const).map(([ref, range]): Row => [ref, `Disjoncteur-moteur TeSys GV2ME ${range}`, { "Plage de réglage thermique": range }]),
  ),
  ...family(
    { ...base, category: "Disjoncteurs et protection moteur", status: "active", confidence: 80,
      describe: (name) => `${name} pour disjoncteurs-moteurs TeSys GV2.` },
    [
      ["GVAN11", "Bloc de contacts auxiliaires latéral 1 NO + 1 NC", null],
      ["GVAE11", "Bloc de contacts auxiliaires frontal 1 NO + 1 NC", null],
    ],
  ),

  // ── Acti9 iC60N ────────────────────────────────────────────────────────────
  ...family(
    { ...base, category: "Disjoncteurs et protection moteur", status: "active", confidence: 80,
      describe: (name) => `${name} : disjoncteur modulaire Acti9 iC60N, pouvoir de coupure 6000 A (EN 60898), montage rail DIN.` },
    [
      ["A9F74106", "Disjoncteur iC60N 1P 6 A courbe C", { "Pôles": "1P", "Calibre": "6 A", "Courbe": "C" }],
      ["A9F74110", "Disjoncteur iC60N 1P 10 A courbe C", { "Pôles": "1P", "Calibre": "10 A", "Courbe": "C" }],
      ["A9F74116", "Disjoncteur iC60N 1P 16 A courbe C", { "Pôles": "1P", "Calibre": "16 A", "Courbe": "C" }],
      ["A9F74120", "Disjoncteur iC60N 1P 20 A courbe C", { "Pôles": "1P", "Calibre": "20 A", "Courbe": "C" }],
      ["A9F74132", "Disjoncteur iC60N 1P 32 A courbe C", { "Pôles": "1P", "Calibre": "32 A", "Courbe": "C" }],
      ["A9F74216", "Disjoncteur iC60N 2P 16 A courbe C", { "Pôles": "2P", "Calibre": "16 A", "Courbe": "C" }],
      ["A9F74225", "Disjoncteur iC60N 2P 25 A courbe C", { "Pôles": "2P", "Calibre": "25 A", "Courbe": "C" }],
      ["A9F74316", "Disjoncteur iC60N 3P 16 A courbe C", { "Pôles": "3P", "Calibre": "16 A", "Courbe": "C" }],
      ["A9F74416", "Disjoncteur iC60N 4P 16 A courbe C", { "Pôles": "4P", "Calibre": "16 A", "Courbe": "C" }],
    ],
  ),

  // ── Altivar 320 ────────────────────────────────────────────────────────────
  ...family(
    { ...base, category: "Variateurs de vitesse", status: "active", confidence: 85,
      describe: (name) => `${name}, variateur de vitesse Altivar Machine ATV320 pour machines simples et complexes, Modbus et CANopen intégrés.` },
    [
      ["ATV320U07N4B", "Variateur ATV320 0,75 kW 380-500 V (format livre)", { "Puissance": "0,75 kW", "Alimentation": "3 ph 380-500 V", "Format": "livre" }],
      ["ATV320U22N4B", "Variateur ATV320 2,2 kW 380-500 V (format livre)", { "Puissance": "2,2 kW", "Alimentation": "3 ph 380-500 V", "Format": "livre" }],
      ["ATV320U30N4B", "Variateur ATV320 3 kW 380-500 V (format livre)", { "Puissance": "3 kW", "Alimentation": "3 ph 380-500 V", "Format": "livre" }],
      ["ATV320U55N4B", "Variateur ATV320 5,5 kW 380-500 V (format livre)", { "Puissance": "5,5 kW", "Alimentation": "3 ph 380-500 V", "Format": "livre" }],
      ["ATV320D15N4B", "Variateur ATV320 15 kW 380-500 V (format livre)", { "Puissance": "15 kW", "Alimentation": "3 ph 380-500 V", "Format": "livre" }],
      ["ATV320U07N4C", "Variateur ATV320 0,75 kW 380-500 V (format compact)", { "Puissance": "0,75 kW", "Alimentation": "3 ph 380-500 V", "Format": "compact" }],
      ["ATV320U15N4C", "Variateur ATV320 1,5 kW 380-500 V (format compact)", { "Puissance": "1,5 kW", "Alimentation": "3 ph 380-500 V", "Format": "compact" }],
      ["ATV320U22N4C", "Variateur ATV320 2,2 kW 380-500 V (format compact)", { "Puissance": "2,2 kW", "Alimentation": "3 ph 380-500 V", "Format": "compact" }],
      ["ATV320U40N4C", "Variateur ATV320 4 kW 380-500 V (format compact)", { "Puissance": "4 kW", "Alimentation": "3 ph 380-500 V", "Format": "compact" }],
      ["ATV320U04M2C", "Variateur ATV320 0,37 kW 200-240 V monophasé (compact)", { "Puissance": "0,37 kW", "Alimentation": "1 ph 200-240 V", "Format": "compact" }],
      ["ATV320U07M2C", "Variateur ATV320 0,75 kW 200-240 V monophasé (compact)", { "Puissance": "0,75 kW", "Alimentation": "1 ph 200-240 V", "Format": "compact" }],
      ["ATV320U15M2C", "Variateur ATV320 1,5 kW 200-240 V monophasé (compact)", { "Puissance": "1,5 kW", "Alimentation": "1 ph 200-240 V", "Format": "compact" }],
      ["ATV320U22M2C", "Variateur ATV320 2,2 kW 200-240 V monophasé (compact)", { "Puissance": "2,2 kW", "Alimentation": "1 ph 200-240 V", "Format": "compact" }],
    ],
  ),

  // ── Altivar 312 (arrêté → ATV320) et Altivar 31 (arrêté → ATV312) ─────────
  ...family(
    { ...base, category: "Variateurs de vitesse", status: "obsolete", confidence: 80,
      describe: (name) => `${name}. Gamme Altivar 312 arrêtée : remplacement officiel par l'Altivar Machine ATV320 de même puissance.` },
    [
      ["ATV312H075N4", "Variateur ATV312 0,75 kW 380-500 V", { "Puissance": "0,75 kW", "Alimentation": "3 ph 380-500 V" }, { by: "ATV320U07N4B" }],
      ["ATV312HU22N4", "Variateur ATV312 2,2 kW 380-500 V", { "Puissance": "2,2 kW", "Alimentation": "3 ph 380-500 V" }, { by: "ATV320U22N4B" }],
      ["ATV312HU30N4", "Variateur ATV312 3 kW 380-500 V", { "Puissance": "3 kW", "Alimentation": "3 ph 380-500 V" }, { by: "ATV320U30N4B" }],
      ["ATV312HU55N4", "Variateur ATV312 5,5 kW 380-500 V", { "Puissance": "5,5 kW", "Alimentation": "3 ph 380-500 V" }, { by: "ATV320U55N4B" }],
      ["ATV312HU75N4", "Variateur ATV312 7,5 kW 380-500 V", { "Puissance": "7,5 kW", "Alimentation": "3 ph 380-500 V" }, { by: "ATV320U75N4B" }],
      ["ATV312H075M2", "Variateur ATV312 0,75 kW 200-240 V monophasé", { "Puissance": "0,75 kW", "Alimentation": "1 ph 200-240 V" }, { by: "ATV320U07M2C" }],
      ["ATV312HU15M2", "Variateur ATV312 1,5 kW 200-240 V monophasé", { "Puissance": "1,5 kW", "Alimentation": "1 ph 200-240 V" }, { by: "ATV320U15M2C" }],
      ["ATV312HU22M2", "Variateur ATV312 2,2 kW 200-240 V monophasé", { "Puissance": "2,2 kW", "Alimentation": "1 ph 200-240 V" }, { by: "ATV320U22M2C" }],
    ],
  ),
  ...family(
    { ...base, category: "Variateurs de vitesse", status: "obsolete", confidence: 80,
      describe: (name) => `${name}. Gamme Altivar 31 arrêtée de longue date, remplacée par l'Altivar 312, elle-même remplacée par l'ATV320.` },
    [
      ["ATV31H075N4", "Variateur ATV31 0,75 kW 380-500 V", { "Puissance": "0,75 kW" }, { by: "ATV312H075N4" }],
      ["ATV31HU15N4", "Variateur ATV31 1,5 kW 380-500 V", { "Puissance": "1,5 kW" }, { by: "ATV312HU15N4" }],
      ["ATV31HU22N4", "Variateur ATV31 2,2 kW 380-500 V", { "Puissance": "2,2 kW" }, { by: "ATV312HU22N4" }],
      ["ATV31HU40N4", "Variateur ATV31 4 kW 380-500 V", { "Puissance": "4 kW" }, { by: "ATV312HU40N4" }],
      ["ATV31HU75N4", "Variateur ATV31 7,5 kW 380-500 V", { "Puissance": "7,5 kW" }, { by: "ATV312HU75N4" }],
    ],
  ),

  // ── Altivar Process 900 et 600 ─────────────────────────────────────────────
  ...family(
    { ...base, category: "Variateurs de vitesse", status: "active", confidence: 80,
      describe: (name) => `${name}, variateur Altivar Process pour applications industrielles exigeantes, Ethernet intégré.` },
    [
      ["ATV930U07N4", "Variateur ATV930 0,75 kW 380-480 V", { "Puissance": "0,75 kW", "Alimentation": "3 ph 380-480 V" }],
      ["ATV930U15N4", "Variateur ATV930 1,5 kW 380-480 V", { "Puissance": "1,5 kW", "Alimentation": "3 ph 380-480 V" }],
      ["ATV930U22N4", "Variateur ATV930 2,2 kW 380-480 V", { "Puissance": "2,2 kW", "Alimentation": "3 ph 380-480 V" }],
      ["ATV930U30N4", "Variateur ATV930 3 kW 380-480 V", { "Puissance": "3 kW", "Alimentation": "3 ph 380-480 V" }],
      ["ATV930U40N4", "Variateur ATV930 4 kW 380-480 V", { "Puissance": "4 kW", "Alimentation": "3 ph 380-480 V" }],
      ["ATV930U55N4", "Variateur ATV930 5,5 kW 380-480 V", { "Puissance": "5,5 kW", "Alimentation": "3 ph 380-480 V" }],
      ["ATV930U75N4", "Variateur ATV930 7,5 kW 380-480 V", { "Puissance": "7,5 kW", "Alimentation": "3 ph 380-480 V" }],
      ["ATV930D11N4", "Variateur ATV930 11 kW 380-480 V", { "Puissance": "11 kW", "Alimentation": "3 ph 380-480 V" }],
      ["ATV630U15N4", "Variateur ATV630 1,5 kW 380-480 V (pompes et ventilateurs)", { "Puissance": "1,5 kW", "Alimentation": "3 ph 380-480 V" }],
      ["ATV630U22N4", "Variateur ATV630 2,2 kW 380-480 V (pompes et ventilateurs)", { "Puissance": "2,2 kW", "Alimentation": "3 ph 380-480 V" }],
      ["ATV630U40N4", "Variateur ATV630 4 kW 380-480 V (pompes et ventilateurs)", { "Puissance": "4 kW", "Alimentation": "3 ph 380-480 V" }],
      ["ATV630U75N4", "Variateur ATV630 7,5 kW 380-480 V (pompes et ventilateurs)", { "Puissance": "7,5 kW", "Alimentation": "3 ph 380-480 V" }],
    ],
  ),
  ...family(
    { ...base, category: "Variateurs de vitesse", status: "obsolete", confidence: 70,
      describe: (name) => `${name}. Gamme arrêtée : Schneider Electric oriente vers l'Altivar Process de même puissance.` },
    [
      ["ATV71HU15N4", "Variateur ATV71 1,5 kW 380-480 V", { "Puissance": "1,5 kW" }, { by: "ATV930U15N4" }],
      ["ATV71HU22N4", "Variateur ATV71 2,2 kW 380-480 V", { "Puissance": "2,2 kW" }, { by: "ATV930U22N4" }],
      ["ATV71HU40N4", "Variateur ATV71 4 kW 380-480 V", { "Puissance": "4 kW" }, { by: "ATV930U40N4" }],
      ["ATV71HU75N4", "Variateur ATV71 7,5 kW 380-480 V", { "Puissance": "7,5 kW" }, { by: "ATV930U75N4" }],
      ["ATV71HD11N4", "Variateur ATV71 11 kW 380-480 V", { "Puissance": "11 kW" }, { by: "ATV930D11N4" }],
      ["ATV61HU15N4", "Variateur ATV61 1,5 kW 380-480 V", { "Puissance": "1,5 kW" }, { by: "ATV630U15N4" }],
      ["ATV61HU22N4", "Variateur ATV61 2,2 kW 380-480 V", { "Puissance": "2,2 kW" }, { by: "ATV630U22N4" }],
      ["ATV61HU40N4", "Variateur ATV61 4 kW 380-480 V", { "Puissance": "4 kW" }, { by: "ATV630U40N4" }],
      ["ATV61HU75N4", "Variateur ATV61 7,5 kW 380-480 V", { "Puissance": "7,5 kW" }, { by: "ATV630U75N4" }],
    ],
  ),
  ...family(
    { ...base, category: "Variateurs de vitesse", status: "active", confidence: 75,
      describe: (name) => `${name}.` },
    [
      ["ATV12H018M2", "Variateur ATV12 0,18 kW 200-240 V monophasé", { "Puissance": "0,18 kW", "Alimentation": "1 ph 200-240 V" },
        { status: "unknown", desc: "Variateur de vitesse compact Altivar 12 pour machines simples, alimentation monophasée 200-240 V." }],
      ["ATV12H037M2", "Variateur ATV12 0,37 kW 200-240 V monophasé", { "Puissance": "0,37 kW", "Alimentation": "1 ph 200-240 V" },
        { status: "unknown", desc: "Variateur de vitesse compact Altivar 12 pour machines simples, alimentation monophasée 200-240 V." }],
      ["ATV12H075M2", "Variateur ATV12 0,75 kW 200-240 V monophasé", { "Puissance": "0,75 kW", "Alimentation": "1 ph 200-240 V" },
        { status: "unknown", desc: "Variateur de vitesse compact Altivar 12 pour machines simples, alimentation monophasée 200-240 V." }],
      ["ATV12HU15M2", "Variateur ATV12 1,5 kW 200-240 V monophasé", { "Puissance": "1,5 kW", "Alimentation": "1 ph 200-240 V" },
        { status: "unknown", desc: "Variateur de vitesse compact Altivar 12 pour machines simples, alimentation monophasée 200-240 V." }],
      ["ATV340U15N4", "Variateur ATV340 1,5 kW 380-480 V", { "Puissance": "1,5 kW", "Alimentation": "3 ph 380-480 V" },
        { desc: "Variateur Altivar Machine ATV340 pour machines hautes performances, Ethernet intégré." }],
      ["ATV340U40N4", "Variateur ATV340 4 kW 380-480 V", { "Puissance": "4 kW", "Alimentation": "3 ph 380-480 V" },
        { desc: "Variateur Altivar Machine ATV340 pour machines hautes performances, Ethernet intégré." }],
      ["ATV340U75N4", "Variateur ATV340 7,5 kW 380-480 V", { "Puissance": "7,5 kW", "Alimentation": "3 ph 380-480 V" },
        { desc: "Variateur Altivar Machine ATV340 pour machines hautes performances, Ethernet intégré." }],
    ],
  ),

  // ── Modicon M221 / M241 / M251 / M262 ──────────────────────────────────────
  ...family(
    { ...base, category: "Automates programmables", status: "active", confidence: 85,
      describe: (name) => `${name}, automate Modicon programmable avec EcoStruxure Machine Expert.` },
    [
      ["TM221CE16R", "Automate Modicon M221 16 E/S relais, Ethernet", { "E/S": "9 DI / 7 DO relais", "Alimentation": "100-240 V AC", "Communication": "Ethernet + série" }],
      ["TM221CE16T", "Automate Modicon M221 16 E/S transistor, Ethernet", { "E/S": "9 DI / 7 DO transistor", "Alimentation": "24 V DC", "Communication": "Ethernet + série" }],
      ["TM221CE40R", "Automate Modicon M221 40 E/S relais, Ethernet", { "E/S": "24 DI / 16 DO relais", "Alimentation": "100-240 V AC", "Communication": "Ethernet + série" }],
      ["TM221CE40T", "Automate Modicon M221 40 E/S transistor, Ethernet", { "E/S": "24 DI / 16 DO transistor", "Alimentation": "24 V DC", "Communication": "Ethernet + série" }],
      ["TM221C16R", "Automate Modicon M221 16 E/S relais", { "E/S": "9 DI / 7 DO relais", "Alimentation": "100-240 V AC" }],
      ["TM221C24R", "Automate Modicon M221 24 E/S relais", { "E/S": "14 DI / 10 DO relais", "Alimentation": "100-240 V AC" }],
      ["TM221C24T", "Automate Modicon M221 24 E/S transistor", { "E/S": "14 DI / 10 DO transistor", "Alimentation": "24 V DC" }],
      ["TM221ME16R", "Automate Modicon M221 Book 16 E/S relais, Ethernet", { "E/S": "8 DI / 8 DO relais", "Format": "livre" }],
      ["TM241CE24R", "Automate Modicon M241 24 E/S relais, Ethernet", { "E/S": "14 DI / 10 DO", "Communication": "Ethernet + série" }],
      ["TM241CEC24R", "Automate Modicon M241 24 E/S relais, Ethernet + CANopen", { "E/S": "14 DI / 10 DO", "Communication": "Ethernet + CANopen + série" }],
      ["TM241CEC24T", "Automate Modicon M241 24 E/S transistor, Ethernet + CANopen", { "E/S": "14 DI / 10 DO", "Communication": "Ethernet + CANopen + série" }],
      ["TM241CE40R", "Automate Modicon M241 40 E/S relais, Ethernet", { "E/S": "24 DI / 16 DO" }],
      ["TM241CE40T", "Automate Modicon M241 40 E/S transistor, Ethernet", { "E/S": "24 DI / 16 DO" }],
      ["TM251MESE", "Automate Modicon M251 double Ethernet", { "Communication": "2 x Ethernet" }],
      ["TM251MESC", "Automate Modicon M251 Ethernet + CANopen", { "Communication": "Ethernet + CANopen" }],
      ["TM262L10MESE8T", "Automate Modicon M262 Logic, 3 Ethernet", { "Communication": "Ethernet / Sercos" }],
      ["TM262L20MESE8T", "Automate Modicon M262 Logic, 3 Ethernet (performances accrues)", { "Communication": "Ethernet / Sercos" }],
    ],
  ),
  ...family(
    { ...base, category: "Modules d'E/S déportées", status: "active", confidence: 80,
      describe: (name) => `${name}, module d'extension TM3 pour automates Modicon M221, M241, M251 et M262.` },
    [
      ["TM3DI16", "Module TM3 16 entrées TOR 24 V DC", { "Voies": "16 DI" }],
      ["TM3DQ16R", "Module TM3 16 sorties relais", { "Voies": "16 DO relais" }],
      ["TM3DQ16T", "Module TM3 16 sorties transistor", { "Voies": "16 DO transistor" }],
      ["TM3DM24R", "Module TM3 16 entrées / 8 sorties relais", { "Voies": "16 DI / 8 DO relais" }],
      ["TM3AI4", "Module TM3 4 entrées analogiques", { "Voies": "4 AI" }],
      ["TM3AQ2", "Module TM3 2 sorties analogiques", { "Voies": "2 AO" }],
      ["TM3TI4", "Module TM3 4 entrées température", { "Voies": "4 AI RTD/thermocouple" }],
    ],
  ),

  // ── Twido (arrêté → M221) ──────────────────────────────────────────────────
  ...family(
    { ...base, category: "Automates programmables", status: "obsolete", confidence: 70,
      describe: (name) => `${name}. Gamme Twido arrêtée : Schneider Electric propose le Modicon M221 comme substitution.` },
    [
      ["TWDLCAA16DRF", "Automate Twido compact 16 E/S relais", { "E/S": "9 DI / 7 DO relais" }, { by: "TM221C16R" }],
      ["TWDLCAA24DRF", "Automate Twido compact 24 E/S relais", { "E/S": "14 DI / 10 DO relais" }, { by: "TM221C24R" }],
      ["TWDLCAA40DRF", "Automate Twido compact 40 E/S relais", { "E/S": "24 DI / 16 DO" }, { by: "TM221C40R" }],
      ["TWDLCAE40DRF", "Automate Twido compact 40 E/S relais, Ethernet", { "E/S": "24 DI / 16 DO" }, { by: "TM221CE40R" }],
      ["TWDLMDA20DRT", "Automate Twido modulaire 20 E/S", { "E/S": "12 DI / 8 DO" }],
      ["TWDDDI16DT", "Module Twido 16 entrées TOR", { "Voies": "16 DI" }, { by: "TM3DI16", category: "Modules d'E/S déportées" }],
      ["TWDDRA16RT", "Module Twido 16 sorties relais", { "Voies": "16 DO relais" }, { by: "TM3DQ16R", category: "Modules d'E/S déportées" }],
    ],
  ),

  // ── Modicon M340 / M580 ────────────────────────────────────────────────────
  ...family(
    { ...base, category: "Automates programmables", status: "active", confidence: 85,
      describe: (name) => `${name}, plate-forme d'automatisme Modicon programmable avec EcoStruxure Control Expert.` },
    [
      ["BMXP341000", "Processeur Modicon M340 BMX P34 1000", { "Communication": "Modbus série" }],
      ["BMXP342010", "Processeur Modicon M340 BMX P34 2010", { "Communication": "Modbus série + CANopen" }],
      ["BMXP342020", "Processeur Modicon M340 BMX P34 2020", { "Communication": "Modbus série + Ethernet" }],
      ["BMEP581020", "Processeur Modicon M580 BME P58 1020", { "Communication": "Ethernet RIO/DIO" }],
      ["BMEP582020", "Processeur Modicon M580 BME P58 2020", { "Communication": "Ethernet RIO/DIO" }],
      ["BMEP582040", "Processeur Modicon M580 BME P58 2040", { "Communication": "Ethernet RIO/DIO" }],
      ["BMEP583020", "Processeur Modicon M580 BME P58 3020", { "Communication": "Ethernet RIO/DIO" }],
      ["BMEP584020", "Processeur Modicon M580 BME P58 4020", { "Communication": "Ethernet RIO/DIO" }],
      ["BMEP584040", "Processeur Modicon M580 BME P58 4040", { "Communication": "Ethernet RIO/DIO" }],
    ],
  ),
  ...family(
    { ...base, category: "Modules d'E/S déportées", status: "active", confidence: 85,
      describe: (name) => `${name} pour automates Modicon M340 et M580.` },
    [
      ["BMXDDI1602", "Module 16 entrées TOR 24 V DC", { "Voies": "16 DI" }],
      ["BMXDDO1602", "Module 16 sorties TOR transistor 24 V DC", { "Voies": "16 DO transistor" }],
      ["BMXDDI3202K", "Module 32 entrées TOR 24 V DC (connecteur 40 points)", { "Voies": "32 DI" }],
      ["BMXDDO3202K", "Module 32 sorties TOR transistor (connecteur 40 points)", { "Voies": "32 DO transistor" }],
      ["BMXDRA1605", "Module 16 sorties relais", { "Voies": "16 DO relais" }],
      ["BMXAMI0410", "Module 4 entrées analogiques isolées", { "Voies": "4 AI" }],
      ["BMXAMI0810", "Module 8 entrées analogiques", { "Voies": "8 AI" }],
      ["BMXAMO0210", "Module 2 sorties analogiques isolées", { "Voies": "2 AO" }],
      ["BMXCPS2000", "Alimentation BMX CPS 2000 100-240 V AC", { "Entrée": "100-240 V AC" }, { category: "Alimentations industrielles" }],
      ["BMXCPS3500", "Alimentation BMX CPS 3500 100-240 V AC", { "Entrée": "100-240 V AC" }, { category: "Alimentations industrielles" }],
      ["BMXXBP0400", "Embase 4 emplacements", { "Emplacements": "4" }],
      ["BMXXBP0800", "Embase 8 emplacements", { "Emplacements": "8" }],
      ["BMXXBP1200", "Embase 12 emplacements", { "Emplacements": "12" }],
      ["BMEXBP0400", "Embase Ethernet 4 emplacements M580", { "Emplacements": "4" }],
      ["BMEXBP0800", "Embase Ethernet 8 emplacements M580", { "Emplacements": "8" }],
      ["BMEXBP1200", "Embase Ethernet 12 emplacements M580", { "Emplacements": "12" }],
      ["BMXNOE0100", "Module de communication Ethernet BMX NOE 0100", { "Interface": "Ethernet Modbus TCP" }],
      ["BMXNOE0110", "Module de communication Ethernet BMX NOE 0110 (serveur web)", { "Interface": "Ethernet Modbus TCP" }],
      ["BMXNOC0401", "Module de communication Ethernet 4 ports BMX NOC 0401", { "Interface": "EtherNet/IP + Modbus TCP" }],
      ["BMXRMS008MP", "Carte mémoire 8 Mo pour processeur M340", { "Capacité": "8 Mo" }],
    ],
  ),

  // ── Modicon Premium et TSX Micro (arrêtés) ─────────────────────────────────
  ...family(
    { ...base, category: "Modules d'E/S déportées", status: "obsolete", confidence: 75,
      describe: (name) => `${name}. Gamme Modicon Premium arrêtée : migration vers Modicon M580 proposée par Schneider Electric.` },
    [
      ["TSXP573634M", "Processeur Premium TSX P57 3634M", null, { category: "Automates programmables" }],
      ["TSXP574634M", "Processeur Premium TSX P57 4634M", null, { category: "Automates programmables" }],
      ["TSXDEY16D2", "Module Premium 16 entrées TOR 24 V DC", { "Voies": "16 DI" }],
      ["TSXDEY32D2K", "Module Premium 32 entrées TOR 24 V DC", { "Voies": "32 DI" }],
      ["TSXDSY16T2", "Module Premium 16 sorties transistor", { "Voies": "16 DO" }],
      ["TSXDSY32T2K", "Module Premium 32 sorties transistor", { "Voies": "32 DO" }],
      ["TSXAEY800", "Module Premium 8 entrées analogiques", { "Voies": "8 AI" }],
      ["TSXASY410", "Module Premium 4 sorties analogiques", { "Voies": "4 AO" }],
      ["TSXPSY2600M", "Alimentation Premium TSX PSY 2600M", null, { category: "Alimentations industrielles" }],
      ["TSXPSY5500M", "Alimentation Premium TSX PSY 5500M", null, { category: "Alimentations industrielles" }],
      ["TSXRKY8EX", "Rack extensible Premium 8 emplacements", { "Emplacements": "8" }],
      ["TSXRKY12EX", "Rack extensible Premium 12 emplacements", { "Emplacements": "12" }],
      ["TSXETY4103", "Module de communication Ethernet Premium TSX ETY 4103", { "Interface": "Ethernet Modbus TCP" }],
      ["TSXETY5103", "Module de communication Ethernet Premium TSX ETY 5103", { "Interface": "Ethernet Modbus TCP" }],
    ],
  ),
  ...family(
    { ...base, category: "Automates programmables", status: "obsolete", confidence: 75,
      describe: (name) => `${name}. Gamme TSX Micro arrêtée.` },
    [
      ["TSX3721101", "Automate TSX Micro 37-21", null],
      ["TSXDMZ64DTK", "Module TSX Micro 32 entrées / 32 sorties", { "Voies": "32 DI / 32 DO" }, { category: "Modules d'E/S déportées" }],
      ["TSXDEZ32D2", "Module TSX Micro 32 entrées TOR", { "Voies": "32 DI" }, { category: "Modules d'E/S déportées" }],
      ["TSXDSZ32T2", "Module TSX Micro 32 sorties transistor", { "Voies": "32 DO" }, { category: "Modules d'E/S déportées" }],
    ],
  ),

  // ── Zelio ──────────────────────────────────────────────────────────────────
  ...family(
    { ...base, category: "Automates programmables", status: "active", confidence: 80,
      describe: (name) => `${name}, relais intelligent Zelio Logic pour petites automatisations.` },
    [
      ["SR2B121FU", "Relais intelligent Zelio Logic 12 E/S 100-240 V AC", { "E/S": "8 DI / 4 DO relais", "Alimentation": "100-240 V AC" }],
      ["SR2B201FU", "Relais intelligent Zelio Logic 20 E/S 100-240 V AC", { "E/S": "12 DI / 8 DO relais", "Alimentation": "100-240 V AC" }],
      ["SR3B261BD", "Relais intelligent Zelio Logic modulaire 26 E/S 24 V DC", { "E/S": "16 DI / 10 DO relais", "Alimentation": "24 V DC" }],
    ],
  ),
  ...family(
    { ...base, category: "Contacteurs et relais", status: "active", confidence: 80,
      describe: (name) => `${name}, gamme Zelio Relay.` },
    [
      ["RXM2AB2BD", "Relais miniature 2 OF 12 A, bobine 24 V DC", { "Contacts": "2 OF", "Bobine": "24 V DC" }],
      ["RXM4AB2BD", "Relais miniature 4 OF 6 A, bobine 24 V DC", { "Contacts": "4 OF", "Bobine": "24 V DC" }],
      ["RXM4AB2P7", "Relais miniature 4 OF 6 A, bobine 230 V AC", { "Contacts": "4 OF", "Bobine": "230 V AC" }],
      ["RXZE2M114", "Embase à contacts mixtes pour relais RXM", null],
      ["RSB1A160BD", "Relais d'interface 1 OF 16 A, bobine 24 V DC", { "Contacts": "1 OF", "Bobine": "24 V DC" }],
    ],
  ),

  // ── Harmony : boutons et voyants ───────────────────────────────────────────
  ...family(
    { ...base, category: "Boutons et signalisation", status: "active", confidence: 80,
      describe: (name) => `${name}, auxiliaire de commande et de signalisation Harmony Ø22 mm.` },
    [
      ["XB4BA31", "Bouton-poussoir affleurant vert 1 NO (XB4 métal)", { "Couleur": "vert", "Contact": "1 NO" }],
      ["XB4BA42", "Bouton-poussoir affleurant rouge 1 NC (XB4 métal)", { "Couleur": "rouge", "Contact": "1 NC" }],
      ["XB4BS8445", "Arrêt d'urgence Ø40 tourner pour déverrouiller 1 NC (XB4 métal)", { "Contact": "1 NC" }],
      ["XB4BD21", "Commutateur à manette 2 positions fixes 1 NO (XB4 métal)", { "Positions": "2" }],
      ["XB4BD33", "Commutateur à manette 3 positions fixes 2 NO (XB4 métal)", { "Positions": "3" }],
      ["XB4BVM3", "Voyant lumineux vert LED 230-240 V AC (XB4 métal)", { "Couleur": "vert", "Tension": "230-240 V AC" }],
      ["XB4BVM4", "Voyant lumineux rouge LED 230-240 V AC (XB4 métal)", { "Couleur": "rouge", "Tension": "230-240 V AC" }],
      ["XB4BVB3", "Voyant lumineux vert LED 24 V AC/DC (XB4 métal)", { "Couleur": "vert", "Tension": "24 V AC/DC" }],
      ["XB4BVB4", "Voyant lumineux rouge LED 24 V AC/DC (XB4 métal)", { "Couleur": "rouge", "Tension": "24 V AC/DC" }],
      ["XB5AA31", "Bouton-poussoir affleurant vert 1 NO (XB5 plastique)", { "Couleur": "vert", "Contact": "1 NO" }],
      ["XB5AA42", "Bouton-poussoir affleurant rouge 1 NC (XB5 plastique)", { "Couleur": "rouge", "Contact": "1 NC" }],
      ["XB5AD21", "Commutateur à manette 2 positions fixes 1 NO (XB5 plastique)", { "Positions": "2" }],
      ["XB5AVB3", "Voyant lumineux vert LED 24 V AC/DC (XB5 plastique)", { "Couleur": "vert", "Tension": "24 V AC/DC" }],
      ["ZB4BZ009", "Embase de fixation pour XB4", null],
      ["ZBE101", "Bloc contact simple 1 NO", null],
      ["ZBE102", "Bloc contact simple 1 NC", null],
    ],
  ),

  // ── Phaseo ─────────────────────────────────────────────────────────────────
  ...family(
    { ...base, category: "Alimentations industrielles", status: "active", confidence: 75,
      describe: (name) => `${name}, alimentation à découpage Phaseo pour rail DIN.` },
    [
      ["ABL8RPS24050", "Alimentation Phaseo Universal 24 V / 5 A", { "Sortie": "24 V DC / 5 A" }],
      ["ABL8RPS24100", "Alimentation Phaseo Universal 24 V / 10 A", { "Sortie": "24 V DC / 10 A" }],
      ["ABL8RPS24200", "Alimentation Phaseo Universal 24 V / 20 A", { "Sortie": "24 V DC / 20 A" }],
      ["ABL8REM24030", "Alimentation Phaseo Optimum 24 V / 3 A", { "Sortie": "24 V DC / 3 A" }],
      ["ABL8MEM24012", "Alimentation Phaseo modulaire 24 V / 1,2 A", { "Sortie": "24 V DC / 1,2 A" }],
    ],
  ),

  // ── Magelis ────────────────────────────────────────────────────────────────
  ...family(
    { ...base, category: "IHM et pupitres", status: "active", confidence: 75,
      describe: (name) => `${name}, terminal opérateur Harmony (ex-Magelis) configurable avec Vijeo Designer.` },
    [
      ["HMIGXU3512", "Terminal tactile Harmony GXU 7\"", { "Écran": "7\" tactile" }],
      ["HMIGXU5512", "Terminal tactile Harmony GXU 10\"", { "Écran": "10\" tactile" }],
      ["HMIST6400", "Terminal tactile Harmony ST6 7\"", { "Écran": "7\" tactile" }],
      ["HMIGTO4310", "Terminal tactile Harmony GTO 7\"", { "Écran": "7\" tactile" }],
      ["HMIGTO6310", "Terminal tactile Harmony GTO 12\"", { "Écran": "12,1\" tactile" }],
      ["XBTGT5330", "Terminal tactile Magelis XBTGT 10,4\"", { "Écran": "10,4\" tactile" },
        replacedBy("HMIGTO5310", { confidence: 70, desc: "Terminal tactile Magelis XBTGT 10,4\", gamme arrêtée : substitution par Harmony GTO 10,4\"." })],
    ],
  ),
];
