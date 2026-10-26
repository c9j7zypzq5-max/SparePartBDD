import { family } from "../lib";

const base = { manufacturer: "WAGO", industry: "industrie" } as const;

export const wago = [
  // ── Système d'E/S 750 : contrôleurs et coupleurs ───────────────────────────
  ...family(
    { ...base, category: "Automates programmables", status: "active", confidence: 70,
      describe: (name) => `${name}, contrôleur du système d'E/S WAGO 750, programmable avec CODESYS / e!COCKPIT.` },
    [
      ["750-8202", "Contrôleur PFC200, 2 x Ethernet, RS-232/485", { "Communication": "2 x Ethernet + série" }],
      ["750-8212", "Contrôleur PFC200 G2, 2 x Ethernet, RS-232/485", { "Communication": "2 x Ethernet + série" }],
      ["750-8100", "Contrôleur PFC100, 2 x Ethernet", { "Communication": "2 x Ethernet" }],
      ["750-8101", "Contrôleur PFC100, 2 x Ethernet (température étendue)", { "Communication": "2 x Ethernet" }],
    ],
  ),
  ...family(
    { ...base, category: "Automates programmables", status: "obsolete", confidence: 60,
      describe: (name) => `${name}. Contrôleur programmable 750 de première génération arrêté : WAGO oriente vers le PFC200.` },
    [["750-841", "Contrôleur programmable ETHERNET 750-841", { "Communication": "Ethernet" }]],
  ),
  ...family(
    { ...base, category: "Modules d'E/S déportées", status: "active", confidence: 70,
      describe: (name) => `${name}, coupleur de bus de terrain du système d'E/S WAGO 750.` },
    [
      ["750-352", "Coupleur de bus de terrain ETHERNET (Modbus TCP, EtherNet/IP)", { "Interface": "Ethernet 2 ports" }],
      ["750-362", "Coupleur de bus de terrain Modbus TCP, 4e génération", { "Interface": "Ethernet 2 ports" }],
      ["750-354", "Coupleur de bus de terrain EtherCAT", { "Interface": "EtherCAT" }],
      ["750-375", "Coupleur de bus de terrain PROFINET IO", { "Interface": "PROFINET" }],
      ["750-377", "Coupleur de bus de terrain PROFINET IO, version avancée", { "Interface": "PROFINET" }],
      ["750-333", "Coupleur de bus de terrain PROFIBUS DP", { "Interface": "PROFIBUS DP" }],
    ],
  ),
  // ── Système d'E/S 750 : modules ────────────────────────────────────────────
  ...family(
    { ...base, category: "Modules d'E/S déportées", status: "active", confidence: 75,
      describe: (name) => `${name}, module du système d'E/S WAGO 750 à raccordement CAGE CLAMP.` },
    [
      ["750-402", "Module 4 entrées TOR 24 V DC", { "Voies": "4 DI" }],
      ["750-430", "Module 8 entrées TOR 24 V DC", { "Voies": "8 DI" }],
      ["750-1405", "Module 16 entrées TOR 24 V DC", { "Voies": "16 DI" }],
      ["750-504", "Module 4 sorties TOR 24 V DC 0,5 A", { "Voies": "4 DO" }],
      ["750-530", "Module 8 sorties TOR 24 V DC 0,5 A", { "Voies": "8 DO" }],
      ["750-1504", "Module 16 sorties TOR 24 V DC 0,5 A", { "Voies": "16 DO" }],
      ["750-513", "Module 2 sorties relais", { "Voies": "2 DO relais" }],
      ["750-455", "Module 4 entrées analogiques 4-20 mA", { "Voies": "4 AI" }],
      ["750-459", "Module 4 entrées analogiques 0-10 V", { "Voies": "4 AI" }],
      ["750-461", "Module 2 entrées RTD (Pt100)", { "Voies": "2 RTD" }],
      ["750-469", "Module 2 entrées thermocouple", { "Voies": "2 TC" }],
      ["750-555", "Module 4 sorties analogiques 4-20 mA", { "Voies": "4 AO" }],
      ["750-559", "Module 4 sorties analogiques 0-10 V", { "Voies": "4 AO" }],
      ["750-600", "Module de fin de bus", null],
      ["750-602", "Module d'alimentation de potentiel 24 V DC", null],
    ],
  ),

  // ── Connectique : bornes à levier, bornes à enficher, TOPJOB S ─────────────
  ...family(
    { ...base, category: "Bornes et connectique", status: "active", confidence: 70,
      describe: (name) => `${name}, connectique WAGO sans outil pour conducteurs souples et rigides.` },
    [
      ["221-412", "Borne de connexion à levier 221, 2 conducteurs 4 mm²", { "Conducteurs": "2", "Section max.": "4 mm²" }],
      ["221-413", "Borne de connexion à levier 221, 3 conducteurs 4 mm²", { "Conducteurs": "3", "Section max.": "4 mm²" }],
      ["221-415", "Borne de connexion à levier 221, 5 conducteurs 4 mm²", { "Conducteurs": "5", "Section max.": "4 mm²" }],
      ["221-612", "Borne de connexion à levier 221, 2 conducteurs 6 mm²", { "Conducteurs": "2", "Section max.": "6 mm²" }],
      ["221-613", "Borne de connexion à levier 221, 3 conducteurs 6 mm²", { "Conducteurs": "3", "Section max.": "6 mm²" }],
      ["221-615", "Borne de connexion à levier 221, 5 conducteurs 6 mm²", { "Conducteurs": "5", "Section max.": "6 mm²" }],
      ["222-412", "Borne de connexion à levier 222, 2 conducteurs 4 mm²", { "Conducteurs": "2", "Section max.": "4 mm²" }],
      ["222-413", "Borne de connexion à levier 222, 3 conducteurs 4 mm²", { "Conducteurs": "3", "Section max.": "4 mm²" }],
      ["222-415", "Borne de connexion à levier 222, 5 conducteurs 4 mm²", { "Conducteurs": "5", "Section max.": "4 mm²" }],
      ["2273-202", "Borne de connexion à enficher 2273, 2 conducteurs rigides", { "Conducteurs": "2", "Section": "0,5 à 2,5 mm²" }],
      ["2273-203", "Borne de connexion à enficher 2273, 3 conducteurs rigides", { "Conducteurs": "3", "Section": "0,5 à 2,5 mm²" }],
      ["2273-204", "Borne de connexion à enficher 2273, 4 conducteurs rigides", { "Conducteurs": "4", "Section": "0,5 à 2,5 mm²" }],
      ["2273-205", "Borne de connexion à enficher 2273, 5 conducteurs rigides", { "Conducteurs": "5", "Section": "0,5 à 2,5 mm²" }],
      ["2273-208", "Borne de connexion à enficher 2273, 8 conducteurs rigides", { "Conducteurs": "8", "Section": "0,5 à 2,5 mm²" }],
      ["2002-1201", "Borne de passage TOPJOB S 2,5 mm², 2 conducteurs, grise", { "Section": "2,5 mm²", "Couleur": "gris" }],
      ["2002-1204", "Borne de passage TOPJOB S 2,5 mm², 2 conducteurs, bleue", { "Section": "2,5 mm²", "Couleur": "bleu" }],
      ["2002-1207", "Borne de protection TOPJOB S 2,5 mm², 2 conducteurs, vert-jaune", { "Section": "2,5 mm²", "Couleur": "vert-jaune" }],
      ["2004-1201", "Borne de passage TOPJOB S 4 mm², 2 conducteurs, grise", { "Section": "4 mm²", "Couleur": "gris" }],
      ["2004-1207", "Borne de protection TOPJOB S 4 mm², 2 conducteurs, vert-jaune", { "Section": "4 mm²", "Couleur": "vert-jaune" }],
      ["2006-1201", "Borne de passage TOPJOB S 6 mm², 2 conducteurs, grise", { "Section": "6 mm²", "Couleur": "gris" }],
      ["2006-1207", "Borne de protection TOPJOB S 6 mm², 2 conducteurs, vert-jaune", { "Section": "6 mm²", "Couleur": "vert-jaune" }],
      ["2010-1201", "Borne de passage TOPJOB S 10 mm², 2 conducteurs, grise", { "Section": "10 mm²", "Couleur": "gris" }],
      ["2002-1291", "Plaque d'extrémité et intermédiaire pour bornes TOPJOB S 2,5 mm²", null],
      ["2002-402", "Pont enfichable 2 pôles pour bornes TOPJOB S 2,5 mm²", null],
    ],
  ),
];
