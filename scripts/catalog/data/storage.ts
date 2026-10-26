import { family, type Row } from "../lib";

const it = { industry: "informatique" } as const;
const synology = { ...it, manufacturer: "Synology", category: "NAS et stockage réseau" } as const;
const seagate = { ...it, manufacturer: "Seagate", category: "SSD et disques durs" } as const;
const wd = { ...it, manufacturer: "Western Digital", category: "SSD et disques durs" } as const;
const samsung = { ...it, manufacturer: "Samsung", category: "SSD et disques durs" } as const;
const kingston = { ...it, manufacturer: "Kingston", category: "SSD et disques durs" } as const;
const crucial = { ...it, manufacturer: "Crucial", category: "SSD et disques durs" } as const;

/** Lignes simples : [référence, nom, attributs, remplacement éventuel]. */
function rows(list: [string, string, Record<string, string> | null, string?][]): Row[] {
  return list.map(([ref, name, attributes, by]) => [ref, name, attributes, by ? { by } : undefined]);
}

/** SSD Samsung grand public : la référence européenne (/EU) porte la référence mondiale (BW) en cross-référence. */
function samsungEu(list: [string, string, Record<string, string>, string?][]): Row[] {
  return list.map(([ref, name, attributes, by]) => [ref, name, attributes, { oem: [ref.replace("B/EU", "BW")], ...(by ? { by } : {}) }]);
}

export const storage = [
  // ── Synology ───────────────────────────────────────────────────────────────
  ...family(
    { ...synology, status: "active", confidence: 60,
      describe: (name) => `${name}, serveur NAS Synology sous DSM.` },
    rows([
      ["DS225+", "NAS Synology DiskStation DS225+, 2 baies", { "Baies": "2" }],
      ["DS425+", "NAS Synology DiskStation DS425+, 4 baies", { "Baies": "4" }],
      ["DS925+", "NAS Synology DiskStation DS925+, 4 baies", { "Baies": "4" }],
    ]),
  ),
  ...family(
    { ...synology, status: "unknown", confidence: 65,
      describe: (name) => `${name}, serveur NAS Synology sous DSM.` },
    rows([
      ["DS224+", "NAS Synology DiskStation DS224+, 2 baies", { "Baies": "2" }],
      ["DS423+", "NAS Synology DiskStation DS423+, 4 baies", { "Baies": "4" }],
      ["DS723+", "NAS Synology DiskStation DS723+, 2 baies", { "Baies": "2" }],
      ["DS923+", "NAS Synology DiskStation DS923+, 4 baies", { "Baies": "4" }],
      ["DS1522+", "NAS Synology DiskStation DS1522+, 5 baies", { "Baies": "5" }],
      ["DS1621+", "NAS Synology DiskStation DS1621+, 6 baies", { "Baies": "6" }],
      ["DS1821+", "NAS Synology DiskStation DS1821+, 8 baies", { "Baies": "8" }],
      ["DS223j", "NAS Synology DiskStation DS223j, 2 baies", { "Baies": "2" }],
      ["DS124", "NAS Synology DiskStation DS124, 1 baie", { "Baies": "1" }],
      ["RS822+", "NAS Synology RackStation RS822+, 4 baies, rack 1U", { "Baies": "4" }],
      ["RS1221+", "NAS Synology RackStation RS1221+, 8 baies, rack 2U", { "Baies": "8" }],
    ]),
  ),
  ...family(
    { ...synology, status: "obsolete", confidence: 70,
      describe: (name) => `${name}. Modèle arrêté : Synology le remplace par le modèle de la génération suivante.` },
    rows([
      ["DS220+", "NAS Synology DiskStation DS220+, 2 baies", { "Baies": "2" }, "DS224+"],
      ["DS420+", "NAS Synology DiskStation DS420+, 4 baies", { "Baies": "4" }, "DS423+"],
      ["DS720+", "NAS Synology DiskStation DS720+, 2 baies", { "Baies": "2" }, "DS723+"],
      ["DS920+", "NAS Synology DiskStation DS920+, 4 baies", { "Baies": "4" }, "DS923+"],
      ["DS1520+", "NAS Synology DiskStation DS1520+, 5 baies", { "Baies": "5" }, "DS1522+"],
      ["DS218+", "NAS Synology DiskStation DS218+, 2 baies", { "Baies": "2" }, "DS220+"],
      ["DS718+", "NAS Synology DiskStation DS718+, 2 baies", { "Baies": "2" }, "DS720+"],
      ["DS918+", "NAS Synology DiskStation DS918+, 4 baies", { "Baies": "4" }, "DS920+"],
      ["DS1019+", "NAS Synology DiskStation DS1019+, 5 baies", { "Baies": "5" }, "DS1520+"],
      ["DS1618+", "NAS Synology DiskStation DS1618+, 6 baies", { "Baies": "6" }, "DS1621+"],
      ["DS1819+", "NAS Synology DiskStation DS1819+, 8 baies", { "Baies": "8" }, "DS1821+"],
      ["DS220j", "NAS Synology DiskStation DS220j, 2 baies", { "Baies": "2" }, "DS223j"],
      ["DS118", "NAS Synology DiskStation DS118, 1 baie", { "Baies": "1" }, "DS124"],
      ["RS820+", "NAS Synology RackStation RS820+, 4 baies, rack 1U", { "Baies": "4" }, "RS822+"],
    ]),
  ),

  // ── Seagate ────────────────────────────────────────────────────────────────
  ...family(
    { ...seagate, status: "active", confidence: 60,
      describe: (name) => `${name}, disque dur 3,5" SATA 6 Gbit/s Seagate.` },
    rows([
      ["ST1000DM010", "Disque dur BarraCuda 1 To", { "Capacité": "1 To", "Gamme": "BarraCuda (bureautique)" }],
      ["ST2000DM008", "Disque dur BarraCuda 2 To", { "Capacité": "2 To", "Gamme": "BarraCuda (bureautique)" }],
      ["ST4000DM004", "Disque dur BarraCuda 4 To", { "Capacité": "4 To", "Gamme": "BarraCuda (bureautique)" }],
      ["ST8000DM004", "Disque dur BarraCuda 8 To", { "Capacité": "8 To", "Gamme": "BarraCuda (bureautique)" }],
      ["ST4000VN006", "Disque dur IronWolf 4 To", { "Capacité": "4 To", "Gamme": "IronWolf (NAS)" }],
      ["ST8000VN004", "Disque dur IronWolf 8 To", { "Capacité": "8 To", "Gamme": "IronWolf (NAS)" }],
      ["ST12000VN0008", "Disque dur IronWolf 12 To", { "Capacité": "12 To", "Gamme": "IronWolf (NAS)" }],
      ["ST4000NE001", "Disque dur IronWolf Pro 4 To", { "Capacité": "4 To", "Gamme": "IronWolf Pro (NAS professionnel)" }],
      ["ST8000NE001", "Disque dur IronWolf Pro 8 To", { "Capacité": "8 To", "Gamme": "IronWolf Pro (NAS professionnel)" }],
      ["ST12000NE0008", "Disque dur IronWolf Pro 12 To", { "Capacité": "12 To", "Gamme": "IronWolf Pro (NAS professionnel)" }],
      ["ST16000NE000", "Disque dur IronWolf Pro 16 To", { "Capacité": "16 To", "Gamme": "IronWolf Pro (NAS professionnel)" }],
      ["ST20000NM007D", "Disque dur Exos X20 20 To", { "Capacité": "20 To", "Gamme": "Exos (centre de données)" }],
    ]),
  ),
  ...family(
    { ...seagate, status: "unknown", confidence: 65,
      describe: (name) => `${name}, disque dur 3,5" Seagate Exos pour centres de données.` },
    rows([
      ["ST12000NM001G", "Disque dur Exos X16 12 To", { "Capacité": "12 To", "Gamme": "Exos X16" }],
      ["ST14000NM001G", "Disque dur Exos X16 14 To", { "Capacité": "14 To", "Gamme": "Exos X16" }],
      ["ST16000NM001G", "Disque dur Exos X16 16 To", { "Capacité": "16 To", "Gamme": "Exos X16" }],
      ["ST18000NM000J", "Disque dur Exos X18 18 To", { "Capacité": "18 To", "Gamme": "Exos X18" }],
    ]),
  ),
  ...family(
    { ...seagate, status: "obsolete", confidence: 65,
      describe: (name) => `${name}. Modèle arrêté, remplacé par la référence actuelle de même capacité.` },
    rows([
      ["ST1000DM003", "Disque dur Barracuda 1 To (ancienne génération)", { "Capacité": "1 To" }, "ST1000DM010"],
      ["ST2000DM001", "Disque dur Barracuda 2 To (ancienne génération)", { "Capacité": "2 To" }, "ST2000DM008"],
      ["ST3000DM001", "Disque dur Barracuda 3 To (ancienne génération)", { "Capacité": "3 To" }],
      ["ST4000VN008", "Disque dur IronWolf 4 To (ancienne génération)", { "Capacité": "4 To" }, "ST4000VN006"],
    ]),
  ),

  // ── Western Digital ────────────────────────────────────────────────────────
  ...family(
    { ...wd, status: "active", confidence: 60,
      describe: (name) => `${name}, disque dur 3,5" SATA Western Digital.` },
    rows([
      ["WD20EFPX", "Disque dur WD Red Plus 2 To", { "Capacité": "2 To", "Gamme": "Red Plus (NAS)" }],
      ["WD40EFPX", "Disque dur WD Red Plus 4 To", { "Capacité": "4 To", "Gamme": "Red Plus (NAS)" }],
      ["WD60EFPX", "Disque dur WD Red Plus 6 To", { "Capacité": "6 To", "Gamme": "Red Plus (NAS)" }],
      ["WD101EFBX", "Disque dur WD Red Plus 10 To", { "Capacité": "10 To", "Gamme": "Red Plus (NAS)" }],
      ["WD120EFBX", "Disque dur WD Red Plus 12 To", { "Capacité": "12 To", "Gamme": "Red Plus (NAS)" }],
      ["WD10PURZ", "Disque dur WD Purple 1 To", { "Capacité": "1 To", "Gamme": "Purple (vidéosurveillance)" }],
      ["WD20PURZ", "Disque dur WD Purple 2 To", { "Capacité": "2 To", "Gamme": "Purple (vidéosurveillance)" }],
      ["WD40PURZ", "Disque dur WD Purple 4 To", { "Capacité": "4 To", "Gamme": "Purple (vidéosurveillance)" }],
      ["WD80PURZ", "Disque dur WD Purple 8 To", { "Capacité": "8 To", "Gamme": "Purple (vidéosurveillance)" }],
    ]),
  ),
  ...family(
    { ...wd, status: "unknown", confidence: 65,
      describe: (name) => `${name}, disque dur 3,5" SATA Western Digital.` },
    rows([
      ["WD4003FFBX", "Disque dur WD Red Pro 4 To", { "Capacité": "4 To", "Gamme": "Red Pro (NAS professionnel)" }],
      ["WD8003FFBX", "Disque dur WD Red Pro 8 To", { "Capacité": "8 To", "Gamme": "Red Pro (NAS professionnel)" }],
      ["WD121KFBX", "Disque dur WD Red Pro 12 To", { "Capacité": "12 To", "Gamme": "Red Pro (NAS professionnel)" }],
      ["WD141KFGX", "Disque dur WD Red Pro 14 To", { "Capacité": "14 To", "Gamme": "Red Pro (NAS professionnel)" }],
      ["WD161KFGX", "Disque dur WD Red Pro 16 To", { "Capacité": "16 To", "Gamme": "Red Pro (NAS professionnel)" }],
      ["WD10EZEX", "Disque dur WD Blue 1 To 7200 tr/min", { "Capacité": "1 To", "Gamme": "Blue (bureautique)" }],
      ["WD1003FZEX", "Disque dur WD Black 1 To", { "Capacité": "1 To", "Gamme": "Black (performance)" }],
      ["WD2003FZEX", "Disque dur WD Black 2 To", { "Capacité": "2 To", "Gamme": "Black (performance)" }],
      ["WD4005FZBX", "Disque dur WD Black 4 To", { "Capacité": "4 To", "Gamme": "Black (performance)" }],
      ["WD6003FZBX", "Disque dur WD Black 6 To", { "Capacité": "6 To", "Gamme": "Black (performance)" }],
    ]),
  ),
  ...family(
    { ...wd, status: "obsolete", confidence: 65,
      describe: (name) => `${name}. Modèle arrêté, remplacé par la référence actuelle de même capacité.` },
    rows([
      ["WD20EFRX", "Disque dur WD Red 2 To (CMR, 64 Mo)", { "Capacité": "2 To" }, "WD20EFPX"],
      ["WD30EFRX", "Disque dur WD Red 3 To (CMR, 64 Mo)", { "Capacité": "3 To" }],
      ["WD40EFRX", "Disque dur WD Red 4 To (CMR, 64 Mo)", { "Capacité": "4 To" }, "WD40EFPX"],
      ["WD60EFRX", "Disque dur WD Red 6 To (CMR, 64 Mo)", { "Capacité": "6 To" }, "WD60EFPX"],
      ["WD10PURX", "Disque dur WD Purple 1 To (ancienne génération)", { "Capacité": "1 To" }, "WD10PURZ"],
      ["WD40PURX", "Disque dur WD Purple 4 To (ancienne génération)", { "Capacité": "4 To" }, "WD40PURZ"],
    ]),
  ),
  ...family(
    { ...wd, status: "active", confidence: 60,
      describe: (name) => `${name}, SSD NVMe M.2 2280 WD_BLACK / WD Blue.` },
    rows([
      ["WDS100T2X0E", "SSD WD_BLACK SN850X 1 To NVMe PCIe 4.0", { "Capacité": "1 To", "Interface": "PCIe 4.0 x4 NVMe" }],
      ["WDS200T2X0E", "SSD WD_BLACK SN850X 2 To NVMe PCIe 4.0", { "Capacité": "2 To", "Interface": "PCIe 4.0 x4 NVMe" }],
      ["WDS400T2X0E", "SSD WD_BLACK SN850X 4 To NVMe PCIe 4.0", { "Capacité": "4 To", "Interface": "PCIe 4.0 x4 NVMe" }],
      ["WDS100T3X0E", "SSD WD_BLACK SN770 1 To NVMe PCIe 4.0", { "Capacité": "1 To", "Interface": "PCIe 4.0 x4 NVMe" }],
      ["WDS200T3X0E", "SSD WD_BLACK SN770 2 To NVMe PCIe 4.0", { "Capacité": "2 To", "Interface": "PCIe 4.0 x4 NVMe" }],
      ["WDS100T3B0E", "SSD WD Blue SN580 1 To NVMe PCIe 4.0", { "Capacité": "1 To", "Interface": "PCIe 4.0 x4 NVMe" }],
    ]),
  ),
  ...family(
    { ...wd, status: "obsolete", confidence: 60,
      describe: (name) => `${name}. SSD de génération précédente arrêté, remplacé par son successeur de même capacité.` },
    rows([
      ["WDS100T1X0E", "SSD WD_BLACK SN850 1 To NVMe PCIe 4.0", { "Capacité": "1 To" }, "WDS100T2X0E"],
      ["WDS200T1X0E", "SSD WD_BLACK SN850 2 To NVMe PCIe 4.0", { "Capacité": "2 To" }, "WDS200T2X0E"],
      ["WDS100T3B0C", "SSD WD Blue SN570 1 To NVMe PCIe 3.0", { "Capacité": "1 To" }, "WDS100T3B0E"],
      ["WDS500G2B0C", "SSD WD Blue SN550 500 Go NVMe PCIe 3.0", { "Capacité": "500 Go" }],
      ["WDS100T2B0C", "SSD WD Blue SN550 1 To NVMe PCIe 3.0", { "Capacité": "1 To" }, "WDS100T3B0C"],
    ]),
  ),

  // ── Samsung ────────────────────────────────────────────────────────────────
  ...family(
    { ...samsung, status: "active", confidence: 65,
      describe: (name) => `${name}, SSD SATA 2,5" Samsung.` },
    samsungEu([
      ["MZ-77E250B/EU", "SSD Samsung 870 EVO 250 Go SATA", { "Capacité": "250 Go", "Interface": "SATA 6 Gbit/s" }],
      ["MZ-77E500B/EU", "SSD Samsung 870 EVO 500 Go SATA", { "Capacité": "500 Go", "Interface": "SATA 6 Gbit/s" }],
      ["MZ-77E1T0B/EU", "SSD Samsung 870 EVO 1 To SATA", { "Capacité": "1 To", "Interface": "SATA 6 Gbit/s" }],
      ["MZ-77E2T0B/EU", "SSD Samsung 870 EVO 2 To SATA", { "Capacité": "2 To", "Interface": "SATA 6 Gbit/s" }],
      ["MZ-77E4T0B/EU", "SSD Samsung 870 EVO 4 To SATA", { "Capacité": "4 To", "Interface": "SATA 6 Gbit/s" }],
      ["MZ-77Q1T0B/EU", "SSD Samsung 870 QVO 1 To SATA", { "Capacité": "1 To", "Interface": "SATA 6 Gbit/s" }],
      ["MZ-77Q2T0B/EU", "SSD Samsung 870 QVO 2 To SATA", { "Capacité": "2 To", "Interface": "SATA 6 Gbit/s" }],
      ["MZ-77Q4T0B/EU", "SSD Samsung 870 QVO 4 To SATA", { "Capacité": "4 To", "Interface": "SATA 6 Gbit/s" }],
    ]),
  ),
  ...family(
    { ...samsung, status: "obsolete", confidence: 75,
      describe: (name) => `${name}. SSD SATA Samsung de génération précédente, remplacé par la génération suivante de même capacité.` },
    samsungEu([
      ["MZ-76E250B/EU", "SSD Samsung 860 EVO 250 Go SATA", { "Capacité": "250 Go" }, "MZ-77E250B/EU"],
      ["MZ-76E500B/EU", "SSD Samsung 860 EVO 500 Go SATA", { "Capacité": "500 Go" }, "MZ-77E500B/EU"],
      ["MZ-76E1T0B/EU", "SSD Samsung 860 EVO 1 To SATA", { "Capacité": "1 To" }, "MZ-77E1T0B/EU"],
      ["MZ-75E250B/EU", "SSD Samsung 850 EVO 250 Go SATA", { "Capacité": "250 Go" }, "MZ-76E250B/EU"],
      ["MZ-75E500B/EU", "SSD Samsung 850 EVO 500 Go SATA", { "Capacité": "500 Go" }, "MZ-76E500B/EU"],
      ["MZ-75E1T0B/EU", "SSD Samsung 850 EVO 1 To SATA", { "Capacité": "1 To" }, "MZ-76E1T0B/EU"],
      ["MZ-76Q1T0B/EU", "SSD Samsung 860 QVO 1 To SATA", { "Capacité": "1 To" }, "MZ-77Q1T0B/EU"],
    ]),
  ),
  ...family(
    { ...samsung, status: "active", confidence: 65,
      describe: (name) => `${name}, SSD NVMe M.2 2280 Samsung.` },
    rows([
      ["MZ-V9P1T0BW", "SSD Samsung 990 PRO 1 To NVMe PCIe 4.0", { "Capacité": "1 To", "Interface": "PCIe 4.0 x4 NVMe" }],
      ["MZ-V9P2T0BW", "SSD Samsung 990 PRO 2 To NVMe PCIe 4.0", { "Capacité": "2 To", "Interface": "PCIe 4.0 x4 NVMe" }],
      ["MZ-V9P4T0BW", "SSD Samsung 990 PRO 4 To NVMe PCIe 4.0", { "Capacité": "4 To", "Interface": "PCIe 4.0 x4 NVMe" }],
      ["MZ-V9E1T0BW", "SSD Samsung 990 EVO 1 To NVMe", { "Capacité": "1 To", "Interface": "PCIe 4.0 x4 / 5.0 x2 NVMe" }],
      ["MZ-V9E2T0BW", "SSD Samsung 990 EVO 2 To NVMe", { "Capacité": "2 To", "Interface": "PCIe 4.0 x4 / 5.0 x2 NVMe" }],
    ]),
  ),
  ...family(
    { ...samsung, status: "unknown", confidence: 65,
      describe: (name) => `${name}, SSD NVMe M.2 2280 Samsung.` },
    rows([
      ["MZ-V7S250BW", "SSD Samsung 970 EVO Plus 250 Go NVMe PCIe 3.0", { "Capacité": "250 Go", "Interface": "PCIe 3.0 x4 NVMe" }],
      ["MZ-V7S500BW", "SSD Samsung 970 EVO Plus 500 Go NVMe PCIe 3.0", { "Capacité": "500 Go", "Interface": "PCIe 3.0 x4 NVMe" }],
      ["MZ-V7S1T0BW", "SSD Samsung 970 EVO Plus 1 To NVMe PCIe 3.0", { "Capacité": "1 To", "Interface": "PCIe 3.0 x4 NVMe" }],
      ["MZ-V7S2T0BW", "SSD Samsung 970 EVO Plus 2 To NVMe PCIe 3.0", { "Capacité": "2 To", "Interface": "PCIe 3.0 x4 NVMe" }],
      ["MZ-V8V500BW", "SSD Samsung 980 500 Go NVMe PCIe 3.0", { "Capacité": "500 Go", "Interface": "PCIe 3.0 x4 NVMe" }],
      ["MZ-V8V1T0BW", "SSD Samsung 980 1 To NVMe PCIe 3.0", { "Capacité": "1 To", "Interface": "PCIe 3.0 x4 NVMe" }],
      ["MZ-V8P500BW", "SSD Samsung 980 PRO 500 Go NVMe PCIe 4.0", { "Capacité": "500 Go", "Interface": "PCIe 4.0 x4 NVMe" }],
      ["MZ-V8P1T0BW", "SSD Samsung 980 PRO 1 To NVMe PCIe 4.0", { "Capacité": "1 To", "Interface": "PCIe 4.0 x4 NVMe" }],
      ["MZ-V8P2T0BW", "SSD Samsung 980 PRO 2 To NVMe PCIe 4.0", { "Capacité": "2 To", "Interface": "PCIe 4.0 x4 NVMe" }],
    ]),
  ),
  ...family(
    { ...samsung, status: "obsolete", confidence: 70,
      describe: (name) => `${name}. SSD NVMe Samsung de génération précédente, remplacé par la génération suivante de même capacité.` },
    rows([
      ["MZ-V7E250BW", "SSD Samsung 970 EVO 250 Go NVMe", { "Capacité": "250 Go" }, "MZ-V7S250BW"],
      ["MZ-V7E500BW", "SSD Samsung 970 EVO 500 Go NVMe", { "Capacité": "500 Go" }, "MZ-V7S500BW"],
      ["MZ-V7E1T0BW", "SSD Samsung 970 EVO 1 To NVMe", { "Capacité": "1 To" }, "MZ-V7S1T0BW"],
      ["MZ-V6E250BW", "SSD Samsung 960 EVO 250 Go NVMe", { "Capacité": "250 Go" }, "MZ-V7E250BW"],
      ["MZ-V6E500BW", "SSD Samsung 960 EVO 500 Go NVMe", { "Capacité": "500 Go" }, "MZ-V7E500BW"],
      ["MZ-V6E1T0BW", "SSD Samsung 960 EVO 1 To NVMe", { "Capacité": "1 To" }, "MZ-V7E1T0BW"],
    ]),
  ),
  ...family(
    { ...samsung, category: "Stockage serveur", status: "active", confidence: 60,
      describe: (name) => `${name}, SSD Samsung pour centres de données.` },
    rows([
      ["MZ7L3480HCHQ-00A07", "SSD Samsung PM893 480 Go SATA 2,5\"", { "Capacité": "480 Go", "Interface": "SATA 6 Gbit/s" }],
      ["MZ7L3960HCJR-00A07", "SSD Samsung PM893 960 Go SATA 2,5\"", { "Capacité": "960 Go", "Interface": "SATA 6 Gbit/s" }],
      ["MZ7L31T9HBLT-00A07", "SSD Samsung PM893 1,92 To SATA 2,5\"", { "Capacité": "1,92 To", "Interface": "SATA 6 Gbit/s" }],
      ["MZ7L33T8HBLT-00A07", "SSD Samsung PM893 3,84 To SATA 2,5\"", { "Capacité": "3,84 To", "Interface": "SATA 6 Gbit/s" }],
      ["MZQL2960HCJR-00A07", "SSD Samsung PM9A3 960 Go NVMe U.2", { "Capacité": "960 Go", "Interface": "PCIe 4.0 NVMe U.2" }],
      ["MZQL21T9HCJR-00A07", "SSD Samsung PM9A3 1,92 To NVMe U.2", { "Capacité": "1,92 To", "Interface": "PCIe 4.0 NVMe U.2" }],
      ["MZQL23T8HCLS-00A07", "SSD Samsung PM9A3 3,84 To NVMe U.2", { "Capacité": "3,84 To", "Interface": "PCIe 4.0 NVMe U.2" }],
      ["MZQL27T6HBLA-00A07", "SSD Samsung PM9A3 7,68 To NVMe U.2", { "Capacité": "7,68 To", "Interface": "PCIe 4.0 NVMe U.2" }],
    ]),
  ),
  ...family(
    { ...samsung, category: "Stockage serveur", status: "obsolete", confidence: 65,
      describe: (name) => `${name}. SSD PM883 arrêté, remplacé par le PM893 de même capacité.` },
    rows([
      ["MZ7LH480HAHQ-00005", "SSD Samsung PM883 480 Go SATA 2,5\"", { "Capacité": "480 Go" }, "MZ7L3480HCHQ-00A07"],
      ["MZ7LH960HAJR-00005", "SSD Samsung PM883 960 Go SATA 2,5\"", { "Capacité": "960 Go" }, "MZ7L3960HCJR-00A07"],
      ["MZ7LH1T9HMLT-00005", "SSD Samsung PM883 1,92 To SATA 2,5\"", { "Capacité": "1,92 To" }, "MZ7L31T9HBLT-00A07"],
      ["MZ7LH3T8HMLT-00005", "SSD Samsung PM883 3,84 To SATA 2,5\"", { "Capacité": "3,84 To" }, "MZ7L33T8HBLT-00A07"],
    ]),
  ),

  // ── Kingston ───────────────────────────────────────────────────────────────
  ...family(
    { ...kingston, status: "active", confidence: 60,
      describe: (name) => `${name}, SSD Kingston.` },
    rows([
      ["SA400S37/240G", "SSD Kingston A400 240 Go SATA 2,5\"", { "Capacité": "240 Go", "Interface": "SATA 6 Gbit/s" }],
      ["SA400S37/480G", "SSD Kingston A400 480 Go SATA 2,5\"", { "Capacité": "480 Go", "Interface": "SATA 6 Gbit/s" }],
      ["SA400S37/960G", "SSD Kingston A400 960 Go SATA 2,5\"", { "Capacité": "960 Go", "Interface": "SATA 6 Gbit/s" }],
      ["SNV3S/500G", "SSD Kingston NV3 500 Go NVMe PCIe 4.0", { "Capacité": "500 Go", "Interface": "PCIe 4.0 x4 NVMe" }],
      ["SNV3S/1000G", "SSD Kingston NV3 1 To NVMe PCIe 4.0", { "Capacité": "1 To", "Interface": "PCIe 4.0 x4 NVMe" }],
      ["SNV3S/2000G", "SSD Kingston NV3 2 To NVMe PCIe 4.0", { "Capacité": "2 To", "Interface": "PCIe 4.0 x4 NVMe" }],
      ["SEDC600M/960G", "SSD Kingston DC600M 960 Go SATA (centre de données)", { "Capacité": "960 Go", "Interface": "SATA 6 Gbit/s" }],
      ["SEDC600M/1920G", "SSD Kingston DC600M 1,92 To SATA (centre de données)", { "Capacité": "1,92 To", "Interface": "SATA 6 Gbit/s" }],
    ]),
  ),
  ...family(
    { ...kingston, status: "unknown", confidence: 65,
      describe: (name) => `${name}, SSD NVMe M.2 2280 Kingston.` },
    rows([
      ["SNV2S/500G", "SSD Kingston NV2 500 Go NVMe PCIe 4.0", { "Capacité": "500 Go", "Interface": "PCIe 4.0 x4 NVMe" }],
      ["SNV2S/1000G", "SSD Kingston NV2 1 To NVMe PCIe 4.0", { "Capacité": "1 To", "Interface": "PCIe 4.0 x4 NVMe" }],
      ["SNV2S/2000G", "SSD Kingston NV2 2 To NVMe PCIe 4.0", { "Capacité": "2 To", "Interface": "PCIe 4.0 x4 NVMe" }],
      ["SKC3000S/1024G", "SSD Kingston KC3000 1 To NVMe PCIe 4.0", { "Capacité": "1 To", "Interface": "PCIe 4.0 x4 NVMe" }],
      ["SKC3000D/2048G", "SSD Kingston KC3000 2 To NVMe PCIe 4.0", { "Capacité": "2 To", "Interface": "PCIe 4.0 x4 NVMe" }],
    ]),
  ),
  ...family(
    { ...kingston, status: "obsolete", confidence: 65,
      describe: (name) => `${name}. SSD Kingston de génération précédente arrêté, remplacé par son successeur de même capacité.` },
    rows([
      ["SNVS/500G", "SSD Kingston NV1 500 Go NVMe PCIe 3.0", { "Capacité": "500 Go" }, "SNV2S/500G"],
      ["SNVS/1000G", "SSD Kingston NV1 1 To NVMe PCIe 3.0", { "Capacité": "1 To" }, "SNV2S/1000G"],
      ["SEDC500M/960G", "SSD Kingston DC500M 960 Go SATA (centre de données)", { "Capacité": "960 Go" }, "SEDC600M/960G"],
      ["SEDC500M/1920G", "SSD Kingston DC500M 1,92 To SATA (centre de données)", { "Capacité": "1,92 To" }, "SEDC600M/1920G"],
      ["SUV500/480G", "SSD Kingston UV500 480 Go SATA", { "Capacité": "480 Go" }],
    ]),
  ),
  ...family(
    { ...kingston, category: "Modules réseau et mémoire", status: "active", confidence: 60,
      describe: (name) => `${name}, barrette mémoire Kingston ValueRAM.` },
    rows([
      ["KVR32N22S8/8", "Mémoire Kingston 8 Go DDR4-3200 UDIMM", { "Capacité": "8 Go", "Type": "DDR4-3200 UDIMM" }],
      ["KVR32N22D8/16", "Mémoire Kingston 16 Go DDR4-3200 UDIMM", { "Capacité": "16 Go", "Type": "DDR4-3200 UDIMM" }],
      ["KVR32S22S8/8", "Mémoire Kingston 8 Go DDR4-3200 SODIMM", { "Capacité": "8 Go", "Type": "DDR4-3200 SODIMM" }],
      ["KVR32S22D8/16", "Mémoire Kingston 16 Go DDR4-3200 SODIMM", { "Capacité": "16 Go", "Type": "DDR4-3200 SODIMM" }],
      ["KVR56U46BS8-16", "Mémoire Kingston 16 Go DDR5-5600 UDIMM", { "Capacité": "16 Go", "Type": "DDR5-5600 UDIMM" }],
    ]),
  ),
  ...family(
    { ...kingston, category: "Modules réseau et mémoire", status: "unknown", confidence: 65,
      describe: (name) => `${name}, barrette mémoire Kingston.` },
    rows([
      ["KVR26N19S8/8", "Mémoire Kingston 8 Go DDR4-2666 UDIMM", { "Capacité": "8 Go", "Type": "DDR4-2666 UDIMM" }],
      ["KVR26N19D8/16", "Mémoire Kingston 16 Go DDR4-2666 UDIMM", { "Capacité": "16 Go", "Type": "DDR4-2666 UDIMM" }],
      ["KVR26S19S8/8", "Mémoire Kingston 8 Go DDR4-2666 SODIMM", { "Capacité": "8 Go", "Type": "DDR4-2666 SODIMM" }],
      ["KVR16N11/8", "Mémoire Kingston 8 Go DDR3-1600 UDIMM", { "Capacité": "8 Go", "Type": "DDR3-1600 UDIMM" }],
      ["KVR16S11/8", "Mémoire Kingston 8 Go DDR3-1600 SODIMM", { "Capacité": "8 Go", "Type": "DDR3-1600 SODIMM" }],
      ["KVR16LS11/8", "Mémoire Kingston 8 Go DDR3L-1600 SODIMM 1,35 V", { "Capacité": "8 Go", "Type": "DDR3L-1600 SODIMM" }],
      ["KVR48U40BS8-16", "Mémoire Kingston 16 Go DDR5-4800 UDIMM", { "Capacité": "16 Go", "Type": "DDR5-4800 UDIMM" }],
      ["KVR48S40BS8-16", "Mémoire Kingston 16 Go DDR5-4800 SODIMM", { "Capacité": "16 Go", "Type": "DDR5-4800 SODIMM" }],
      ["KF432C16BB/16", "Mémoire Kingston FURY Beast 16 Go DDR4-3200", { "Capacité": "16 Go", "Type": "DDR4-3200 UDIMM" }],
      ["KF552C40BB-16", "Mémoire Kingston FURY Beast 16 Go DDR5-5200", { "Capacité": "16 Go", "Type": "DDR5-5200 UDIMM" }],
    ]),
  ),

  // ── Crucial (marque grand public de Micron, arrêtée) ───────────────────────
  ...family(
    { ...crucial, status: "obsolete", confidence: 60,
      describe: (name) => `${name}. Micron a annoncé fin 2025 l'arrêt de sa marque grand public Crucial (livraisons jusqu'en février 2026) : produit plus fabriqué.` },
    [
      ...rows([
        ["CT250MX500SSD1", "SSD Crucial MX500 250 Go SATA 2,5\"", { "Capacité": "250 Go", "Interface": "SATA 6 Gbit/s" }],
        ["CT500MX500SSD1", "SSD Crucial MX500 500 Go SATA 2,5\"", { "Capacité": "500 Go", "Interface": "SATA 6 Gbit/s" }],
        ["CT1000MX500SSD1", "SSD Crucial MX500 1 To SATA 2,5\"", { "Capacité": "1 To", "Interface": "SATA 6 Gbit/s" }],
        ["CT2000MX500SSD1", "SSD Crucial MX500 2 To SATA 2,5\"", { "Capacité": "2 To", "Interface": "SATA 6 Gbit/s" }],
        ["CT500BX500SSD1", "SSD Crucial BX500 500 Go SATA 2,5\"", { "Capacité": "500 Go", "Interface": "SATA 6 Gbit/s" }],
        ["CT1000BX500SSD1", "SSD Crucial BX500 1 To SATA 2,5\"", { "Capacité": "1 To", "Interface": "SATA 6 Gbit/s" }],
        ["CT1000P3SSD8", "SSD Crucial P3 1 To NVMe PCIe 3.0", { "Capacité": "1 To", "Interface": "PCIe 3.0 x4 NVMe" }],
        ["CT1000P3PSSD8", "SSD Crucial P3 Plus 1 To NVMe PCIe 4.0", { "Capacité": "1 To", "Interface": "PCIe 4.0 x4 NVMe" }],
        ["CT2000P3PSSD8", "SSD Crucial P3 Plus 2 To NVMe PCIe 4.0", { "Capacité": "2 To", "Interface": "PCIe 4.0 x4 NVMe" }],
        ["CT1000P5PSSD8", "SSD Crucial P5 Plus 1 To NVMe PCIe 4.0", { "Capacité": "1 To", "Interface": "PCIe 4.0 x4 NVMe" }],
        ["CT1000T500SSD8", "SSD Crucial T500 1 To NVMe PCIe 4.0", { "Capacité": "1 To", "Interface": "PCIe 4.0 x4 NVMe" }],
        ["CT2000T500SSD8", "SSD Crucial T500 2 To NVMe PCIe 4.0", { "Capacité": "2 To", "Interface": "PCIe 4.0 x4 NVMe" }],
      ]),
      ...rows([
        ["CT8G4DFRA32A", "Mémoire Crucial 8 Go DDR4-3200 UDIMM", { "Capacité": "8 Go", "Type": "DDR4-3200 UDIMM" }],
        ["CT16G4DFRA32A", "Mémoire Crucial 16 Go DDR4-3200 UDIMM", { "Capacité": "16 Go", "Type": "DDR4-3200 UDIMM" }],
        ["CT8G4SFRA32A", "Mémoire Crucial 8 Go DDR4-3200 SODIMM", { "Capacité": "8 Go", "Type": "DDR4-3200 SODIMM" }],
        ["CT16G4SFRA32A", "Mémoire Crucial 16 Go DDR4-3200 SODIMM", { "Capacité": "16 Go", "Type": "DDR4-3200 SODIMM" }],
        ["CT16G48C40U5", "Mémoire Crucial 16 Go DDR5-4800 UDIMM", { "Capacité": "16 Go", "Type": "DDR5-4800 UDIMM" }],
        ["CT16G48C40S5", "Mémoire Crucial 16 Go DDR5-4800 SODIMM", { "Capacité": "16 Go", "Type": "DDR5-4800 SODIMM" }],
        ["CT32G48C40U5", "Mémoire Crucial 32 Go DDR5-4800 UDIMM", { "Capacité": "32 Go", "Type": "DDR5-4800 UDIMM" }],
      ]).map(([ref, name, attributes]): Row => [ref, name, attributes, { category: "Modules réseau et mémoire" }]),
    ],
  ),
];
