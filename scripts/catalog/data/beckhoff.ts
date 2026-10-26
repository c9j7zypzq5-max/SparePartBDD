import { family } from "../lib";

const base = { manufacturer: "Beckhoff", industry: "industrie" } as const;

export const beckhoff = [
  // ── Borniers EtherCAT ──────────────────────────────────────────────────────
  ...family(
    { ...base, category: "Modules d'E/S déportées", status: "active", confidence: 80,
      describe: (name) => `${name}, borne EtherCAT pour rail DIN (système de bornes E/S Beckhoff, TwinCAT).` },
    [
      ["EK1100", "Coupleur EtherCAT", { "Interface": "EtherCAT" }],
      ["EL1008", "Borne 8 entrées TOR 24 V DC", { "Voies": "8 DI" }],
      ["EL1018", "Borne 8 entrées TOR 24 V DC, filtre 10 µs", { "Voies": "8 DI" }],
      ["EL1809", "Borne 16 entrées TOR 24 V DC", { "Voies": "16 DI" }],
      ["EL2008", "Borne 8 sorties TOR 24 V DC 0,5 A", { "Voies": "8 DO" }],
      ["EL2809", "Borne 16 sorties TOR 24 V DC 0,5 A", { "Voies": "16 DO" }],
      ["EL2624", "Borne 4 sorties relais", { "Voies": "4 DO relais" }],
      ["EL3002", "Borne 2 entrées analogiques ±10 V", { "Voies": "2 AI" }],
      ["EL3004", "Borne 4 entrées analogiques ±10 V", { "Voies": "4 AI" }],
      ["EL3008", "Borne 8 entrées analogiques ±10 V", { "Voies": "8 AI" }],
      ["EL3052", "Borne 2 entrées analogiques 4-20 mA", { "Voies": "2 AI" }],
      ["EL3054", "Borne 4 entrées analogiques 4-20 mA", { "Voies": "4 AI" }],
      ["EL3062", "Borne 2 entrées analogiques 0-10 V", { "Voies": "2 AI" }],
      ["EL3064", "Borne 4 entrées analogiques 0-10 V", { "Voies": "4 AI" }],
      ["EL3202", "Borne 2 entrées RTD (Pt100)", { "Voies": "2 RTD" }],
      ["EL3204", "Borne 4 entrées RTD (Pt100)", { "Voies": "4 RTD" }],
      ["EL3314", "Borne 4 entrées thermocouple", { "Voies": "4 TC" }],
      ["EL4002", "Borne 2 sorties analogiques 0-10 V", { "Voies": "2 AO" }],
      ["EL4004", "Borne 4 sorties analogiques 0-10 V", { "Voies": "4 AO" }],
      ["EL4022", "Borne 2 sorties analogiques 4-20 mA", { "Voies": "2 AO" }],
      ["EL6001", "Borne de communication série RS-232", { "Interface": "RS-232" }],
      ["EL6021", "Borne de communication série RS-422/485", { "Interface": "RS-422/485" }],
      ["EL9011", "Embout de terminaison", null],
      ["EL9100", "Borne d'alimentation de potentiel 24 V DC", null],
      ["EL9410", "Borne d'alimentation E-bus", null],
    ],
  ),
  ...family(
    { ...base, category: "Modules d'E/S déportées", status: "active", confidence: 65,
      describe: (name) => `${name}, borne de bus (K-bus) du système de bornes E/S Beckhoff.` },
    [
      ["KL1408", "Borne K-bus 8 entrées TOR 24 V DC", { "Voies": "8 DI" }],
      ["KL2408", "Borne K-bus 8 sorties TOR 24 V DC 0,5 A", { "Voies": "8 DO" }],
      ["KL9010", "Borne de fin de bus K-bus", null],
    ],
  ),

  // ── PC embarqués ───────────────────────────────────────────────────────────
  ...family(
    { ...base, category: "Automates programmables", status: "active", confidence: 60,
      describe: (name) => `${name}, PC embarqué Beckhoff pour rail DIN, automatisme TwinCAT.` },
    [
      ["CX5130", "PC embarqué CX5130 (Intel Atom 2 cœurs)", { "Processeur": "Intel Atom 2 cœurs" }],
      ["CX5140", "PC embarqué CX5140 (Intel Atom 4 cœurs)", { "Processeur": "Intel Atom 4 cœurs" }],
      ["CX9020", "PC embarqué CX9020 (ARM Cortex-A8)", { "Processeur": "ARM Cortex-A8" }],
      ["CX8190", "PC embarqué CX8190 (ARM, Ethernet)", { "Processeur": "ARM Cortex-A9" }],
    ],
  ),

  // ── Servovariateurs AX5000 ─────────────────────────────────────────────────
  ...family(
    { ...base, category: "Servovariateurs et servomoteurs", status: "active", confidence: 65,
      describe: (name) => `${name}, servovariateur numérique AX5000 EtherCAT.` },
    [
      ["AX5101", "Servovariateur AX5000 1 axe 1,5 A", { "Axes": "1", "Courant nominal": "1,5 A" }],
      ["AX5103", "Servovariateur AX5000 1 axe 3 A", { "Axes": "1", "Courant nominal": "3 A" }],
      ["AX5106", "Servovariateur AX5000 1 axe 6 A", { "Axes": "1", "Courant nominal": "6 A" }],
      ["AX5112", "Servovariateur AX5000 1 axe 12 A", { "Axes": "1", "Courant nominal": "12 A" }],
      ["AX5118", "Servovariateur AX5000 1 axe 18 A", { "Axes": "1", "Courant nominal": "18 A" }],
      ["AX5201", "Servovariateur AX5000 2 axes 1,5 A", { "Axes": "2", "Courant nominal": "1,5 A par axe" }],
      ["AX5203", "Servovariateur AX5000 2 axes 3 A", { "Axes": "2", "Courant nominal": "3 A par axe" }],
      ["AX5206", "Servovariateur AX5000 2 axes 6 A", { "Axes": "2", "Courant nominal": "6 A par axe" }],
    ],
  ),
];
