import { family, type Row } from "../lib";

const base = { manufacturer: "Omron", industry: "industrie" } as const;

/** Variateur MX2 400 V : [référence, puissance, remplacement éventuel]. */
function inverters(series: string, rows: [string, string, string?][]): Row[] {
  return rows.map(([ref, kw, by]) => [
    ref,
    `Variateur ${series} ${kw} 400 V`,
    { "Puissance": kw, "Alimentation": "3 ph 380-480 V" },
    by ? { by } : undefined,
  ]);
}

export const omron = [
  // ── Automates compacts CP1E / CP1L / CP2E ──────────────────────────────────
  ...family(
    { ...base, category: "Automates programmables", status: "active", confidence: 75,
      describe: (name) => `${name}, automate compact Omron programmable avec CX-Programmer.` },
    [
      ["CP1E-E20DR-A", "Automate CP1E-E 20 E/S relais, alimentation 100-240 V AC", { "E/S": "12 DI / 8 DO relais", "Alimentation": "100-240 V AC" }],
      ["CP1E-E30DR-A", "Automate CP1E-E 30 E/S relais, alimentation 100-240 V AC", { "E/S": "18 DI / 12 DO relais", "Alimentation": "100-240 V AC" }],
      ["CP1E-N20DR-A", "Automate CP1E-N 20 E/S relais, alimentation 100-240 V AC", { "E/S": "12 DI / 8 DO relais", "Alimentation": "100-240 V AC" }],
      ["CP1E-N30DR-A", "Automate CP1E-N 30 E/S relais, alimentation 100-240 V AC", { "E/S": "18 DI / 12 DO relais", "Alimentation": "100-240 V AC" }],
      ["CP1E-N40DR-A", "Automate CP1E-N 40 E/S relais, alimentation 100-240 V AC", { "E/S": "24 DI / 16 DO relais", "Alimentation": "100-240 V AC" }],
      ["CP1E-N60DR-A", "Automate CP1E-N 60 E/S relais, alimentation 100-240 V AC", { "E/S": "36 DI / 24 DO relais", "Alimentation": "100-240 V AC" }],
      ["CP1E-N30DT-D", "Automate CP1E-N 30 E/S transistor, alimentation 24 V DC", { "E/S": "18 DI / 12 DO transistor", "Alimentation": "24 V DC" }],
      ["CP1E-N40DT-D", "Automate CP1E-N 40 E/S transistor, alimentation 24 V DC", { "E/S": "24 DI / 16 DO transistor", "Alimentation": "24 V DC" }],
      ["CP1L-L20DR-D", "Automate CP1L-L 20 E/S relais, alimentation 24 V DC", { "E/S": "12 DI / 8 DO relais", "Alimentation": "24 V DC" }],
      ["CP1L-M40DR-A", "Automate CP1L-M 40 E/S relais, alimentation 100-240 V AC", { "E/S": "24 DI / 16 DO relais", "Alimentation": "100-240 V AC" }],
      ["CP1L-EL20DR-D", "Automate CP1L-EL 20 E/S relais, Ethernet, alimentation 24 V DC", { "E/S": "12 DI / 8 DO relais", "Communication": "Ethernet" }],
      ["CP1L-EM30DR-D", "Automate CP1L-EM 30 E/S relais, Ethernet, alimentation 24 V DC", { "E/S": "18 DI / 12 DO relais", "Communication": "Ethernet" }],
      ["CP2E-N30DR-A", "Automate CP2E-N 30 E/S relais, Ethernet, alimentation 100-240 V AC", { "E/S": "18 DI / 12 DO relais", "Communication": "Ethernet" }],
      ["CP2E-N40DR-A", "Automate CP2E-N 40 E/S relais, Ethernet, alimentation 100-240 V AC", { "E/S": "24 DI / 16 DO relais", "Communication": "Ethernet" }],
      ["CP2E-N60DR-A", "Automate CP2E-N 60 E/S relais, Ethernet, alimentation 100-240 V AC", { "E/S": "36 DI / 24 DO relais", "Communication": "Ethernet" }],
      ["CP2E-E30DR-A", "Automate CP2E-E 30 E/S relais, alimentation 100-240 V AC", { "E/S": "18 DI / 12 DO relais" }],
    ],
  ),

  // ── CJ2M / CJ1M ────────────────────────────────────────────────────────────
  ...family(
    { ...base, category: "Automates programmables", status: "active", confidence: 75,
      describe: (name) => `${name}, unité centrale modulaire CJ2M programmable avec CX-Programmer.` },
    [
      ["CJ2M-CPU11", "Unité centrale CJ2M, 5 K pas", { "Programme": "5 K pas" }],
      ["CJ2M-CPU12", "Unité centrale CJ2M, 10 K pas", { "Programme": "10 K pas" }],
      ["CJ2M-CPU13", "Unité centrale CJ2M, 20 K pas", { "Programme": "20 K pas" }],
      ["CJ2M-CPU31", "Unité centrale CJ2M, 5 K pas, EtherNet/IP", { "Programme": "5 K pas", "Communication": "EtherNet/IP" }],
      ["CJ2M-CPU32", "Unité centrale CJ2M, 10 K pas, EtherNet/IP", { "Programme": "10 K pas", "Communication": "EtherNet/IP" }],
      ["CJ2M-CPU33", "Unité centrale CJ2M, 20 K pas, EtherNet/IP", { "Programme": "20 K pas", "Communication": "EtherNet/IP" }],
      ["CJ2M-CPU34", "Unité centrale CJ2M, 30 K pas, EtherNet/IP", { "Programme": "30 K pas", "Communication": "EtherNet/IP" }],
      ["CJ2M-CPU35", "Unité centrale CJ2M, 60 K pas, EtherNet/IP", { "Programme": "60 K pas", "Communication": "EtherNet/IP" }],
    ],
  ),
  ...family(
    { ...base, category: "Automates programmables", status: "obsolete", confidence: 65,
      describe: (name) => `${name}. Unité centrale CJ1M arrêtée : Omron la remplace par la CJ2M de capacité équivalente.` },
    [
      ["CJ1M-CPU11", "Unité centrale CJ1M, 5 K pas", { "Programme": "5 K pas" }, { by: "CJ2M-CPU11" }],
      ["CJ1M-CPU12", "Unité centrale CJ1M, 10 K pas", { "Programme": "10 K pas" }, { by: "CJ2M-CPU12" }],
      ["CJ1M-CPU13", "Unité centrale CJ1M, 20 K pas", { "Programme": "20 K pas" }, { by: "CJ2M-CPU13" }],
    ],
  ),
  ...family(
    { ...base, category: "Modules d'E/S déportées", status: "active", confidence: 75,
      describe: (name) => `${name}, module d'E/S pour automates CJ1 et CJ2.` },
    [
      ["CJ1W-ID211", "Module 16 entrées TOR 24 V DC", { "Voies": "16 DI" }],
      ["CJ1W-ID231", "Module 32 entrées TOR 24 V DC", { "Voies": "32 DI" }],
      ["CJ1W-OD211", "Module 16 sorties transistor (sink)", { "Voies": "16 DO" }],
      ["CJ1W-OD231", "Module 32 sorties transistor (sink)", { "Voies": "32 DO" }],
      ["CJ1W-OC211", "Module 16 sorties relais", { "Voies": "16 DO relais" }],
      ["CJ1W-AD081-V1", "Module 8 entrées analogiques", { "Voies": "8 AI" }],
      ["CJ1W-DA041", "Module 4 sorties analogiques", { "Voies": "4 AO" }],
      ["CJ1W-PA205R", "Alimentation CJ 100-240 V AC, 25 W, sortie relais RUN", { "Entrée": "100-240 V AC" }, { category: "Alimentations industrielles" }],
      ["CJ1W-PD025", "Alimentation CJ 24 V DC, 25 W", { "Entrée": "24 V DC" }, { category: "Alimentations industrielles" }],
      ["CJ1W-ETN21", "Module de communication Ethernet CJ", { "Interface": "Ethernet 100 Mbit/s" }],
      ["CJ1W-SCU41-V1", "Module de communication série CJ (RS-232C + RS-422/485)", { "Interface": "RS-232C / RS-422A/485" }],
    ],
  ),

  // ── Sysmac NX / NJ ─────────────────────────────────────────────────────────
  ...family(
    { ...base, category: "Automates programmables", status: "active", confidence: 75,
      describe: (name) => `${name}, contrôleur de machine Sysmac programmable avec Sysmac Studio, EtherCAT et EtherNet/IP intégrés.` },
    [
      ["NX1P2-1140DT", "Contrôleur NX1P2, 40 E/S, 4 axes", { "E/S intégrées": "24 DI / 16 DO", "Axes": "4" }],
      ["NX102-1200", "Contrôleur NX102, 2 axes", { "Axes": "2" }],
      ["NJ101-1000", "Contrôleur NJ101, 2 axes", { "Axes": "2" }],
      ["NJ301-1100", "Contrôleur NJ301, 4 axes", { "Axes": "4" }],
      ["NJ501-1300", "Contrôleur NJ501, 16 axes", { "Axes": "16" }],
    ],
  ),

  // ── IHM ────────────────────────────────────────────────────────────────────
  ...family(
    { ...base, category: "IHM et pupitres", status: "active", confidence: 70,
      describe: (name) => `${name}, terminal opérateur Omron.` },
    [
      ["NB5Q-TW01B", "Terminal tactile NB 5,6\"", { "Écran": "5,6\" tactile" }],
      ["NB7W-TW01B", "Terminal tactile NB 7\" large", { "Écran": "7\" tactile" }],
      ["NB10W-TW01B", "Terminal tactile NB 10,1\" large", { "Écran": "10,1\" tactile" }],
      ["NA5-7W001B", "Terminal tactile Sysmac NA5 7\"", { "Écran": "7\" tactile" }],
      ["NA5-9W001B", "Terminal tactile Sysmac NA5 9\"", { "Écran": "9\" tactile" }],
      ["NA5-12W101B", "Terminal tactile Sysmac NA5 12\"", { "Écran": "12,1\" tactile" }],
      ["NA5-15W101B", "Terminal tactile Sysmac NA5 15\"", { "Écran": "15,4\" tactile" }],
    ],
  ),

  // ── Relais, embases, relais statiques, temporisateurs ──────────────────────
  ...family(
    { ...base, category: "Contacteurs et relais", status: "active", confidence: 75,
      describe: (name) => `${name}, gamme relais et temporisation Omron.` },
    [
      ["MY4N-GS DC24", "Relais embrochable MY 4 OF, bobine 24 V DC, LED", { "Contacts": "4 OF 5 A", "Bobine": "24 V DC" }],
      ["MY2N-GS AC230", "Relais embrochable MY 2 OF, bobine 230 V AC, LED", { "Contacts": "2 OF 10 A", "Bobine": "230 V AC" }],
      ["MY4N-GS AC230", "Relais embrochable MY 4 OF, bobine 230 V AC, LED", { "Contacts": "4 OF 5 A", "Bobine": "230 V AC" }],
      ["LY2N DC24", "Relais de puissance LY 2 OF, bobine 24 V DC, LED", { "Contacts": "2 OF 10 A", "Bobine": "24 V DC" }],
      ["LY4N DC24", "Relais de puissance LY 4 OF, bobine 24 V DC, LED", { "Contacts": "4 OF 10 A", "Bobine": "24 V DC" }],
      ["PYF08A-E", "Embase rail DIN pour relais MY2", null],
      ["PYF14A-E", "Embase rail DIN pour relais MY4", null],
      ["G3NA-210B DC5-24", "Relais statique G3NA 10 A, commande 5-24 V DC", { "Courant de charge": "10 A", "Tension de charge": "24-240 V AC" }],
      ["G3NA-225B DC5-24", "Relais statique G3NA 25 A, commande 5-24 V DC", { "Courant de charge": "25 A", "Tension de charge": "24-240 V AC" }],
      ["G3NA-240B DC5-24", "Relais statique G3NA 40 A, commande 5-24 V DC", { "Courant de charge": "40 A", "Tension de charge": "24-240 V AC" }],
      ["H3CR-A8 AC100-240/DC100-125", "Temporisateur multifonction H3CR-A8, 100-240 V AC", { "Alimentation": "100-240 V AC / 100-125 V DC" }],
      ["H3CR-A8 AC24-48/DC12-48", "Temporisateur multifonction H3CR-A8, 24-48 V AC", { "Alimentation": "24-48 V AC / 12-48 V DC" }],
    ],
  ),

  // ── Alimentations S8VK / S82K ──────────────────────────────────────────────
  ...family(
    { ...base, category: "Alimentations industrielles", status: "active", confidence: 75,
      describe: (name) => `${name}, alimentation à découpage Omron pour rail DIN.` },
    [
      ["S8VK-C06024", "Alimentation S8VK-C 24 V / 2,5 A (60 W)", { "Sortie": "24 V DC / 2,5 A" }],
      ["S8VK-C12024", "Alimentation S8VK-C 24 V / 5 A (120 W)", { "Sortie": "24 V DC / 5 A" }],
      ["S8VK-C24024", "Alimentation S8VK-C 24 V / 10 A (240 W)", { "Sortie": "24 V DC / 10 A" }],
      ["S8VK-C48024", "Alimentation S8VK-C 24 V / 20 A (480 W)", { "Sortie": "24 V DC / 20 A" }],
      ["S8VK-G12024", "Alimentation S8VK-G 24 V / 5 A (120 W)", { "Sortie": "24 V DC / 5 A" }],
      ["S8VK-G24024", "Alimentation S8VK-G 24 V / 10 A (240 W)", { "Sortie": "24 V DC / 10 A" }],
      ["S8VK-G48024", "Alimentation S8VK-G 24 V / 20 A (480 W)", { "Sortie": "24 V DC / 20 A" }],
    ],
  ),
  ...family(
    { ...base, category: "Alimentations industrielles", status: "obsolete", confidence: 65,
      describe: (name) => `${name}. Gamme S82K arrêtée : Omron la remplace par la S8VK-C.` },
    [
      ["S82K-05024", "Alimentation S82K 24 V / 2,1 A (50 W)", { "Sortie": "24 V DC / 2,1 A" }, { by: "S8VK-C06024" }],
      ["S82K-10024", "Alimentation S82K 24 V / 4,2 A (100 W)", { "Sortie": "24 V DC / 4,2 A" }, { by: "S8VK-C12024" }],
    ],
  ),

  // ── Variateurs MX2 / JX ────────────────────────────────────────────────────
  ...family(
    { ...base, category: "Variateurs de vitesse", status: "active", confidence: 70,
      describe: (name) => `${name}. Variateur compact MX2 V1 pour machines, Modbus intégré.` },
    inverters("3G3MX2-V1", [
      ["3G3MX2-A4004-V1", "0,4 kW"], ["3G3MX2-A4007-V1", "0,75 kW"], ["3G3MX2-A4015-V1", "1,5 kW"],
      ["3G3MX2-A4022-V1", "2,2 kW"], ["3G3MX2-A4040-V1", "4 kW"], ["3G3MX2-A4055-V1", "5,5 kW"],
      ["3G3MX2-A4075-V1", "7,5 kW"],
    ]),
  ),
  ...family(
    { ...base, category: "Variateurs de vitesse", status: "obsolete", confidence: 55,
      describe: (name) => `${name}. Variateur JX arrêté : Omron oriente vers le MX2 de même puissance.` },
    inverters("3G3JX", [
      ["3G3JX-A4004", "0,4 kW", "3G3MX2-A4004-V1"], ["3G3JX-A4007", "0,75 kW", "3G3MX2-A4007-V1"],
      ["3G3JX-A4015", "1,5 kW", "3G3MX2-A4015-V1"], ["3G3JX-A4022", "2,2 kW", "3G3MX2-A4022-V1"],
      ["3G3JX-A4040", "4 kW", "3G3MX2-A4040-V1"],
    ]),
  ),
];
