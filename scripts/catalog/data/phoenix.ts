import { family, type Row } from "../lib";

const base = { manufacturer: "Phoenix Contact", industry: "industrie" } as const;

/** Phoenix Contact référence ses articles par un numéro à 7 chiffres ; la désignation devient une cross-référence. */
function items(rows: [item: string, designation: string, name: string, attributes?: Record<string, string> | null, by?: string][]): Row[] {
  return rows.map(([item, designation, name, attributes, by]) => [item, name, attributes ?? null, { oem: [designation], ...(by ? { by } : {}) }]);
}

export const phoenix = [
  // ── Alimentations QUINT4, TRIO, UNO ────────────────────────────────────────
  ...family(
    { ...base, category: "Alimentations industrielles", status: "active", confidence: 70,
      describe: (name) => `${name}. Alimentation rail DIN QUINT POWER 4e génération, réserve de puissance et technologie SFB pour le déclenchement sélectif des disjoncteurs.` },
    items([
      ["2904600", "QUINT4-PS/1AC/24DC/5", "Alimentation QUINT4-PS/1AC/24DC/5", { "Entrée": "1 ph 100-240 V AC", "Sortie": "24 V DC / 5 A" }],
      ["2904602", "QUINT4-PS/1AC/24DC/20", "Alimentation QUINT4-PS/1AC/24DC/20", { "Entrée": "1 ph 100-240 V AC", "Sortie": "24 V DC / 20 A" }],
      ["2904603", "QUINT4-PS/1AC/24DC/40", "Alimentation QUINT4-PS/1AC/24DC/40", { "Entrée": "1 ph 100-240 V AC", "Sortie": "24 V DC / 40 A" }],
      ["2904620", "QUINT4-PS/3AC/24DC/5", "Alimentation QUINT4-PS/3AC/24DC/5", { "Entrée": "3 ph 400-500 V AC", "Sortie": "24 V DC / 5 A" }],
      ["2904622", "QUINT4-PS/3AC/24DC/20", "Alimentation QUINT4-PS/3AC/24DC/20", { "Entrée": "3 ph 400-500 V AC", "Sortie": "24 V DC / 20 A" }],
      ["2904623", "QUINT4-PS/3AC/24DC/40", "Alimentation QUINT4-PS/3AC/24DC/40", { "Entrée": "3 ph 400-500 V AC", "Sortie": "24 V DC / 40 A" }],
    ]),
  ),
  ...family(
    { ...base, category: "Alimentations industrielles", status: "obsolete", confidence: 70,
      describe: (name) => `${name}. Ancienne génération QUINT POWER arrêtée : Phoenix Contact la remplace par la QUINT4 de même courant.` },
    items([
      ["2866750", "QUINT-PS/1AC/24DC/5", "Alimentation QUINT-PS/1AC/24DC/5", { "Sortie": "24 V DC / 5 A" }, "2904600"],
      ["2866776", "QUINT-PS/1AC/24DC/20", "Alimentation QUINT-PS/1AC/24DC/20", { "Sortie": "24 V DC / 20 A" }, "2904602"],
      ["2866789", "QUINT-PS/1AC/24DC/40", "Alimentation QUINT-PS/1AC/24DC/40", { "Sortie": "24 V DC / 40 A" }, "2904603"],
    ]),
  ),
  ...family(
    { ...base, category: "Alimentations industrielles", status: "obsolete", confidence: 60,
      describe: (name) => `${name}. Première génération QUINT POWER arrêtée, remplacée par la génération suivante.` },
    items([["2938604", "QUINT-PS-100-240AC/24DC/10", "Alimentation QUINT-PS-100-240AC/24DC/10", { "Sortie": "24 V DC / 10 A" }, "2866763"]]),
  ),
  ...family(
    { ...base, category: "Alimentations industrielles", status: "active", confidence: 65,
      describe: (name) => `${name}, alimentation rail DIN Phoenix Contact.` },
    items([
      ["2903148", "TRIO-PS-2G/1AC/24DC/5", "Alimentation TRIO-PS-2G/1AC/24DC/5", { "Sortie": "24 V DC / 5 A" }],
      ["2903149", "TRIO-PS-2G/1AC/24DC/10", "Alimentation TRIO-PS-2G/1AC/24DC/10", { "Sortie": "24 V DC / 10 A" }],
      ["2902991", "UNO-PS/1AC/24DC/30W", "Alimentation UNO-PS/1AC/24DC/30W", { "Sortie": "24 V DC / 1,25 A (30 W)" }],
      ["2902993", "UNO-PS/1AC/24DC/100W", "Alimentation UNO-PS/1AC/24DC/100W", { "Sortie": "24 V DC / 4,2 A (100 W)" }],
    ]),
  ),

  // ── Bornes sur rail ────────────────────────────────────────────────────────
  ...family(
    { ...base, category: "Bornes et connectique", status: "active", confidence: 75,
      describe: (name) => `${name}, borne pour rail DIN NS 35 Phoenix Contact.` },
    items([
      ["3044076", "UT 2,5", "Borne de passage à vis UT 2,5", { "Section": "2,5 mm²", "Raccordement": "vis" }],
      ["3044102", "UT 4", "Borne de passage à vis UT 4", { "Section": "4 mm²", "Raccordement": "vis" }],
      ["3044131", "UT 6", "Borne de passage à vis UT 6", { "Section": "6 mm²", "Raccordement": "vis" }],
      ["3044160", "UT 10", "Borne de passage à vis UT 10", { "Section": "10 mm²", "Raccordement": "vis" }],
      ["3044092", "UT 2,5-PE", "Borne de protection à vis UT 2,5-PE", { "Section": "2,5 mm²", "Raccordement": "vis" }],
      ["3044128", "UT 4-PE", "Borne de protection à vis UT 4-PE", { "Section": "4 mm²", "Raccordement": "vis" }],
      ["3047028", "D-UT 2,5/10", "Flasque d'extrémité D-UT 2,5/10", null],
      ["3209510", "PT 2,5", "Borne de passage Push-in PT 2,5", { "Section": "2,5 mm²", "Raccordement": "Push-in" }],
      ["3211757", "PT 4", "Borne de passage Push-in PT 4", { "Section": "4 mm²", "Raccordement": "Push-in" }],
      ["3209523", "PT 2,5-PE", "Borne de protection Push-in PT 2,5-PE", { "Section": "2,5 mm²", "Raccordement": "Push-in" }],
      ["3031212", "ST 2,5", "Borne de passage à ressort ST 2,5", { "Section": "2,5 mm²", "Raccordement": "ressort" }],
      ["3031364", "ST 4", "Borne de passage à ressort ST 4", { "Section": "4 mm²", "Raccordement": "ressort" }],
      ["3031238", "ST 2,5-PE", "Borne de protection à ressort ST 2,5-PE", { "Section": "2,5 mm²", "Raccordement": "ressort" }],
      ["3004362", "UK 5 N", "Borne de passage à vis UK 5 N", { "Section": "4 mm²", "Raccordement": "vis" }],
      ["3003347", "UK 2,5 N", "Borne de passage à vis UK 2,5 N", { "Section": "2,5 mm²", "Raccordement": "vis" }],
      ["0441504", "USLKG 5", "Borne de protection à vis USLKG 5", { "Section": "4 mm²", "Raccordement": "vis" }],
      ["3030161", "FBS 2-5", "Pont enfichable FBS 2-5, 2 pôles", null],
      ["1201442", "E/UK", "Butée d'arrêt E/UK", null],
      ["3022218", "CLIPFIX 35", "Butée d'arrêt rapide CLIPFIX 35", null],
    ]),
  ),

  // ── Relais d'interface ─────────────────────────────────────────────────────
  ...family(
    { ...base, category: "Contacteurs et relais", status: "active", confidence: 70,
      describe: (name) => `${name}, module relais d'interface pour rail DIN.` },
    items([
      ["2966171", "PLC-RSC- 24DC/21", "Relais PLC-RSC- 24DC/21, 1 inverseur", { "Contacts": "1 inverseur 6 A", "Bobine": "24 V DC" }],
      ["2966207", "PLC-RSC- 230UC/21", "Relais PLC-RSC- 230UC/21, 1 inverseur", { "Contacts": "1 inverseur 6 A", "Bobine": "230 V AC/DC" }],
      ["2903370", "RIF-0-RPT-24DC/21", "Relais RIF-0-RPT-24DC/21, 1 inverseur", { "Contacts": "1 inverseur 6 A", "Bobine": "24 V DC" }],
    ]),
  ),

  // ── Commutateurs Ethernet industriels ──────────────────────────────────────
  ...family(
    { ...base, category: "Commutateurs réseau", status: "unknown", confidence: 60,
      describe: (name) => `${name}, commutateur Ethernet industriel non administrable pour rail DIN.` },
    items([
      ["2891152", "FL SWITCH SFN 5TX", "Commutateur FL SWITCH SFN 5TX, 5 ports", { "Ports": "5 x RJ45 10/100" }],
      ["2891929", "FL SWITCH SFN 8TX", "Commutateur FL SWITCH SFN 8TX, 8 ports", { "Ports": "8 x RJ45 10/100" }],
    ]),
  ),
];
