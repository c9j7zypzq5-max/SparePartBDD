import { family, type Row } from "../lib";

const base = { manufacturer: "Rockwell Automation", industry: "industrie" } as const;

/** PowerFlex 380-480 V : [référence, puissance, remplacement éventuel]. */
function powerflex(series: string, rows: [string, string, string?][]): Row[] {
  return rows.map(([ref, kw, by]) => [
    ref,
    `Variateur ${series} ${kw} 380-480 V`,
    { "Puissance": kw, "Alimentation": "3 ph 380-480 V" },
    by ? { by } : undefined,
  ]);
}

export const rockwell = [
  // ── ControlLogix : processeurs ─────────────────────────────────────────────
  ...family(
    { ...base, category: "Automates programmables", status: "active", confidence: 80,
      describe: (name) => `${name}. Contrôleur ControlLogix 5580 (Allen-Bradley) avec port EtherNet/IP intégré, programmable sous Studio 5000.` },
    [
      ["1756-L84E", "Contrôleur ControlLogix 5580, 20 Mo", { "Mémoire utilisateur": "20 Mo", "Communication": "EtherNet/IP 1 Gbit/s" }],
      ["1756-L85E", "Contrôleur ControlLogix 5580, 40 Mo", { "Mémoire utilisateur": "40 Mo", "Communication": "EtherNet/IP 1 Gbit/s" }],
    ],
  ),
  ...family(
    { ...base, category: "Automates programmables", status: "obsolete", confidence: 65,
      describe: (name) => `${name}. Contrôleur ControlLogix 5570 (Allen-Bradley) : migration vers le ControlLogix 5580 de capacité équivalente.` },
    [
      ["1756-L74", "Contrôleur ControlLogix 5570, 16 Mo", { "Mémoire utilisateur": "16 Mo" }, { by: "1756-L84E" }],
      ["1756-L75", "Contrôleur ControlLogix 5570, 32 Mo", { "Mémoire utilisateur": "32 Mo" }, { by: "1756-L85E" }],
    ],
  ),
  ...family(
    { ...base, category: "Automates programmables", status: "obsolete", confidence: 70,
      describe: (name) => `${name}. Contrôleur ControlLogix 5560 (Allen-Bradley) arrêté : migration vers le ControlLogix 5580.` },
    [
      ["1756-L62", "Contrôleur ControlLogix 5560, 4 Mo", { "Mémoire utilisateur": "4 Mo" }, { by: "1756-L82E" }],
      ["1756-L63", "Contrôleur ControlLogix 5560, 8 Mo", { "Mémoire utilisateur": "8 Mo" }, { by: "1756-L83E" }],
      ["1756-L64", "Contrôleur ControlLogix 5560, 16 Mo", { "Mémoire utilisateur": "16 Mo" }, { by: "1756-L84E" }],
      ["1756-L65", "Contrôleur ControlLogix 5560, 32 Mo", { "Mémoire utilisateur": "32 Mo" }, { by: "1756-L85E" }],
    ],
  ),

  // ── ControlLogix : E/S, châssis, alimentations, communication ──────────────
  ...family(
    { ...base, category: "Modules d'E/S déportées", status: "active", confidence: 75,
      describe: (name) => `${name}, module d'E/S ControlLogix 1756 (Allen-Bradley), débrochable sous tension.` },
    [
      ["1756-IB16", "Module 16 entrées TOR 10-31 V DC", { "Voies": "16 DI" }],
      ["1756-OB16E", "Module 16 sorties TOR 10-31 V DC à protection électronique", { "Voies": "16 DO" }],
      ["1756-OW16I", "Module 16 sorties relais isolées", { "Voies": "16 DO relais" }],
      ["1756-IA16", "Module 16 entrées TOR 79-132 V AC", { "Voies": "16 DI AC" }],
      ["1756-OA16", "Module 16 sorties TOR 74-265 V AC", { "Voies": "16 DO AC" }],
      ["1756-IF8", "Module 8 entrées analogiques tension/courant", { "Voies": "8 AI" }],
      ["1756-IF6I", "Module 6 entrées analogiques isolées", { "Voies": "6 AI" }],
      ["1756-OF4", "Module 4 sorties analogiques tension/courant", { "Voies": "4 AO" }],
      ["1756-OF6CI", "Module 6 sorties analogiques courant isolées", { "Voies": "6 AO" }],
      ["1756-IR6I", "Module 6 entrées RTD isolées", { "Voies": "6 RTD" }],
      ["1756-IT6I", "Module 6 entrées thermocouple isolées", { "Voies": "6 TC" }],
      ["1756-A4", "Châssis ControlLogix 4 emplacements", { "Emplacements": "4" }],
      ["1756-A7", "Châssis ControlLogix 7 emplacements", { "Emplacements": "7" }],
      ["1756-A10", "Châssis ControlLogix 10 emplacements", { "Emplacements": "10" }],
      ["1756-A13", "Châssis ControlLogix 13 emplacements", { "Emplacements": "13" }],
      ["1756-A17", "Châssis ControlLogix 17 emplacements", { "Emplacements": "17" }],
      ["1756-PA75", "Alimentation de châssis ControlLogix 85-265 V AC", { "Entrée": "85-265 V AC" }, { category: "Alimentations industrielles" }],
      ["1756-PB75", "Alimentation de châssis ControlLogix 19,2-32 V DC", { "Entrée": "19,2-32 V DC" }, { category: "Alimentations industrielles" }],
      ["1756-EN2TR", "Module de communication EtherNet/IP 2 ports (anneau DLR)", { "Interface": "EtherNet/IP 2 ports" }],
      ["1756-EN3TR", "Module de communication EtherNet/IP 2 ports, mouvement intégré étendu", { "Interface": "EtherNet/IP 2 ports" }],
      ["1756-EN4TR", "Module de communication EtherNet/IP 1 Gbit/s 2 ports", { "Interface": "EtherNet/IP 1 Gbit/s" }],
      ["1756-CN2R", "Module de communication ControlNet redondant", { "Interface": "ControlNet" }],
      ["1756-RM2", "Module de redondance ControlLogix", null],
    ],
  ),
  ...family(
    { ...base, category: "Modules d'E/S déportées", status: "obsolete", confidence: 70,
      describe: (name) => `${name}, module ControlLogix arrêté remplacé par son successeur direct.` },
    [
      ["1756-ENBT", "Module de communication EtherNet/IP 10/100", { "Interface": "EtherNet/IP" }, { by: "1756-EN2T" }],
      ["1756-CNB", "Module de communication ControlNet", { "Interface": "ControlNet" }, { by: "1756-CN2" }],
    ],
  ),
  ...family(
    { ...base, category: "Modules d'E/S déportées", status: "active", confidence: 70,
      describe: (name) => `${name}, module de communication ControlLogix.` },
    [["1756-CN2", "Module de communication ControlNet", { "Interface": "ControlNet" }]],
  ),

  // ── CompactLogix 5370 / 5380 ───────────────────────────────────────────────
  ...family(
    { ...base, category: "Automates programmables", status: "active", confidence: 70,
      describe: (name) => `${name}. Contrôleur CompactLogix (Allen-Bradley) avec EtherNet/IP intégré, programmable sous Studio 5000.` },
    [
      ["1769-L30ERM", "Contrôleur CompactLogix 5370 L3, 1 Mo, mouvement intégré", { "Mémoire utilisateur": "1 Mo" }],
      ["1769-L33ERM", "Contrôleur CompactLogix 5370 L3, 2 Mo, mouvement intégré", { "Mémoire utilisateur": "2 Mo" }],
      ["1769-L24ER-QB1B", "Contrôleur CompactLogix 5370 L2, 750 Ko, 16 DI / 16 DO intégrées", { "Mémoire utilisateur": "750 Ko", "E/S intégrées": "16 DI / 16 DO" }],
      ["1769-L24ER-QBFC1B", "Contrôleur CompactLogix 5370 L2, 750 Ko, E/S TOR, analogiques et comptage intégrées", { "Mémoire utilisateur": "750 Ko" }],
      ["1769-L27ERM-QBFC1B", "Contrôleur CompactLogix 5370 L2, 1 Mo, mouvement intégré, E/S intégrées", { "Mémoire utilisateur": "1 Mo" }],
      ["5069-L306ER", "Contrôleur CompactLogix 5380, 0,6 Mo", { "Mémoire utilisateur": "0,6 Mo" }],
      ["5069-L310ER", "Contrôleur CompactLogix 5380, 1 Mo", { "Mémoire utilisateur": "1 Mo" }],
      ["5069-L320ER", "Contrôleur CompactLogix 5380, 2 Mo", { "Mémoire utilisateur": "2 Mo" }],
      ["5069-L330ER", "Contrôleur CompactLogix 5380, 3 Mo", { "Mémoire utilisateur": "3 Mo" }],
      ["5069-L340ER", "Contrôleur CompactLogix 5380, 4 Mo", { "Mémoire utilisateur": "4 Mo" }],
      ["5069-L320ERM", "Contrôleur CompactLogix 5380, 2 Mo, mouvement intégré", { "Mémoire utilisateur": "2 Mo" }],
      ["5069-L340ERM", "Contrôleur CompactLogix 5380, 4 Mo, mouvement intégré", { "Mémoire utilisateur": "4 Mo" }],
    ],
  ),
  ...family(
    { ...base, category: "Automates programmables", status: "obsolete", confidence: 65,
      describe: (name) => `${name}. Contrôleur CompactLogix 1769-L3x arrêté : Rockwell Automation oriente vers le CompactLogix 5370 (1769-L3xER).` },
    [
      ["1769-L31", "Contrôleur CompactLogix L31, 512 Ko", { "Mémoire utilisateur": "512 Ko" }, { by: "1769-L30ER" }],
      ["1769-L32E", "Contrôleur CompactLogix L32E, 750 Ko, EtherNet/IP", { "Mémoire utilisateur": "750 Ko" }, { by: "1769-L33ER" }],
      ["1769-L35E", "Contrôleur CompactLogix L35E, 1,5 Mo, EtherNet/IP", { "Mémoire utilisateur": "1,5 Mo" }, { by: "1769-L36ERM" }],
    ],
  ),
  ...family(
    { ...base, category: "Modules d'E/S déportées", status: "active", confidence: 70,
      describe: (name) => `${name}, module Compact I/O 1769 (Allen-Bradley) pour CompactLogix et MicroLogix 1500.` },
    [
      ["1769-IQ16", "Module 16 entrées TOR 24 V DC", { "Voies": "16 DI" }],
      ["1769-IQ32", "Module 32 entrées TOR 24 V DC", { "Voies": "32 DI" }],
      ["1769-OB16", "Module 16 sorties TOR 24 V DC", { "Voies": "16 DO" }],
      ["1769-OB32", "Module 32 sorties TOR 24 V DC", { "Voies": "32 DO" }],
      ["1769-OW8", "Module 8 sorties relais", { "Voies": "8 DO relais" }],
      ["1769-OW16", "Module 16 sorties relais", { "Voies": "16 DO relais" }],
      ["1769-IF4", "Module 4 entrées analogiques", { "Voies": "4 AI" }],
      ["1769-IF8", "Module 8 entrées analogiques", { "Voies": "8 AI" }],
      ["1769-OF2", "Module 2 sorties analogiques", { "Voies": "2 AO" }],
      ["1769-OF8C", "Module 8 sorties analogiques courant", { "Voies": "8 AO" }],
      ["1769-IR6", "Module 6 entrées RTD", { "Voies": "6 RTD" }],
      ["1769-IT6", "Module 6 entrées thermocouple", { "Voies": "6 TC" }],
      ["1769-PA2", "Alimentation Compact I/O 120/240 V AC", null, { category: "Alimentations industrielles" }],
      ["1769-PA4", "Alimentation Compact I/O 120/240 V AC, 4 A sous 5 V", null, { category: "Alimentations industrielles" }],
      ["1769-PB4", "Alimentation Compact I/O 24 V DC, 4 A sous 5 V", null, { category: "Alimentations industrielles" }],
      ["1769-ECR", "Terminaison droite Compact I/O", null],
      ["1769-ECL", "Terminaison gauche Compact I/O", null],
    ],
  ),
  ...family(
    { ...base, category: "Modules d'E/S déportées", status: "active", confidence: 70,
      describe: (name) => `${name}, module Compact 5000 I/O 5069 (Allen-Bradley) pour CompactLogix 5380 et ControlLogix.` },
    [
      ["5069-IB16", "Module 16 entrées TOR 24 V DC", { "Voies": "16 DI" }],
      ["5069-OB16", "Module 16 sorties TOR 24 V DC", { "Voies": "16 DO" }],
      ["5069-IF8", "Module 8 entrées analogiques", { "Voies": "8 AI" }],
      ["5069-OF4", "Module 4 sorties analogiques", { "Voies": "4 AO" }],
      ["5069-OW4I", "Module 4 sorties relais isolées", { "Voies": "4 DO relais" }],
      ["5069-AENTR", "Adaptateur EtherNet/IP Compact 5000 I/O", { "Interface": "EtherNet/IP 2 ports" }],
    ],
  ),

  // ── Micro800 et MicroLogix ─────────────────────────────────────────────────
  ...family(
    { ...base, category: "Automates programmables", status: "active", confidence: 60,
      describe: (name) => `${name}, micro-automate Micro800 (Allen-Bradley) programmable sous Connected Components Workbench.` },
    [
      ["2080-LC10-12QWB", "Micro-automate Micro810 12 E/S relais", { "E/S": "8 DI / 4 DO relais" }],
      ["2080-LC20-20QWB", "Micro-automate Micro820 20 E/S relais, Ethernet", { "E/S": "12 DI / 7 DO relais + 1 AO" }],
      ["2080-LC20-20QBB", "Micro-automate Micro820 20 E/S transistor, Ethernet", { "E/S": "12 DI / 7 DO transistor + 1 AO" }],
      ["2080-LC30-24QWB", "Micro-automate Micro830 24 E/S relais", { "E/S": "14 DI / 10 DO relais" }],
      ["2080-LC30-48QWB", "Micro-automate Micro830 48 E/S relais", { "E/S": "28 DI / 20 DO relais" }],
      ["2080-LC50-24QWB", "Micro-automate Micro850 24 E/S relais, Ethernet", { "E/S": "14 DI / 10 DO relais" }],
      ["2080-LC50-48QWB", "Micro-automate Micro850 48 E/S relais, Ethernet", { "E/S": "28 DI / 20 DO relais" }],
      ["2080-L50E-24QWB", "Micro-automate Micro850 2e génération 24 E/S relais, Ethernet", { "E/S": "14 DI / 10 DO relais" }],
      ["2080-LC70-24QWB", "Micro-automate Micro870 24 E/S relais, Ethernet", { "E/S": "14 DI / 10 DO relais" }],
      ["2080-L70E-24QWB", "Micro-automate Micro870 2e génération 24 E/S relais, Ethernet", { "E/S": "14 DI / 10 DO relais" }],
    ],
  ),
  ...family(
    { ...base, category: "Automates programmables", status: "active", confidence: 60,
      describe: (name) => `${name}, automate MicroLogix 1400 (Allen-Bradley) avec Ethernet intégré.` },
    [
      ["1766-L32BWA", "Automate MicroLogix 1400 32 E/S, sorties relais, alimentation 120/240 V AC", { "E/S": "20 DI / 12 DO relais", "Alimentation": "120/240 V AC" }],
      ["1766-L32AWA", "Automate MicroLogix 1400 32 E/S, entrées 120 V AC, sorties relais", { "E/S": "20 DI AC / 12 DO relais", "Alimentation": "120/240 V AC" }],
      ["1766-L32BXB", "Automate MicroLogix 1400 32 E/S, sorties relais et transistor, alimentation 24 V DC", { "E/S": "20 DI / 12 DO", "Alimentation": "24 V DC" }],
    ],
  ),
  ...family(
    { ...base, category: "Automates programmables", status: "obsolete", confidence: 65,
      describe: (name) => `${name}. MicroLogix 1200 arrêté : migration vers le MicroLogix 1400 ou la gamme Micro800.` },
    [
      ["1762-L24BWA", "Automate MicroLogix 1200 24 E/S, sorties relais, alimentation 120/240 V AC", { "E/S": "14 DI / 10 DO relais" }, { by: "1766-L32BWA" }],
      ["1762-L40BWA", "Automate MicroLogix 1200 40 E/S, sorties relais, alimentation 120/240 V AC", { "E/S": "24 DI / 16 DO relais" }, { by: "1766-L32BWA" }],
      ["1762-L24AWA", "Automate MicroLogix 1200 24 E/S, entrées 120 V AC, sorties relais", { "E/S": "14 DI AC / 10 DO relais" }, { by: "1766-L32AWA" }],
      ["1762-L40AWA", "Automate MicroLogix 1200 40 E/S, entrées 120 V AC, sorties relais", { "E/S": "24 DI AC / 16 DO relais" }, { by: "1766-L32AWA" }],
      ["1762-L40BXB", "Automate MicroLogix 1200 40 E/S, sorties relais et transistor, alimentation 24 V DC", { "E/S": "24 DI / 16 DO" }, { by: "1766-L32BXB" }],
    ],
  ),
  ...family(
    { ...base, category: "Automates programmables", status: "obsolete", confidence: 70,
      describe: (name) => `${name}. Gamme MicroLogix arrêtée : Rockwell Automation oriente vers les micro-automates Micro800.` },
    [
      ["1761-L16BWA", "Automate MicroLogix 1000 16 E/S, sorties relais", { "E/S": "10 DI / 6 DO relais" }],
      ["1761-L32BWA", "Automate MicroLogix 1000 32 E/S, sorties relais", { "E/S": "20 DI / 12 DO relais" }],
      ["1761-L16AWA", "Automate MicroLogix 1000 16 E/S, entrées 120 V AC", { "E/S": "10 DI AC / 6 DO relais" }],
      ["1764-LSP", "Processeur MicroLogix 1500 LSP", null],
      ["1764-LRP", "Processeur MicroLogix 1500 LRP avec port série supplémentaire", null],
      ["1764-24BWA", "Embase MicroLogix 1500 24 E/S, sorties relais", { "E/S": "12 DI / 12 DO relais" }],
      ["1764-24AWA", "Embase MicroLogix 1500 24 E/S, entrées 120 V AC", { "E/S": "12 DI AC / 12 DO relais" }],
    ],
  ),

  // ── SLC 500 et PLC-5 (arrêtés) ─────────────────────────────────────────────
  ...family(
    { ...base, category: "Automates programmables", status: "obsolete", confidence: 75,
      describe: (name) => `${name}. Plate-forme SLC 500 arrêtée : Rockwell Automation propose la migration vers CompactLogix.` },
    [
      ["1747-L551", "Processeur SLC 5/05, 16 K mots, Ethernet", { "Mémoire": "16 K mots" }],
      ["1747-L552", "Processeur SLC 5/05, 32 K mots, Ethernet", { "Mémoire": "32 K mots" }],
      ["1747-L553", "Processeur SLC 5/05, 64 K mots, Ethernet", { "Mémoire": "64 K mots" }],
      ["1747-L542", "Processeur SLC 5/04, 32 K mots, DH+", { "Mémoire": "32 K mots" }],
      ["1747-L532", "Processeur SLC 5/03, 16 K mots", { "Mémoire": "16 K mots" }],
      ["1746-IB16", "Module SLC 500 16 entrées TOR 24 V DC", { "Voies": "16 DI" }, { category: "Modules d'E/S déportées" }],
      ["1746-IV16", "Module SLC 500 16 entrées TOR 24 V DC (source)", { "Voies": "16 DI" }, { category: "Modules d'E/S déportées" }],
      ["1746-OB16", "Module SLC 500 16 sorties TOR 24 V DC", { "Voies": "16 DO" }, { category: "Modules d'E/S déportées" }],
      ["1746-OW16", "Module SLC 500 16 sorties relais", { "Voies": "16 DO relais" }, { category: "Modules d'E/S déportées" }],
      ["1746-NI4", "Module SLC 500 4 entrées analogiques", { "Voies": "4 AI" }, { category: "Modules d'E/S déportées" }],
      ["1746-NO4I", "Module SLC 500 4 sorties analogiques courant", { "Voies": "4 AO" }, { category: "Modules d'E/S déportées" }],
      ["1746-P2", "Alimentation de châssis SLC 500 120/240 V AC", null, { category: "Alimentations industrielles" }],
      ["1746-A10", "Châssis SLC 500 10 emplacements", { "Emplacements": "10" }, { category: "Modules d'E/S déportées" }],
    ],
  ),
  ...family(
    { ...base, category: "Automates programmables", status: "obsolete", confidence: 75,
      describe: (name) => `${name}. Plate-forme PLC-5 arrêtée : migration vers ControlLogix proposée par Rockwell Automation.` },
    [
      ["1785-L20E", "Processeur PLC-5/20E Ethernet", null],
      ["1785-L40E", "Processeur PLC-5/40E Ethernet", null],
      ["1785-L80E", "Processeur PLC-5/80E Ethernet", null],
      ["1771-IBD", "Module PLC-5 16 entrées TOR 10-30 V DC", { "Voies": "16 DI" }, { category: "Modules d'E/S déportées" }],
      ["1771-OBD", "Module PLC-5 16 sorties TOR 10-60 V DC", { "Voies": "16 DO" }, { category: "Modules d'E/S déportées" }],
      ["1771-IFE", "Module PLC-5 entrées analogiques", { "Voies": "16 AI asymétriques / 8 AI différentielles" }, { category: "Modules d'E/S déportées" }],
      ["1771-OFE2", "Module PLC-5 4 sorties analogiques courant", { "Voies": "4 AO" }, { category: "Modules d'E/S déportées" }],
    ],
  ),

  // ── PowerFlex 525 / 523 et prédécesseurs ───────────────────────────────────
  ...family(
    { ...base, category: "Variateurs de vitesse", status: "active", confidence: 80,
      describe: (name) => `${name}. Variateur compact PowerFlex 525 (Allen-Bradley), EtherNet/IP intégré, module de commande amovible.` },
    powerflex("PowerFlex 525", [
      ["25B-D1P4N104", "0,4 kW"], ["25B-D2P3N104", "0,75 kW"], ["25B-D6P0N104", "2,2 kW"],
      ["25B-D013N104", "5,5 kW"], ["25B-D024N104", "11 kW"], ["25B-D030N104", "15 kW"],
    ]),
  ),
  ...family(
    { ...base, category: "Variateurs de vitesse", status: "active", confidence: 80,
      describe: (name) => `${name}. Variateur compact PowerFlex 523 (Allen-Bradley) pour applications simples.` },
    powerflex("PowerFlex 523", [
      ["25A-D1P4N104", "0,4 kW"], ["25A-D2P3N104", "0,75 kW"], ["25A-D4P0N104", "1,5 kW"],
      ["25A-D6P0N104", "2,2 kW"], ["25A-D010N104", "4 kW"], ["25A-D013N104", "5,5 kW"], ["25A-D017N104", "7,5 kW"],
    ]),
  ),
  ...family(
    { ...base, category: "Variateurs de vitesse", status: "obsolete", confidence: 75,
      describe: (name) => `${name}. PowerFlex 40 arrêté : remplacement par le PowerFlex 525 de même puissance.` },
    powerflex("PowerFlex 40", [
      ["22B-D1P4N104", "0,4 kW", "25B-D1P4N104"], ["22B-D2P3N104", "0,75 kW", "25B-D2P3N104"],
      ["22B-D6P0N104", "2,2 kW", "25B-D6P0N104"], ["22B-D012N104", "5,5 kW", "25B-D013N104"],
      ["22B-D017N104", "7,5 kW", "25B-D017N104"], ["22B-D024N104", "11 kW", "25B-D024N104"],
    ]),
  ),
  ...family(
    { ...base, category: "Variateurs de vitesse", status: "obsolete", confidence: 70,
      describe: (name) => `${name}. PowerFlex 4 arrêté : remplacement par le PowerFlex 523 de même puissance.` },
    powerflex("PowerFlex 4", [
      ["22A-D1P4N104", "0,4 kW", "25A-D1P4N104"], ["22A-D2P3N104", "0,75 kW", "25A-D2P3N104"],
      ["22A-D4P0N104", "1,5 kW", "25A-D4P0N104"], ["22A-D6P0N104", "2,2 kW", "25A-D6P0N104"],
    ]),
  ),

  // ── PanelView ──────────────────────────────────────────────────────────────
  ...family(
    { ...base, category: "IHM et pupitres", status: "active", confidence: 70,
      describe: (name) => `${name}, terminal opérateur PanelView Plus 7 (Allen-Bradley) configurable sous FactoryTalk View ME.` },
    [
      ["2711P-T7C22D8S", "PanelView Plus 7 Standard 700 tactile 6,5\", 24 V DC", { "Écran": "6,5\" tactile", "Alimentation": "24 V DC" }],
      ["2711P-T10C22D8S", "PanelView Plus 7 Standard 1000 tactile 10,4\", 24 V DC", { "Écran": "10,4\" tactile", "Alimentation": "24 V DC" }],
      ["2711P-T12W22D8S", "PanelView Plus 7 Standard 1200W tactile large 12,1\", 24 V DC", { "Écran": "12,1\" large tactile", "Alimentation": "24 V DC" }],
      ["2711P-T15C22D8S", "PanelView Plus 7 Standard 1500 tactile 15\", 24 V DC", { "Écran": "15\" tactile", "Alimentation": "24 V DC" }],
      ["2711P-T7C22D9P", "PanelView Plus 7 Performance 700 tactile 6,5\", 24 V DC", { "Écran": "6,5\" tactile", "Alimentation": "24 V DC" }],
      ["2711P-T10C22D9P", "PanelView Plus 7 Performance 1000 tactile 10,4\", 24 V DC", { "Écran": "10,4\" tactile", "Alimentation": "24 V DC" }],
      ["2711P-T12W22D9P", "PanelView Plus 7 Performance 1200W tactile large 12,1\", 24 V DC", { "Écran": "12,1\" large tactile", "Alimentation": "24 V DC" }],
      ["2711P-T15C22D9P", "PanelView Plus 7 Performance 1500 tactile 15\", 24 V DC", { "Écran": "15\" tactile", "Alimentation": "24 V DC" }],
    ],
  ),
  ...family(
    { ...base, category: "IHM et pupitres", status: "active", confidence: 70,
      describe: (name) => `${name}, terminal opérateur PanelView 800 (Allen-Bradley) pour micro et petits automates.` },
    [
      ["2711R-T4T", "PanelView 800 4,3\" tactile", { "Écran": "4,3\" tactile" }],
      ["2711R-T7T", "PanelView 800 7\" tactile", { "Écran": "7\" tactile" }],
      ["2711R-T10T", "PanelView 800 10,4\" tactile", { "Écran": "10,4\" tactile" }],
    ],
  ),
  ...family(
    { ...base, category: "IHM et pupitres", status: "obsolete", confidence: 60,
      describe: (name) => `${name}. PanelView Component arrêté : remplacement par le PanelView 800 de taille équivalente.` },
    [
      ["2711C-T6C", "PanelView Component C600 5,7\" tactile couleur", { "Écran": "5,7\" tactile" }, { by: "2711R-T7T" }],
      ["2711C-T10C", "PanelView Component C1000 10,4\" tactile couleur", { "Écran": "10,4\" tactile" }, { by: "2711R-T10T" }],
    ],
  ),

  // ── POINT I/O ──────────────────────────────────────────────────────────────
  ...family(
    { ...base, category: "Modules d'E/S déportées", status: "active", confidence: 70,
      describe: (name) => `${name}, module POINT I/O 1734 (Allen-Bradley) pour E/S déportées au plus près de la machine.` },
    [
      ["1734-AENTR", "Adaptateur EtherNet/IP POINT I/O 2 ports (anneau DLR)", { "Interface": "EtherNet/IP 2 ports" }],
      ["1734-AENT", "Adaptateur EtherNet/IP POINT I/O", { "Interface": "EtherNet/IP" }],
      ["1734-IB4", "Module 4 entrées TOR 24 V DC", { "Voies": "4 DI" }],
      ["1734-IB8", "Module 8 entrées TOR 24 V DC", { "Voies": "8 DI" }],
      ["1734-OB4E", "Module 4 sorties TOR 24 V DC à protection électronique", { "Voies": "4 DO" }],
      ["1734-OB8", "Module 8 sorties TOR 24 V DC", { "Voies": "8 DO" }],
      ["1734-OW4", "Module 4 sorties relais", { "Voies": "4 DO relais" }],
      ["1734-IE2C", "Module 2 entrées analogiques courant", { "Voies": "2 AI" }],
      ["1734-IE4C", "Module 4 entrées analogiques courant", { "Voies": "4 AI" }],
      ["1734-OE2C", "Module 2 sorties analogiques courant", { "Voies": "2 AO" }],
      ["1734-OE2V", "Module 2 sorties analogiques tension", { "Voies": "2 AO" }],
      ["1734-IR2", "Module 2 entrées RTD", { "Voies": "2 RTD" }],
      ["1734-TB", "Embase de câblage POINT I/O à vis", null],
      ["1734-FPD", "Module de distribution du potentiel de terrain", null],
      ["1734-EP24DC", "Module d'extension d'alimentation 24 V DC", null],
    ],
  ),
];
