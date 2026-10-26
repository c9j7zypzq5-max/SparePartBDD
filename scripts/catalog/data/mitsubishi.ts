import { family, type Row } from "../lib";

const base = { manufacturer: "Mitsubishi Electric", industry: "industrie" } as const;

/** Servo-amplificateur : [référence, puissance, remplacement éventuel]. */
function servoAmps(series: string, command: string, rows: [string, string, string?][]): Row[] {
  return rows.map(([ref, watts, by]) => [
    ref,
    `Servo-amplificateur ${series} ${watts}, ${command}`,
    { "Puissance": watts, "Commande": command },
    by ? { by } : undefined,
  ]);
}

export const mitsubishi = [
  // ── MELSEC iQ-F (FX5) ──────────────────────────────────────────────────────
  ...family(
    { ...base, category: "Automates programmables", status: "active", confidence: 75,
      describe: (name) => `${name}, automate compact MELSEC iQ-F programmable avec GX Works3, Ethernet intégré.` },
    [
      ["FX5U-32MR/ES", "Automate FX5U 32 E/S relais, alimentation 100-240 V AC", { "E/S": "16 DI / 16 DO relais", "Alimentation": "100-240 V AC" }],
      ["FX5U-32MT/ES", "Automate FX5U 32 E/S transistor (sink), alimentation 100-240 V AC", { "E/S": "16 DI / 16 DO transistor", "Alimentation": "100-240 V AC" }],
      ["FX5U-32MT/ESS", "Automate FX5U 32 E/S transistor (source), alimentation 100-240 V AC", { "E/S": "16 DI / 16 DO transistor", "Alimentation": "100-240 V AC" }],
      ["FX5U-64MR/ES", "Automate FX5U 64 E/S relais, alimentation 100-240 V AC", { "E/S": "32 DI / 32 DO relais", "Alimentation": "100-240 V AC" }],
      ["FX5U-64MT/ES", "Automate FX5U 64 E/S transistor (sink), alimentation 100-240 V AC", { "E/S": "32 DI / 32 DO transistor", "Alimentation": "100-240 V AC" }],
      ["FX5U-80MR/ES", "Automate FX5U 80 E/S relais, alimentation 100-240 V AC", { "E/S": "40 DI / 40 DO relais", "Alimentation": "100-240 V AC" }],
      ["FX5UC-32MT/D", "Automate FX5UC 32 E/S transistor, alimentation 24 V DC", { "E/S": "16 DI / 16 DO transistor", "Alimentation": "24 V DC" }],
      ["FX5UJ-24MR/ES", "Automate FX5UJ 24 E/S relais, alimentation 100-240 V AC", { "E/S": "14 DI / 10 DO relais" }],
      ["FX5UJ-40MR/ES", "Automate FX5UJ 40 E/S relais, alimentation 100-240 V AC", { "E/S": "24 DI / 16 DO relais" }],
      ["FX5UJ-60MR/ES", "Automate FX5UJ 60 E/S relais, alimentation 100-240 V AC", { "E/S": "36 DI / 24 DO relais" }],
      ["FX5-16EX/ES", "Module d'extension FX5 16 entrées TOR", { "Voies": "16 DI" }, { category: "Modules d'E/S déportées" }],
      ["FX5-16EYR/ES", "Module d'extension FX5 16 sorties relais", { "Voies": "16 DO relais" }, { category: "Modules d'E/S déportées" }],
      ["FX5-16EYT/ES", "Module d'extension FX5 16 sorties transistor", { "Voies": "16 DO transistor" }, { category: "Modules d'E/S déportées" }],
      ["FX5-4AD-ADP", "Adaptateur FX5 4 entrées analogiques", { "Voies": "4 AI" }, { category: "Modules d'E/S déportées" }],
      ["FX5-4DA-ADP", "Adaptateur FX5 4 sorties analogiques", { "Voies": "4 AO" }, { category: "Modules d'E/S déportées" }],
      ["FX5-485ADP", "Adaptateur de communication FX5 RS-485", { "Interface": "RS-485" }, { category: "Modules d'E/S déportées" }],
    ],
  ),
  // ── MELSEC-F (FX3U, FX2N, FX1N) ────────────────────────────────────────────
  ...family(
    { ...base, category: "Automates programmables", status: "obsolete", confidence: 55,
      describe: (name) => `${name}. Gamme FX3U en fin de production : Mitsubishi Electric oriente vers l'iQ-F FX5U équivalent (statut à confirmer).` },
    [
      ["FX3U-16MR/ES-A", "Automate FX3U 16 E/S relais, alimentation 100-240 V AC", { "E/S": "8 DI / 8 DO relais" }],
      ["FX3U-32MR/ES-A", "Automate FX3U 32 E/S relais, alimentation 100-240 V AC", { "E/S": "16 DI / 16 DO relais" }, { by: "FX5U-32MR/ES" }],
      ["FX3U-48MR/ES-A", "Automate FX3U 48 E/S relais, alimentation 100-240 V AC", { "E/S": "24 DI / 24 DO relais" }],
      ["FX3U-64MR/ES-A", "Automate FX3U 64 E/S relais, alimentation 100-240 V AC", { "E/S": "32 DI / 32 DO relais" }, { by: "FX5U-64MR/ES" }],
      ["FX3U-32MT/ES-A", "Automate FX3U 32 E/S transistor (sink), alimentation 100-240 V AC", { "E/S": "16 DI / 16 DO transistor" }, { by: "FX5U-32MT/ES" }],
      ["FX3U-64MT/ES-A", "Automate FX3U 64 E/S transistor (sink), alimentation 100-240 V AC", { "E/S": "32 DI / 32 DO transistor" }, { by: "FX5U-64MT/ES" }],
    ],
  ),
  ...family(
    { ...base, category: "Automates programmables", status: "obsolete", confidence: 75,
      describe: (name) => `${name}. Gamme FX2N arrêtée de longue date, remplacée par la FX3U.` },
    [
      ["FX2N-16MR-ES/UL", "Automate FX2N 16 E/S relais", { "E/S": "8 DI / 8 DO relais" }, { by: "FX3U-16MR/ES-A" }],
      ["FX2N-32MR-ES/UL", "Automate FX2N 32 E/S relais", { "E/S": "16 DI / 16 DO relais" }, { by: "FX3U-32MR/ES-A" }],
      ["FX2N-48MR-ES/UL", "Automate FX2N 48 E/S relais", { "E/S": "24 DI / 24 DO relais" }, { by: "FX3U-48MR/ES-A" }],
      ["FX2N-64MR-ES/UL", "Automate FX2N 64 E/S relais", { "E/S": "32 DI / 32 DO relais" }, { by: "FX3U-64MR/ES-A" }],
      ["FX1N-24MR-ES/UL", "Automate FX1N 24 E/S relais", { "E/S": "14 DI / 10 DO relais" }],
      ["FX1N-40MR-ES/UL", "Automate FX1N 40 E/S relais", { "E/S": "24 DI / 16 DO relais" }],
    ],
  ),

  // ── MELSEC iQ-R ────────────────────────────────────────────────────────────
  ...family(
    { ...base, category: "Automates programmables", status: "active", confidence: 75,
      describe: (name) => `${name}, plate-forme MELSEC iQ-R programmable avec GX Works3.` },
    [
      ["R04CPU", "Unité centrale iQ-R R04CPU, 40 K pas", { "Programme": "40 K pas" }],
      ["R08CPU", "Unité centrale iQ-R R08CPU, 80 K pas", { "Programme": "80 K pas" }],
      ["R16CPU", "Unité centrale iQ-R R16CPU, 160 K pas", { "Programme": "160 K pas" }],
      ["R32CPU", "Unité centrale iQ-R R32CPU, 320 K pas", { "Programme": "320 K pas" }],
      ["R120CPU", "Unité centrale iQ-R R120CPU, 1200 K pas", { "Programme": "1200 K pas" }],
      ["R04ENCPU", "Unité centrale iQ-R R04ENCPU, 40 K pas, CC-Link IE intégré", { "Programme": "40 K pas" }],
      ["R08ENCPU", "Unité centrale iQ-R R08ENCPU, 80 K pas, CC-Link IE intégré", { "Programme": "80 K pas" }],
      ["R35B", "Embase principale iQ-R 5 emplacements", { "Emplacements": "5" }, { category: "Modules d'E/S déportées" }],
      ["R38B", "Embase principale iQ-R 8 emplacements", { "Emplacements": "8" }, { category: "Modules d'E/S déportées" }],
      ["R312B", "Embase principale iQ-R 12 emplacements", { "Emplacements": "12" }, { category: "Modules d'E/S déportées" }],
      ["R61P", "Alimentation iQ-R 100-240 V AC, 6,5 A", { "Entrée": "100-240 V AC" }, { category: "Alimentations industrielles" }],
      ["R62P", "Alimentation iQ-R 100-240 V AC, 3,5 A + 24 V DC", { "Entrée": "100-240 V AC" }, { category: "Alimentations industrielles" }],
      ["R64P", "Alimentation iQ-R 100-240 V AC, 9 A", { "Entrée": "100-240 V AC" }, { category: "Alimentations industrielles" }],
      ["RX40C7", "Module iQ-R 16 entrées TOR 24 V DC", { "Voies": "16 DI" }, { category: "Modules d'E/S déportées" }],
      ["RX41C4", "Module iQ-R 32 entrées TOR 24 V DC", { "Voies": "32 DI" }, { category: "Modules d'E/S déportées" }],
      ["RY40NT5P", "Module iQ-R 16 sorties transistor (sink)", { "Voies": "16 DO" }, { category: "Modules d'E/S déportées" }],
      ["RY41NT2P", "Module iQ-R 32 sorties transistor (sink)", { "Voies": "32 DO" }, { category: "Modules d'E/S déportées" }],
      ["RY10R2", "Module iQ-R 16 sorties relais", { "Voies": "16 DO relais" }, { category: "Modules d'E/S déportées" }],
      ["R60AD4", "Module iQ-R 4 entrées analogiques", { "Voies": "4 AI" }, { category: "Modules d'E/S déportées" }],
      ["R60DA4", "Module iQ-R 4 sorties analogiques", { "Voies": "4 AO" }, { category: "Modules d'E/S déportées" }],
      ["RJ71EN71", "Module de communication iQ-R Ethernet / CC-Link IE", { "Interface": "Ethernet 1 Gbit/s" }, { category: "Modules d'E/S déportées" }],
      ["RJ71C24", "Module de communication iQ-R série RS-232 / RS-422/485", { "Interface": "RS-232 / RS-422/485" }, { category: "Modules d'E/S déportées" }],
    ],
  ),

  // ── MELSEC-Q ───────────────────────────────────────────────────────────────
  ...family(
    { ...base, category: "Automates programmables", status: "active", confidence: 65,
      describe: (name) => `${name}, plate-forme MELSEC-Q programmable avec GX Works2.` },
    [
      ["Q00UJCPU", "Unité centrale Q00UJCPU, 10 K pas, embase et alimentation intégrées", { "Programme": "10 K pas" }],
      ["Q00UCPU", "Unité centrale Q00UCPU, 10 K pas", { "Programme": "10 K pas" }],
      ["Q01UCPU", "Unité centrale Q01UCPU, 15 K pas", { "Programme": "15 K pas" }],
      ["Q03UDVCPU", "Unité centrale Q03UDVCPU, 30 K pas, Ethernet", { "Programme": "30 K pas" }],
      ["Q04UDVCPU", "Unité centrale Q04UDVCPU, 40 K pas, Ethernet", { "Programme": "40 K pas" }],
      ["Q06UDVCPU", "Unité centrale Q06UDVCPU, 60 K pas, Ethernet", { "Programme": "60 K pas" }],
      ["Q13UDVCPU", "Unité centrale Q13UDVCPU, 130 K pas, Ethernet", { "Programme": "130 K pas" }],
      ["Q26UDVCPU", "Unité centrale Q26UDVCPU, 260 K pas, Ethernet", { "Programme": "260 K pas" }],
      ["Q33B", "Embase principale Q 3 emplacements", { "Emplacements": "3" }, { category: "Modules d'E/S déportées" }],
      ["Q35B", "Embase principale Q 5 emplacements", { "Emplacements": "5" }, { category: "Modules d'E/S déportées" }],
      ["Q38B", "Embase principale Q 8 emplacements", { "Emplacements": "8" }, { category: "Modules d'E/S déportées" }],
      ["Q312B", "Embase principale Q 12 emplacements", { "Emplacements": "12" }, { category: "Modules d'E/S déportées" }],
      ["Q61P", "Alimentation Q 100-240 V AC, 6 A", { "Entrée": "100-240 V AC" }, { category: "Alimentations industrielles" }],
      ["Q62P", "Alimentation Q 100-240 V AC, 3 A + 24 V DC 0,6 A", { "Entrée": "100-240 V AC" }, { category: "Alimentations industrielles" }],
      ["Q63P", "Alimentation Q 24 V DC, 6 A", { "Entrée": "24 V DC" }, { category: "Alimentations industrielles" }],
      ["Q64PN", "Alimentation Q 100-240 V AC, 8,5 A", { "Entrée": "100-240 V AC" }, { category: "Alimentations industrielles" }],
      ["QX40", "Module Q 16 entrées TOR 24 V DC (sink)", { "Voies": "16 DI" }, { category: "Modules d'E/S déportées" }],
      ["QX41", "Module Q 32 entrées TOR 24 V DC (sink)", { "Voies": "32 DI" }, { category: "Modules d'E/S déportées" }],
      ["QX42", "Module Q 64 entrées TOR 24 V DC (sink)", { "Voies": "64 DI" }, { category: "Modules d'E/S déportées" }],
      ["QY10", "Module Q 16 sorties relais", { "Voies": "16 DO relais" }, { category: "Modules d'E/S déportées" }],
      ["QY40P", "Module Q 16 sorties transistor (sink)", { "Voies": "16 DO" }, { category: "Modules d'E/S déportées" }],
      ["QY41P", "Module Q 32 sorties transistor (sink)", { "Voies": "32 DO" }, { category: "Modules d'E/S déportées" }],
      ["Q64AD", "Module Q 4 entrées analogiques", { "Voies": "4 AI" }, { category: "Modules d'E/S déportées" }],
      ["Q68ADV", "Module Q 8 entrées analogiques tension", { "Voies": "8 AI" }, { category: "Modules d'E/S déportées" }],
      ["Q68ADI", "Module Q 8 entrées analogiques courant", { "Voies": "8 AI" }, { category: "Modules d'E/S déportées" }],
      ["Q62DAN", "Module Q 2 sorties analogiques", { "Voies": "2 AO" }, { category: "Modules d'E/S déportées" }],
      ["Q64DAN", "Module Q 4 sorties analogiques", { "Voies": "4 AO" }, { category: "Modules d'E/S déportées" }],
      ["QJ71E71-100", "Module de communication Q Ethernet", { "Interface": "Ethernet 100 Mbit/s" }, { category: "Modules d'E/S déportées" }],
      ["QJ71C24N", "Module de communication Q série RS-232 / RS-422/485", { "Interface": "RS-232 / RS-422/485" }, { category: "Modules d'E/S déportées" }],
      ["QJ61BT11N", "Module maître CC-Link Q", { "Interface": "CC-Link" }, { category: "Modules d'E/S déportées" }],
      ["QJ71PB92V", "Module maître PROFIBUS-DP Q", { "Interface": "PROFIBUS-DP" }, { category: "Modules d'E/S déportées" }],
    ],
  ),
  ...family(
    { ...base, category: "Automates programmables", status: "obsolete", confidence: 55,
      describe: (name) => `${name}. Unité centrale Q de première génération arrêtée : Mitsubishi Electric oriente vers les modèles universels QnU (statut à confirmer).` },
    [
      ["Q00JCPU", "Unité centrale Q00JCPU, 8 K pas, embase et alimentation intégrées", { "Programme": "8 K pas" }, { by: "Q00UJCPU" }],
      ["Q00CPU", "Unité centrale Q00CPU, 8 K pas", { "Programme": "8 K pas" }, { by: "Q00UCPU" }],
      ["Q01CPU", "Unité centrale Q01CPU, 14 K pas", { "Programme": "14 K pas" }, { by: "Q01UCPU" }],
      ["Q02HCPU", "Unité centrale Q02HCPU haute performance, 28 K pas", { "Programme": "28 K pas" }],
      ["Q06HCPU", "Unité centrale Q06HCPU haute performance, 60 K pas", { "Programme": "60 K pas" }],
      ["Q12HCPU", "Unité centrale Q12HCPU haute performance, 124 K pas", { "Programme": "124 K pas" }],
      ["Q25HCPU", "Unité centrale Q25HCPU haute performance, 252 K pas", { "Programme": "252 K pas" }],
    ],
  ),
  // ── MELSEC-A (arrêté) ──────────────────────────────────────────────────────
  ...family(
    { ...base, category: "Automates programmables", status: "obsolete", confidence: 80,
      describe: (name) => `${name}. Gamme MELSEC-A (AnS) arrêtée de longue date : migration vers MELSEC-Q ou iQ-R.` },
    [
      ["A1SJHCPU", "Unité centrale A1SJHCPU", null],
      ["A1SHCPU", "Unité centrale A1SHCPU", null],
      ["A2SHCPU", "Unité centrale A2SHCPU", null],
      ["A2USHCPU-S1", "Unité centrale A2USHCPU-S1", null],
      ["A1SX40", "Module AnS 16 entrées TOR 12/24 V DC", { "Voies": "16 DI" }, { category: "Modules d'E/S déportées" }],
      ["A1SX41", "Module AnS 32 entrées TOR 12/24 V DC", { "Voies": "32 DI" }, { category: "Modules d'E/S déportées" }],
      ["A1SY10", "Module AnS 16 sorties relais", { "Voies": "16 DO relais" }, { category: "Modules d'E/S déportées" }],
      ["A1SY41", "Module AnS 32 sorties transistor", { "Voies": "32 DO" }, { category: "Modules d'E/S déportées" }],
      ["A1S61PN", "Alimentation AnS 100-240 V AC", null, { category: "Alimentations industrielles" }],
      ["A1S35B", "Embase principale AnS 5 emplacements", { "Emplacements": "5" }, { category: "Modules d'E/S déportées" }],
      ["A1S38B", "Embase principale AnS 8 emplacements", { "Emplacements": "8" }, { category: "Modules d'E/S déportées" }],
    ],
  ),

  // ── IHM GOT ────────────────────────────────────────────────────────────────
  ...family(
    { ...base, category: "IHM et pupitres", status: "active", confidence: 70,
      describe: (name) => `${name}, terminal opérateur GOT2000 configurable avec GT Designer3.` },
    [
      ["GT2103-PMBD", "Terminal GOT2000 GT2103 3,8\" monochrome, 24 V DC", { "Écran": "3,8\"" }],
      ["GT2104-RTBD", "Terminal GOT2000 GT2104 4,3\" tactile, 24 V DC", { "Écran": "4,3\" tactile" }],
      ["GT2105-QTBDS", "Terminal GOT2000 GT2105 5,7\" tactile, 24 V DC", { "Écran": "5,7\" tactile" }],
      ["GT2107-WTBD", "Terminal GOT2000 GT2107 7\" tactile, 24 V DC", { "Écran": "7\" tactile" }],
      ["GT2310-VTBA", "Terminal GOT2000 GT2310 10,4\" tactile, 100-240 V AC", { "Écran": "10,4\" tactile" }],
      ["GT2310-VTBD", "Terminal GOT2000 GT2310 10,4\" tactile, 24 V DC", { "Écran": "10,4\" tactile" }],
      ["GT2510-VTBA", "Terminal GOT2000 GT2510 10,4\" tactile, 100-240 V AC", { "Écran": "10,4\" tactile" }],
      ["GT2510-VTBD", "Terminal GOT2000 GT2510 10,4\" tactile, 24 V DC", { "Écran": "10,4\" tactile" }],
      ["GT2512-STBA", "Terminal GOT2000 GT2512 12,1\" tactile, 100-240 V AC", { "Écran": "12,1\" tactile" }],
    ],
  ),
  ...family(
    { ...base, category: "IHM et pupitres", status: "obsolete", confidence: 60,
      describe: (name) => `${name}. Terminal GOT1000 arrêté : Mitsubishi Electric oriente vers le GOT2000 de taille équivalente.` },
    [
      ["GT1575-VNBA", "Terminal GOT1000 GT1575 10,4\" tactile, 100-240 V AC", { "Écran": "10,4\" tactile" }, { by: "GT2510-VTBA" }],
      ["GT1155-QSBD", "Terminal GOT1000 GT1155 5,7\" tactile, 24 V DC", { "Écran": "5,7\" tactile" }, { by: "GT2105-QTBDS" }],
      ["GT1055-QSBD", "Terminal GOT1000 GT1055 5,7\" tactile, 24 V DC", { "Écran": "5,7\" tactile" }, { by: "GT2105-QTBDS" }],
    ],
  ),

  // ── Servo MELSERVO ─────────────────────────────────────────────────────────
  ...family(
    { ...base, category: "Servovariateurs et servomoteurs", status: "active", confidence: 60,
      describe: (name) => `${name}. Servo-amplificateur MELSERVO-J4.` },
    [
      ...servoAmps("MR-J4", "interface générale", [
        ["MR-J4-10A", "100 W"], ["MR-J4-20A", "200 W"], ["MR-J4-40A", "400 W"],
        ["MR-J4-70A", "750 W"], ["MR-J4-100A", "1 kW"], ["MR-J4-200A", "2 kW"],
      ]),
      ...servoAmps("MR-J4", "SSCNET III/H", [
        ["MR-J4-10B", "100 W"], ["MR-J4-20B", "200 W"], ["MR-J4-40B", "400 W"], ["MR-J4-70B", "750 W"],
      ]),
    ],
  ),
  ...family(
    { ...base, category: "Servovariateurs et servomoteurs", status: "active", confidence: 70,
      describe: (name) => `${name}. Servo-amplificateur MELSERVO-J5.` },
    servoAmps("MR-J5", "interface générale", [
      ["MR-J5-10A", "100 W"], ["MR-J5-20A", "200 W"], ["MR-J5-40A", "400 W"], ["MR-J5-70A", "750 W"],
    ]),
  ),
  ...family(
    { ...base, category: "Servovariateurs et servomoteurs", status: "obsolete", confidence: 75,
      describe: (name) => `${name}. Gamme MELSERVO-J3 arrêtée : remplacement par le MR-J4 de même puissance.` },
    [
      ...servoAmps("MR-J3", "interface générale", [
        ["MR-J3-10A", "100 W", "MR-J4-10A"], ["MR-J3-20A", "200 W", "MR-J4-20A"], ["MR-J3-40A", "400 W", "MR-J4-40A"],
        ["MR-J3-70A", "750 W", "MR-J4-70A"], ["MR-J3-100A", "1 kW", "MR-J4-100A"], ["MR-J3-200A", "2 kW", "MR-J4-200A"],
      ]),
      ...servoAmps("MR-J3", "SSCNET III", [
        ["MR-J3-10B", "100 W", "MR-J4-10B"], ["MR-J3-20B", "200 W", "MR-J4-20B"],
        ["MR-J3-40B", "400 W", "MR-J4-40B"], ["MR-J3-70B", "750 W", "MR-J4-70B"],
      ]),
    ],
  ),
  ...family(
    { ...base, category: "Servovariateurs et servomoteurs", status: "active", confidence: 65,
      describe: (name) => `${name}, servomoteur à faible inertie série HG-KR pour MR-J4.` },
    [
      ["HG-KR13", "Servomoteur HG-KR 100 W", { "Puissance": "100 W" }],
      ["HG-KR23", "Servomoteur HG-KR 200 W", { "Puissance": "200 W" }],
      ["HG-KR43", "Servomoteur HG-KR 400 W", { "Puissance": "400 W" }],
      ["HG-KR73", "Servomoteur HG-KR 750 W", { "Puissance": "750 W" }],
    ],
  ),
  ...family(
    { ...base, category: "Servovariateurs et servomoteurs", status: "obsolete", confidence: 70,
      describe: (name) => `${name}. Servomoteur HF-KP (MR-J3) arrêté : remplacement par le HG-KR de même puissance.` },
    [
      ["HF-KP13", "Servomoteur HF-KP 100 W", { "Puissance": "100 W" }, { by: "HG-KR13" }],
      ["HF-KP23", "Servomoteur HF-KP 200 W", { "Puissance": "200 W" }, { by: "HG-KR23" }],
      ["HF-KP43", "Servomoteur HF-KP 400 W", { "Puissance": "400 W" }, { by: "HG-KR43" }],
      ["HF-KP73", "Servomoteur HF-KP 750 W", { "Puissance": "750 W" }, { by: "HG-KR73" }],
    ],
  ),
];
