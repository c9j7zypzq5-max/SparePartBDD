#!/usr/bin/env npx tsx
/**
 * accumulate.ts — Catalog enrichment & update for SparePartSearch
 *
 * Modes:
 *   npx tsx scripts/ingest/accumulate.ts                 → enrich continu
 *   npx tsx scripts/ingest/accumulate.ts --enrich        → enrich continu
 *   npx tsx scripts/ingest/accumulate.ts --enrich --once → test un seul batch d'enrichissement
 *   npx tsx scripts/ingest/accumulate.ts --update        → update continu des pièces existantes
 *   npx tsx scripts/ingest/accumulate.ts --update --once → test un seul batch d'update
 *   npx tsx scripts/ingest/accumulate.ts --stats         → résumé sans modifier
 *
 * Requires:
 *   - .env at repo root with INGEST_API_KEY
 *   - Ollama running locally (http://localhost:11434)
 */

import * as fs from "fs";
import * as path from "path";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const envPath = path.resolve(__dirname, "../../.env");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf-8").split("\n")) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)$/);
    if (m) process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
  }
}

const INGEST_API_KEY = process.env.INGEST_API_KEY;
if (!INGEST_API_KEY) {
  console.error("❌  INGEST_API_KEY not set. Create a .env file at the repo root.");
  process.exit(1);
}

const INGEST_URL    = "https://spare-part-bdd.vercel.app/api/ingest";
const SITEMAP_URL   = "https://spare-part-bdd.vercel.app/sitemap.xml";
const OLLAMA_URL    = "http://localhost:11434/api/generate";
const BATCH_PAUSE_MS      = 7_000;
const OLLAMA_TIMEOUT_MS   = 300_000;
const UPDATE_BATCH_SIZE   = 8;
const LOG_FILE      = path.resolve(__dirname, "accumulate.log");
const STATE_FILE    = path.resolve(__dirname, ".accumulate-state.json");

const ONCE_MODE   = process.argv.includes("--once");
const UPDATE_MODE = process.argv.includes("--update");
const CLEAN_MODE  = process.argv.includes("--clean");
const STATS_MODE  = process.argv.includes("--stats");
const ENRICH_MODE = !UPDATE_MODE && !CLEAN_MODE && !STATS_MODE; // default

// ---------------------------------------------------------------------------
// Types — exact mirror of src/lib/ingest-types.ts
// ---------------------------------------------------------------------------

type Industry    = "industrie" | "informatique" | "automobile" | "electromenager" | "hvac" | "electronique";
type PartStatus  = "active" | "obsolete" | "unknown";
type ReferenceType = "oem" | "aftermarket" | "ean" | "mpn";
type SellerType  = "constructeur" | "distributeur_officiel" | "aftermarket" | "reconditionne" | "occasion";

interface IngestOffer {
  sellerName: string;
  sellerType: SellerType;
  sellerWebsite?: string;
  sellerCountry?: string;
  price?: number;
  currency?: string;
  availability?: string;
  url: string;
}

interface IngestPart {
  manufacturer: string;
  manufacturerWebsite?: string;
  industry: Industry;
  reference: string;
  name: string;
  description?: string;
  status?: PartStatus;
  category?: string;
  normalizedCategory?: string;
  industrySector?: string;
  productUrl?: string;
  attributes?: Record<string, string>;
  crossReferences?: { reference: string; type: ReferenceType; brand?: string }[];
  supersededBy?: string;
  compatibleWith?: string[];
  offers?: IngestOffer[];
}

interface IngestPayload {
  source: string;
  parts: IngestPart[];
}

interface IngestResult {
  partsInserted: number;
  partsUpdated: number;
  offersInserted: number;
  errors: string[];
}

// ---------------------------------------------------------------------------
// State persistence
// ---------------------------------------------------------------------------

interface LastStats {
  processed: number;
  enriched: number;
  skipped: number;
  failed: number;
  asOf: string;
}

interface AppState {
  enrich: { batchIndex: number; generationRound: number };
  update: { batchOffset: number };
  lastRun?: string;
  lastStats?: LastStats;
}

function loadState(): AppState {
  if (fs.existsSync(STATE_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(STATE_FILE, "utf-8")) as AppState;
    } catch { /* corrupt state, start fresh */ }
  }
  return { enrich: { batchIndex: 0, generationRound: 0 }, update: { batchOffset: 0 } };
}

function saveState(state: AppState): void {
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

// ---------------------------------------------------------------------------
// Enrich targets
// ---------------------------------------------------------------------------

interface Target {
  brand: string;
  family: string;
  category: string;
  industry: Industry;
  hint: string;
}

const BASE_TARGETS: Target[] = [
  // ── Siemens ──────────────────────────────────────────────────────────────
  { brand: "Siemens", family: "SIMATIC S7-300 CPU",          category: "Automates / PLC",             industry: "industrie",    hint: "6ES7314-6EH04-0AB0, 6ES7315-2EH14-0AB0, 6ES7317-2EK14-0AB0" },
  { brand: "Siemens", family: "SIMATIC S7-400 CPU",          category: "Automates / PLC",             industry: "industrie",    hint: "6ES7412-2XK07-0AB0, 6ES7414-3XM07-0AB0, 6ES7416-3XR05-0AB0" },
  { brand: "Siemens", family: "SIMATIC S7-1200 CPU",         category: "Automates / PLC",             industry: "industrie",    hint: "6ES7212-1AE40-0XB0, 6ES7214-1AG40-0XB0, 6ES7215-1BG40-0XB0" },
  { brand: "Siemens", family: "SIMATIC S7-1500 CPU",         category: "Automates / PLC",             industry: "industrie",    hint: "6ES7511-1AK02-0AB0, 6ES7513-1AL02-0AB0, 6ES7516-3AN02-0AB0" },
  { brand: "Siemens", family: "SINAMICS G120 variateurs",    category: "Variateurs de fréquence",     industry: "industrie",    hint: "6SL3210-1KE11-8AF1, 6SL3210-1KE13-2AF1, 6SL3210-1KE17-5AF1" },
  { brand: "Siemens", family: "SINAMICS S120 variateurs",    category: "Variateurs de fréquence",     industry: "industrie",    hint: "6SL3120-1TE21-0AA3, 6SL3120-1TE23-0AA3, 6SL3120-2TE21-0AA3" },
  { brand: "Siemens", family: "SITOP alimentation",          category: "Alimentations industrielles", industry: "industrie",    hint: "6EP1334-2BA20, 6EP1336-3BA10, 6EP1437-3BA00" },
  { brand: "Siemens", family: "SIMATIC S7-300 modules E/S",  category: "Modules E/S",                 industry: "industrie",    hint: "6ES7321-1BH02-0AA0, 6ES7322-1BH01-0AA0, 6ES7331-7KF02-0AB0" },
  // ── Schneider Electric ───────────────────────────────────────────────────
  { brand: "Schneider Electric", family: "Altivar 320 variateurs",         category: "Variateurs de fréquence",     industry: "industrie", hint: "ATV320U07M2C, ATV320U15M2C, ATV320U22M2C" },
  { brand: "Schneider Electric", family: "Altivar 71 variateurs",          category: "Variateurs de fréquence",     industry: "industrie", hint: "ATV71HU15N4, ATV71HU22N4, ATV71HU40N4" },
  { brand: "Schneider Electric", family: "TeSys D contacteurs",            category: "Contacteurs / Disjoncteurs",  industry: "industrie", hint: "LC1D09, LC1D18, LC1D32, LC1D40" },
  { brand: "Schneider Electric", family: "TeSys GV2 disjoncteurs moteur",  category: "Contacteurs / Disjoncteurs",  industry: "industrie", hint: "GV2ME10, GV2ME14, GV2ME16, GV2ME21" },
  { brand: "Schneider Electric", family: "Modicon M340 automates",         category: "Automates / PLC",             industry: "industrie", hint: "BMX P34 2020, BMX DDI 1602, BMX DDO 1602" },
  { brand: "Schneider Electric", family: "Modicon M580 automates",         category: "Automates / PLC",             industry: "industrie", hint: "BMEP581020, BMEP582040, BMEP582020" },
  // ── ABB ──────────────────────────────────────────────────────────────────
  { brand: "ABB", family: "ACS550 variateurs",    category: "Variateurs de fréquence",    industry: "industrie", hint: "ACS550-01-04A1-4, ACS550-01-06A9-4, ACS550-01-012A-4" },
  { brand: "ABB", family: "ACS880 variateurs",    category: "Variateurs de fréquence",    industry: "industrie", hint: "ACS880-01-04A0-3, ACS880-01-07A2-3, ACS880-01-011A-3" },
  { brand: "ABB", family: "ABB S200 disjoncteurs",category: "Contacteurs / Disjoncteurs", industry: "industrie", hint: "S201-B16, S202-B16, S203-B16, S201-C10" },
  // ── Allen-Bradley ─────────────────────────────────────────────────────────
  { brand: "Allen-Bradley", family: "ControlLogix 5580 CPU",    category: "Automates / PLC",         industry: "industrie", hint: "1756-L81E, 1756-L82E, 1756-L83E, 1756-L84E" },
  { brand: "Allen-Bradley", family: "CompactLogix 5370 CPU",    category: "Automates / PLC",         industry: "industrie", hint: "1769-L16ER-BB1B, 1769-L18ERM-BB1B, 1769-L24ER-QB1B" },
  { brand: "Allen-Bradley", family: "PowerFlex 525 variateurs", category: "Variateurs de fréquence", industry: "industrie", hint: "25B-D2P3N104, 25B-D4P0N104, 25B-D6P0N104" },
  { brand: "Allen-Bradley", family: "PowerFlex 755 variateurs", category: "Variateurs de fréquence", industry: "industrie", hint: "20G11ND3P0AA0NNNNN, 20G11ND6P0AA0NNNNN, 20G11NC1P1AA0NNNNN" },
  // ── Festo ─────────────────────────────────────────────────────────────────
  { brand: "Festo", family: "MPA électrovannes",     category: "Pneumatique", industry: "industrie", hint: "196896, 196897, 197409, 197410" },
  { brand: "Festo", family: "DSBC vérins pneumatiques", category: "Pneumatique", industry: "industrie", hint: "1383319, 1383320, 1383323, 1383325" },
  // ── SMC ───────────────────────────────────────────────────────────────────
  { brand: "SMC", family: "SY5000 électrovannes", category: "Pneumatique", industry: "industrie", hint: "SY5120-5LZE-01, SY5120-5DZE-01, SY5220-5DZE-01" },
  { brand: "SMC", family: "CDQ2 vérins compacts",  category: "Pneumatique", industry: "industrie", hint: "CDQ2B32-25DZ, CDQ2B40-25DZ, CDQ2B50-25DZ" },
  // ── Omron ─────────────────────────────────────────────────────────────────
  { brand: "Omron", family: "CJ2M CPU automates",           category: "Automates / PLC", industry: "industrie", hint: "CJ2M-CPU11, CJ2M-CPU12, CJ2M-CPU13, CJ2M-CPU31" },
  { brand: "Omron", family: "E3Z capteurs photoélectriques", category: "Capteurs",        industry: "industrie", hint: "E3Z-T61, E3Z-T81, E3Z-D61, E3Z-D81" },
  // ── Phoenix Contact ───────────────────────────────────────────────────────
  { brand: "Phoenix Contact", family: "QUINT alimentations", category: "Alimentations industrielles", industry: "industrie", hint: "2866765, 2866776, 2866797, 2866727" },
  { brand: "Phoenix Contact", family: "FLKM bornes",         category: "Bornes / Connecteurs",        industry: "industrie", hint: "3025195, 3025196, 3025207, 3025213" },
  // ── Keysight ──────────────────────────────────────────────────────────────
  { brand: "Keysight", family: "34400 multimètres",    category: "Instrumentation", industry: "electronique", hint: "34401A, 34410A, 34411A, 34461A" },
  { brand: "Keysight", family: "DSOX oscilloscopes",   category: "Instrumentation", industry: "electronique", hint: "DSOX1102G, DSOX1204G, DSOX3034T, DSOX3054T" },
  // ── Fluke ─────────────────────────────────────────────────────────────────
  { brand: "Fluke", family: "170 multimètres série",       category: "Instrumentation", industry: "electronique", hint: "FLUKE-175, FLUKE-177, FLUKE-179, FLUKE-87V" },
  { brand: "Fluke", family: "Fluke 435 analyseurs réseau", category: "Instrumentation", industry: "electronique", hint: "FLUKE-435-II, FLUKE-437-II, FLUKE-438-II" },
  // ── WAGO ──────────────────────────────────────────────────────────────────
  { brand: "WAGO", family: "750 contrôleurs E/S", category: "Automates / PLC",      industry: "industrie", hint: "750-8202, 750-8203, 750-8204, 750-8206" },
  { brand: "WAGO", family: "221 bornes WAGO",     category: "Bornes / Connecteurs", industry: "industrie", hint: "221-412, 221-413, 221-415, 221-2401" },
  // ── Pepperl+Fuchs ─────────────────────────────────────────────────────────
  { brand: "Pepperl+Fuchs", family: "NBB capteurs inductifs", category: "Capteurs", industry: "industrie", hint: "NBB5-18GM60-E2, NBB8-18GM50-E2, NBB15-30GM50-E2" },
  { brand: "Pepperl+Fuchs", family: "OMT capteurs optiques",  category: "Capteurs", industry: "industrie", hint: "OMT200-R200-2EP-IO-V31, OBT300-R200-2EP-IO-V31" },
  // ── ifm ───────────────────────────────────────────────────────────────────
  { brand: "ifm", family: "IFS capteurs inductifs",  category: "Capteurs", industry: "industrie", hint: "IFS204, IFS205, IFS208, IFS240" },
  { brand: "ifm", family: "O5D capteurs de distance", category: "Capteurs", industry: "industrie", hint: "O5D100, O5D101, O5D102, O5D150" },
  // ── Danfoss ───────────────────────────────────────────────────────────────
  { brand: "Danfoss", family: "FC302 variateurs", category: "Variateurs de fréquence", industry: "industrie", hint: "131B0030, 131B0031, 131B0032, 131B0033" },
  // ── SEW-Eurodrive ─────────────────────────────────────────────────────────
  { brand: "SEW-Eurodrive", family: "MOVIMOT variateurs", category: "Variateurs de fréquence", industry: "industrie", hint: "MM11C-503-00, MM15C-503-00, MM22C-503-00" },
  // ── Lenze ─────────────────────────────────────────────────────────────────
  { brand: "Lenze", family: "i510 variateurs", category: "Variateurs de fréquence", industry: "industrie", hint: "I51AE155F10V10000S, I51AE222F10V10000S, I51AE300F10V10000S" },
  // ── Mitsubishi ────────────────────────────────────────────────────────────
  { brand: "Mitsubishi", family: "MELSEC FX5U automates", category: "Automates / PLC", industry: "industrie", hint: "FX5U-32MR/ES, FX5U-64MR/ES, FX5U-80MR/ES" },
  { brand: "Mitsubishi", family: "MELSEC Q CPU",          category: "Automates / PLC", industry: "industrie", hint: "Q03UDE, Q04UDEH, Q06UDEH, Q13UDEH" },
  // ── Beckhoff ──────────────────────────────────────────────────────────────
  { brand: "Beckhoff", family: "CX5000 IPC embarqués",    category: "Automates / PLC", industry: "industrie", hint: "CX5020-0125, CX5120-0125, CX5130-0125, CX5140-0125" },
  { brand: "Beckhoff", family: "EL1xxx modules TwinCAT",  category: "Modules E/S",     industry: "industrie", hint: "EL1008, EL1014, EL1018, EL1034" },
  // ── Cisco ──────────────────────────────────────────────────────────────────
  { brand: "Cisco", family: "Catalyst 9200 switches", category: "Réseau / Switches", industry: "informatique", hint: "C9200L-24P-4G-E, C9200L-48P-4G-E, C9200-24P-E, C9200-48P-E" },
  { brand: "Cisco", family: "Catalyst 9300 switches", category: "Réseau / Switches", industry: "informatique", hint: "C9300-24T-E, C9300-48T-E, C9300-24P-E, C9300-48P-E" },
  { brand: "Cisco", family: "ISR 4000 routeurs",      category: "Réseau / Routeurs",  industry: "informatique", hint: "ISR4321/K9, ISR4331/K9, ISR4351/K9, ISR4431/K9" },
  { brand: "Cisco", family: "SFP transceivers",       category: "Réseau / Optique",   industry: "informatique", hint: "GLC-LH-SMD, GLC-SX-MMD, SFP-10G-LR, SFP-10G-SR" },
  // ── Juniper ────────────────────────────────────────────────────────────────
  { brand: "Juniper", family: "EX2300 switches", category: "Réseau / Switches",  industry: "informatique", hint: "EX2300-24T, EX2300-48T, EX2300-24P, EX2300-48P" },
  { brand: "Juniper", family: "SRX300 firewalls", category: "Réseau / Sécurité", industry: "informatique", hint: "SRX300, SRX320, SRX340, SRX345" },
  // ── Dell ───────────────────────────────────────────────────────────────────
  { brand: "Dell", family: "PowerEdge R750 serveurs", category: "Serveurs", industry: "informatique", hint: "PowerEdge R750, PowerEdge R750xs, PowerEdge R750xa" },
  { brand: "Dell", family: "PowerEdge R640 / R650",   category: "Serveurs", industry: "informatique", hint: "PowerEdge R640, PowerEdge R650, PowerEdge R650xs" },
  // ── HPE ────────────────────────────────────────────────────────────────────
  { brand: "HPE", family: "ProLiant DL380 Gen10", category: "Serveurs", industry: "informatique", hint: "P02467-B21, P20249-B21, P56959-B21" },
  { brand: "HPE", family: "ProLiant DL360 Gen10", category: "Serveurs", industry: "informatique", hint: "P19776-B21, P24742-B21, P56957-B21" },
  // ── Lenovo ─────────────────────────────────────────────────────────────────
  { brand: "Lenovo", family: "ThinkSystem SR650 serveurs", category: "Serveurs",                 industry: "informatique", hint: "7X06A0JCEA, 7X06CTO1WW, 7X05A0BCEA" },
  { brand: "Lenovo", family: "ThinkPad T14 portables",     category: "Portables professionnels", industry: "informatique", hint: "20S0S00J00, 20S0S00K00, 20W0S0AC00" },
  // ── Fortinet ────────────────────────────────────────────────────────────────
  { brand: "Fortinet", family: "FortiGate 60F / 80F", category: "Réseau / Sécurité", industry: "informatique", hint: "FG-60F, FG-61F, FG-80F, FG-81F" },
  { brand: "Fortinet", family: "FortiSwitch 148F",    category: "Réseau / Switches", industry: "informatique", hint: "FS-148F, FS-148F-POE, FS-148F-FPOE" },
  // ── Aruba ───────────────────────────────────────────────────────────────────
  { brand: "Aruba", family: "Aruba 6300M switches", category: "Réseau / Switches", industry: "informatique", hint: "JL658A, JL659A, JL660A, JL661A" },
  // ── Ubiquiti ───────────────────────────────────────────────────────────────
  { brand: "Ubiquiti", family: "UniFi Switch Pro", category: "Réseau / Switches", industry: "informatique", hint: "USW-Pro-24, USW-Pro-24-POE, USW-Pro-48, USW-Pro-48-POE" },
  // ── Synology ───────────────────────────────────────────────────────────────
  { brand: "Synology", family: "DS NAS stations", category: "Stockage / NAS", industry: "informatique", hint: "DS923+, DS1522+, DS1823xs+, DS2422+" },
  // ── QNAP ───────────────────────────────────────────────────────────────────
  { brand: "QNAP", family: "TS NAS stations", category: "Stockage / NAS", industry: "informatique", hint: "TS-464, TS-664, TS-h886, TVS-h1288X" },
  // ── APC ─────────────────────────────────────────────────────────────────────
  { brand: "APC", family: "Smart-UPS SRT onduleurs", category: "Onduleurs / UPS", industry: "informatique", hint: "SRT1500XLI, SRT2200XLI, SRT3000XLI, SRT5KXLI" },
  { brand: "APC", family: "Back-UPS Pro onduleurs",  category: "Onduleurs / UPS", industry: "informatique", hint: "BR1600MI, BR1500G, BR900MI, BR700G" },
  // ── CPU / Processeurs ────────────────────────────────────────────────────────
  { brand: "Intel", family: "Core 14th Gen processeurs",         category: "CPU / Processeurs", industry: "informatique", hint: "BX8071514900K, BX8071514700K, BX8071514600K" },
  { brand: "Intel", family: "Core Ultra 200 processeurs",        category: "CPU / Processeurs", industry: "informatique", hint: "BX80768285K, BX80768265K, BX80768255K" },
  { brand: "AMD",   family: "Ryzen 7000 processeurs",            category: "CPU / Processeurs", industry: "informatique", hint: "100-100000514WOF, 100-100000591WOF, 100-100000593WOF" },
  { brand: "AMD",   family: "Threadripper PRO 7000WX processeurs", category: "CPU / Processeurs", industry: "informatique", hint: "100-100001350WOF, 100-100001351WOF, 100-100001352WOF" },
  // ── Cartes mères ─────────────────────────────────────────────────────────────
  { brand: "ASUS",          family: "ROG MAXIMUS Z790 cartes mères Intel",    category: "Cartes mères", industry: "informatique", hint: "ROG MAXIMUS Z790 APEX, ROG MAXIMUS Z790 HERO, ROG MAXIMUS Z790 FORMULA" },
  { brand: "MSI",           family: "MEG Z790 ACE cartes mères Intel",        category: "Cartes mères", industry: "informatique", hint: "MEG Z790 ACE, MEG Z790 GODLIKE, MEG Z790 UNIFY-X" },
  { brand: "Gigabyte",      family: "Z790 AORUS Master cartes mères Intel",   category: "Cartes mères", industry: "informatique", hint: "Z790 AORUS MASTER, Z790 AORUS ELITE AX, Z790 AORUS PRO X" },
  { brand: "ASUS",          family: "ProArt X670E-CREATOR cartes mères AMD",  category: "Cartes mères", industry: "informatique", hint: "ProArt X670E-CREATOR WIFI, ROG CROSSHAIR X670E HERO, ROG CROSSHAIR X670E EXTREME" },
  { brand: "MSI",           family: "PRO X670-P WIFI cartes mères AMD",       category: "Cartes mères", industry: "informatique", hint: "PRO X670-P WIFI, MEG X670E ACE, MAG X670E TOMAHAWK WIFI" },
  // ── RAM ──────────────────────────────────────────────────────────────────────
  { brand: "Corsair",  family: "Vengeance DDR5 RAM",             category: "Mémoire RAM", industry: "informatique", hint: "CMK32GX5M2B6000C30, CMK64GX5M2B6000C30, CMK32GX5M2B6400C32" },
  { brand: "G.Skill",  family: "Trident Z5 DDR5 RAM",            category: "Mémoire RAM", industry: "informatique", hint: "F5-6000J3040G32GX2-TZ5K, F5-6400J3239G32GX2-TZ5K, F5-7200J3445G16GX2-TZ5K" },
  { brand: "Kingston", family: "Fury Beast DDR5 RAM",             category: "Mémoire RAM", industry: "informatique", hint: "KF560C36BBE-32, KF560C40BBK2-32, KF560C36BBE2K2-64" },
  { brand: "Samsung",  family: "DDR5 ECC RDIMM RAM serveur",      category: "Mémoire RAM", industry: "informatique", hint: "M323R8GA3BB0-CQK, M321R8GA0BB0-CQK, M323R4GA3BB0-CQKAD" },
  { brand: "Micron",   family: "DDR5 ECC RDIMM RAM serveur",      category: "Mémoire RAM", industry: "informatique", hint: "MTC20C2085S1RC48BA1, MTC20F2085S1RC48BA1, MTC20C2085S1TC48BA1" },
  // ── SSD / Stockage ────────────────────────────────────────────────────────────
  { brand: "Samsung",          family: "990 Pro NVMe SSD",          category: "Stockage SSD NVMe",       industry: "informatique", hint: "MZ-V9P2T0BW, MZ-V9P1T0BW, MZ-V9P4T0BW" },
  { brand: "Western Digital",  family: "WD Black SN850X NVMe SSD",  category: "Stockage SSD NVMe",       industry: "informatique", hint: "WDS200T2X0E, WDS100T2X0E, WDS400T2X0E" },
  { brand: "Seagate",          family: "FireCuda 530 NVMe SSD",     category: "Stockage SSD NVMe",       industry: "informatique", hint: "ZP2000GM3A013, ZP1000GM3A013, ZP4000GM3A013" },
  { brand: "Samsung",          family: "870 EVO SATA SSD",          category: "Stockage SSD SATA",       industry: "informatique", hint: "MZ-77E4T0B/EU, MZ-77E2T0B/EU, MZ-77E1T0B/EU" },
  { brand: "Seagate",          family: "Exos X18 HDD entreprise",   category: "Stockage HDD entreprise", industry: "informatique", hint: "ST18000NM000J, ST16000NM001J, ST14000NM000J" },
  // ── GPU ──────────────────────────────────────────────────────────────────────
  { brand: "NVIDIA", family: "GeForce RTX 4090 / 4080 Super GPU",  category: "Cartes graphiques",            industry: "informatique", hint: "900-1G136-2530-000, RTX 4080 Super 16GB, RTX 4070 Ti Super 16GB" },
  { brand: "NVIDIA", family: "A100 80GB GPU datacenter",           category: "Cartes graphiques datacenter", industry: "informatique", hint: "900-21001-0040-000, 900-21001-0020-000, 900-21001-0010-000" },
  { brand: "AMD",    family: "Radeon RX 7900 XTX / 7800 XT GPU",  category: "Cartes graphiques",            industry: "informatique", hint: "RX-79XXTXBF9, 100-300000069, 100-300000053" },
  // ── Alimentations PC ─────────────────────────────────────────────────────────
  { brand: "Corsair",      family: "HX1200i alimentation PC",          category: "Alimentations PC", industry: "informatique", hint: "CP-9020260-EU, CP-9020254-EU, CP-9020261-EU" },
  { brand: "be quiet!",    family: "Dark Power 13 1000W alimentation", category: "Alimentations PC", industry: "informatique", hint: "BN334, BN332, BN333" },
  { brand: "EVGA",         family: "SuperNOVA 1000 G7 alimentation",   category: "Alimentations PC", industry: "informatique", hint: "220-G7-1000-X1, 220-G7-0850-X1, 220-G7-0750-X1" },
  { brand: "Seasonic",     family: "PRIME TX-1000 alimentation",       category: "Alimentations PC", industry: "informatique", hint: "PRIME-TX-1000, PRIME-TX-850, PRIME-TX-750" },
  // ── Boîtiers / Refroidissement ───────────────────────────────────────────────
  { brand: "Noctua",         family: "NH-D15 refroidisseurs CPU",            category: "Refroidissement CPU", industry: "informatique", hint: "NH-D15, NH-D15S, NH-D15 chromax.black" },
  { brand: "be quiet!",      family: "Dark Rock Pro 5 refroidisseurs CPU",   category: "Refroidissement CPU", industry: "informatique", hint: "BK036, BK034, BK022" },
  { brand: "Corsair",        family: "iCUE H150i Elite AIO refroidissement", category: "Refroidissement CPU", industry: "informatique", hint: "CW-9060065-WW, CW-9060066-WW, CW-9060047-WW" },
  { brand: "Fractal Design", family: "Define 7 boîtiers PC",                category: "Boîtiers PC",         industry: "informatique", hint: "FD-C-DEF7A-01, FD-C-DEF7A-03, FD-C-DEF7X-01" },
  { brand: "Lian Li",        family: "PC-O11 Dynamic XL boîtiers",          category: "Boîtiers PC",         industry: "informatique", hint: "G99.O11DXL.00, O11D XL-W, G99.O11DXLW.00" },
];

function generateNewTargets(round: number): Target[] {
  return [
    { brand: "Siemens",            family: `SIMATIC ET200SP E/S round ${round}`,           category: "Modules E/S",             industry: "industrie",    hint: "6ES7131-6BF00-0CA0, 6ES7132-6BF00-0CA0, 6ES7141-6BG00-0AB0" },
    { brand: "Siemens",            family: `SIMATIC HMI TP700/KTP900 round ${round}`,      category: "IHM / Écrans",            industry: "industrie",    hint: "6AV2124-0GC01-0AX0, 6AV2123-2JB03-0AX0, 6AV2124-0MC01-0AX0" },
    { brand: "Schneider Electric", family: `Altivar Process ATV900 round ${round}`,        category: "Variateurs de fréquence", industry: "industrie",    hint: "ATV900U11N4, ATV900U22N4, ATV900U40N4" },
    { brand: "Schneider Electric", family: `Harmony XB4 boutons-poussoirs round ${round}`, category: "Boutons / Commandes",     industry: "industrie",    hint: "ZB4BW0M31, ZB4BW0M51, ZB4BS21, ZB4BS31" },
    { brand: "Cisco",              family: `Catalyst 9500 switches round ${round}`,        category: "Réseau / Switches",       industry: "informatique", hint: "C9500-24Q-E, C9500-40X-E, C9500-48X-E, C9500-12Q-E" },
    { brand: "Cisco",              family: `ASA 5500-X firewalls round ${round}`,          category: "Réseau / Sécurité",       industry: "informatique", hint: "ASA5506-K9, ASA5508-K9, ASA5512-K9, ASA5516-K9" },
    { brand: "HPE",                family: `ProLiant ML350 Gen10 round ${round}`,          category: "Serveurs",                industry: "informatique", hint: "P21788-B21, P21791-B21, P21792-B21" },
    { brand: "Allen-Bradley",      family: `MicroLogix 1400 round ${round}`,               category: "Automates / PLC",         industry: "industrie",    hint: "1766-L32BWAA, 1766-L32BWA, 1766-L32AWAA" },
    { brand: "ABB",                family: `ACH580 HVAC variateurs round ${round}`,        category: "Variateurs de fréquence", industry: "hvac",         hint: "ACH580-01-04A1-4, ACH580-01-07A2-4, ACH580-01-012A-4" },
    { brand: "Beckhoff",           family: `EL2xxx modules sortie round ${round}`,         category: "Modules E/S",             industry: "industrie",    hint: "EL2008, EL2024, EL2034, EL2041" },
  ];
}

// ---------------------------------------------------------------------------
// Logging
// ---------------------------------------------------------------------------

function log(message: string): void {
  const line = `[${new Date().toISOString()}] ${message}`;
  console.log(line);
  fs.appendFileSync(LOG_FILE, line + "\n");
}

// ---------------------------------------------------------------------------
// Ollama
// ---------------------------------------------------------------------------

async function getBestModel(): Promise<string> {
  const res = await fetch("http://localhost:11434/api/tags");
  if (!res.ok) throw new Error(`Ollama tags HTTP ${res.status}`);
  const data = (await res.json()) as { models: Array<{ name: string }> };
  const names = data.models.map((m) => m.name);
  const preferred = ["qwen2.5:14b", "qwen2.5:7b", "llama3.1:8b", "llama3:8b", "mistral:7b", "llama2:13b", "llama2:7b"];
  for (const p of preferred) {
    const match = names.find((n) => n.startsWith(p.split(":")[0]));
    if (match) return match;
  }
  if (names.length > 0) return names[0];
  throw new Error("No Ollama models found");
}

async function callOllama(prompt: string, model: string, numPredict = 4096): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), OLLAMA_TIMEOUT_MS);
  try {
    const res = await fetch(OLLAMA_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model, prompt, stream: false, options: { temperature: 0.2, top_p: 0.9, num_predict: numPredict } }),
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`Ollama HTTP ${res.status}: ${await res.text()}`);
    return ((await res.json()) as { response: string }).response;
  } catch (err) {
    if ((err as Error).name === "AbortError") throw new Error("Ollama timeout after 300s");
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

// ---------------------------------------------------------------------------
// Sitemap
// ---------------------------------------------------------------------------

// Mirrors src/lib/normalize.ts — no import to avoid tsconfig mismatch
function normalizeRef(r: string): string {
  return r.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

// brand slug → display name built from BASE_TARGETS
const BRAND_SLUG_TO_NAME = new Map<string, string>(
  BASE_TARGETS.map((t) => [
    t.brand.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""),
    t.brand,
  ])
);

interface SitemapRef { brand: string; refNorm: string; }

async function fetchSitemapRefs(): Promise<SitemapRef[]> {
  try {
    const res = await fetch(SITEMAP_URL);
    if (!res.ok) throw new Error(`Sitemap HTTP ${res.status}`);
    const xml = await res.text();
    const refs: SitemapRef[] = [];
    // URLs are /piece/{brand-slug}/{ref-slug}
    const re = /\/piece\/([^/<\s]+)\/([^/<\s]+)/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(xml)) !== null) {
      const brandSlug = m[1];
      const refSlug   = m[2];
      const brand     = BRAND_SLUG_TO_NAME.get(brandSlug) ?? brandSlug;
      refs.push({ brand, refNorm: normalizeRef(refSlug) });
    }
    return refs;
  } catch (err) {
    log(`⚠️  Could not fetch sitemap: ${err}`);
    return [];
  }
}

// For --enrich exclusion set: just the normalized refs
async function fetchExclusionSet(): Promise<Set<string>> {
  const refs = await fetchSitemapRefs();
  return new Set(refs.map((r) => r.refNorm));
}

// ---------------------------------------------------------------------------
// Prompt builders
// ---------------------------------------------------------------------------

let enrichBatchCounter = 0;

function buildEnrichPrompt(target: Target, excluded: Set<string>): string {
  enrichBatchCounter++;
  const batchId = String(enrichBatchCounter).padStart(3, "0");
  const exclusionNote = excluded.size > 0
    ? `\nRéférences déjà dans le catalogue (NE PAS inclure) :\n${[...excluded].slice(0, 150).join(", ")}\n`
    : "";
  const hintRefs = target.hint.split(",").map((r) => `${target.brand} ${r.trim()}`).join("\n");

  return `Tu es un agent de collecte de données pour une base de pièces détachées industrielles et informatiques.

Ta mission : pour chaque référence listée ci-dessous, et pour d'autres références réelles de la même famille produit, produire un JSON strict.

Réponds UNIQUEMENT avec du JSON valide, sans texte avant ou après. Si tu n'es pas sûr d'une valeur, mets null.

## Références à traiter (batch ${batchId}) — famille : ${target.family}

${hintRefs}

Génère également 2 à 4 autres références RÉELLES et VÉRIFIABLES de la même famille. Ne fabrique aucune référence.
${exclusionNote}
## Format JSON EXACT à produire (IngestPayload) :

{
  "source": "ollama-enrich-${batchId}",
  "parts": [
    {
      "manufacturer": "${target.brand}",
      "industry": "${target.industry}",
      "reference": "REFERENCE_FABRICANT",
      "name": "Nom exact",
      "description": "Description technique courte (2-3 phrases max)",
      "status": "active",
      "category": "${target.category}",
      "normalizedCategory": "PLC",
      "industrySector": "Industrial Automation",
      "attributes": { "Clé": "Valeur" },
      "crossReferences": [{ "reference": "REF-ALT", "type": "oem", "brand": "${target.brand}" }],
      "supersededBy": "REFERENCE_REMPLACEMENT",
      "compatibleWith": ["AutreFabricant|Référence"]
    }
  ]
}

## Valeurs autorisées :
- industry : "industrie", "informatique", "automobile", "electromenager", "hvac", "electronique"
- status : "active" (produit actuellement commercialisé), "obsolete" (fin de vie / discontinué), "unknown" (si tu n'as pas l'information)
- normalizedCategory : choisir EXACTEMENT parmi : "PLC", "HMI", "Drive", "Sensor", "Switch", "Relay", "Power Supply", "Cable", "Connector", "Servo", "Robot", "Safety", "Network", "Server", "Workstation", "Laptop", "PC Component", "Storage", "Memory", "Processor", "Other"
- industrySector : choisir EXACTEMENT parmi : "Industrial Automation", "IT Infrastructure", "Telecommunications", "Energy", "Automotive", "Aerospace", "Medical", "Other"
- type (crossReferences) : "oem", "aftermarket", "ean", "mpn"
- sellerType : "constructeur", "distributeur_officiel", "aftermarket", "reconditionne", "occasion"

## Règles :
- Omets tout champ dont tu n'es pas sûr (jamais "" vide)
- JSON valide uniquement, aucun commentaire

Réponds UNIQUEMENT avec le JSON.`;
}

let updateBatchCounter = 0;

function buildUpdatePrompt(items: SitemapRef[]): string {
  updateBatchCounter++;
  const batchId = `U${String(updateBatchCounter).padStart(3, "0")}`;
  // Give Ollama brand + normalized ref so it can reconstruct the original format
  const refList = items.map((r) => `${r.brand} — ${r.refNorm}`).join("\n");

  return `Tu es un agent de mise à jour d'une base de pièces détachées industrielles et informatiques.

Ta mission : pour chaque entrée ci-dessous (format "Marque — REFNORMALISÉE"), retrouver les informations à jour et produire un JSON strict. Tu dois UNIQUEMENT répondre avec le JSON — aucun texte avant ou après.

## Pièces à mettre à jour (batch ${batchId})

${refList}

IMPORTANT : la REFNORMALISÉE est la référence sans tirets ni espaces (ex: "6ES72141AG310XB0" correspond à "6ES7214-1AG31-0XB0"). Retourne la référence dans son format OFFICIEL avec tirets/espaces (ex: "6ES7214-1AG31-0XB0").

## RÈGLE ABSOLUE : retourne UNIQUEMENT ces ${items.length} pièces. Ne génère AUCUNE nouvelle référence.

## Pour chaque pièce, vérifie et retourne :
1. Le fabricant exact (manufacturer)
2. L'industrie (industry)
3. Le statut actuel : "active", "obsolete", ou "unknown"
4. La référence de remplacement officielle si obsolète (supersededBy) — même fabricant
5. Les specs techniques clés (attributes)

## Format JSON EXACT (IngestPayload) :

{
  "source": "ollama-update-${batchId}",
  "parts": [
    {
      "manufacturer": "NomFabricant",
      "industry": "industrie",
      "reference": "REFERENCE_EXACTE",
      "name": "Nom exact du produit",
      "status": "active",
      "category": "Catégorie",
      "attributes": { "Clé": "Valeur" },
      "supersededBy": "REFERENCE_REMPLACEMENT"
    }
  ]
}

## Fabricants connus dans la base :
Siemens, Schneider Electric, ABB, Allen-Bradley, Festo, SMC, Omron, Phoenix Contact, Keysight, Fluke, WAGO, Pepperl+Fuchs, ifm, Danfoss, SEW-Eurodrive, Lenze, Mitsubishi, Beckhoff, Cisco, Juniper, Dell, HPE, Lenovo, Fortinet, Aruba, Ubiquiti, Synology, QNAP, APC

## Valeurs autorisées :
- industry : "industrie", "informatique", "automobile", "electromenager", "hvac", "electronique"
- status : "active", "obsolete", "unknown"
- sellerType : "constructeur", "distributeur_officiel", "aftermarket", "reconditionne", "occasion"

Réponds UNIQUEMENT avec le JSON.`;
}

// ---------------------------------------------------------------------------
// JSON extraction & validation
// ---------------------------------------------------------------------------

function extractPayload(raw: string): IngestPayload {
  const start = raw.indexOf("{");
  const end   = raw.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) throw new Error("No JSON object found");
  const parsed = JSON.parse(raw.slice(start, end + 1)) as IngestPayload;
  if (!Array.isArray(parsed.parts)) throw new Error("No 'parts' array in response");
  return parsed;
}

const VALID_INDUSTRIES   = new Set<Industry>(["industrie", "informatique", "automobile", "electromenager", "hvac", "electronique"]);
const VALID_STATUSES     = new Set<PartStatus>(["active", "obsolete", "unknown"]);
const VALID_SELLER_TYPES = new Set<SellerType>(["constructeur", "distributeur_officiel", "aftermarket", "reconditionne", "occasion"]);

const RESELLER_DOMAINS = [
  "mouser", "rs-online", "rscomponents", "digikey", "arrow.com", "farnell",
  "ebay", "ebay.com", "ebay.fr",
  "amazon", "amazon.com", "amazon.fr",
  "aliexpress", "aliexpress.com",
  "leboncoin.fr", "cdiscount.com", "rakuten.com",
  "radwell", "euautomation", "eu-automation", "conrad", "distrelec", "electrocomponents",
];

function isValidUrl(url: string): boolean {
  if (!url.startsWith("https://")) return false;
  if (url.includes("..."))         return false;
  if (url.length < 25)             return false;
  return true;
}

function isResellerUrl(url: string): boolean {
  const lower = url.toLowerCase();
  return RESELLER_DOMAINS.some((d) => lower.includes(d));
}

async function findProductUrl(reference: string, manufacturer: string): Promise<string | null> {
  const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
  const STRATEGY_TIMEOUT_MS = 6_000;
  const refLower = reference.toLowerCase();
  const SEARCH_BLACKLIST = [...RESELLER_DOMAINS, "etb-tech"];

  const strategies = [
    `${reference} ${manufacturer}`,
    `${reference} ${manufacturer} datasheet`,
    `${reference} ${manufacturer} buy`,
    reference,
  ];

  for (let i = 0; i < strategies.length; i++) {
    const q = encodeURIComponent(strategies[i]);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), STRATEGY_TIMEOUT_MS);

    let html: string;
    try {
      const res = await fetch(`https://html.duckduckgo.com/html/?q=${q}`, {
        headers: { "User-Agent": UA, "Accept-Language": "en-US,en;q=0.9" },
        signal: controller.signal,
      });
      if (!res.ok) { clearTimeout(timer); continue; }
      html = await res.text();
    } catch {
      clearTimeout(timer);
      continue;
    } finally {
      clearTimeout(timer);
    }

    // DDG HTML embeds uddg=ENCODED_URL in redirect hrefs — decode them in order
    const uddgRe = /uddg=([^&"'\s>]+)/g;
    let m: RegExpExecArray | null;

    while ((m = uddgRe.exec(html)) !== null) {
      let url: string;
      try { url = decodeURIComponent(m[1]); } catch { continue; }
      if (!url.startsWith("https://")) continue;

      const urlLower = url.toLowerCase();
      if (SEARCH_BLACKLIST.some((d) => urlLower.includes(d))) continue;

      // Accept if reference is in URL or in surrounding HTML context (link title + snippet)
      const ctxStart = Math.max(0, m.index - 500);
      const context = html.slice(ctxStart, m.index + 200).toLowerCase();
      if (urlLower.includes(refLower) || context.includes(refLower)) {
        console.log(`   URL found via strategy ${i + 1}: ${url}`);
        return url;
      }
    }
  }

  return null;
}

function validateParts(raw: IngestPart[], defaultIndustry: Industry = "industrie"): IngestPart[] {
  const valid: IngestPart[] = [];
  for (const p of raw) {
    if (!p.reference?.trim() || !p.name || !p.manufacturer) continue;
    if (!VALID_INDUSTRIES.has(p.industry))              p.industry = defaultIndustry;
    if (p.status && !VALID_STATUSES.has(p.status))      p.status = "unknown";

    // productUrl: must be a valid https URL, not a placeholder, not a reseller
    if (p.productUrl) {
      if (!isValidUrl(p.productUrl) || isResellerUrl(p.productUrl)) delete p.productUrl;
    }

    if (p.offers) {
      p.offers = p.offers.filter((o) => {
        if (!isValidUrl(o.url ?? ""))                           return false;
        if (!o.sellerName || !VALID_SELLER_TYPES.has(o.sellerType)) return false;
        if (o.price !== undefined) {
          const n = Number(o.price);
          if (isNaN(n) || n <= 0 || n > 2_000_000)             return false;
        }
        return true;
      });
      if (p.offers.length === 0) delete p.offers;
    }

    p.reference = p.reference.trim();
    valid.push(p);
  }
  return valid;
}

// ---------------------------------------------------------------------------
// API
// ---------------------------------------------------------------------------

async function sendToApi(payload: IngestPayload): Promise<IngestResult> {
  const res = await fetch(INGEST_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${INGEST_API_KEY}` },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Ingest API HTTP ${res.status}: ${await res.text()}`);
  return (await res.json()) as IngestResult;
}

// ---------------------------------------------------------------------------
// Mode: --clean
// ---------------------------------------------------------------------------

const LIFECYCLE_PENDING_URL = "https://spare-part-bdd.vercel.app/api/lifecycle/pending";
const CLEAN_BATCH_SIZE = 8;

let cleanBatchCounter = 0;

interface LifecyclePart {
  id: number;
  manufacturer: string;
  reference: string;
  productUrl: string;
  status: string;
}

function buildCleanPrompt(parts: LifecyclePart[]): string {
  cleanBatchCounter++;
  const batchId = `C${String(cleanBatchCounter).padStart(3, "0")}`;
  const list = parts.map((p) => `${p.manufacturer} ${p.reference}`).join("\n");
  return `Tu es un agent de correction de données pour une base de pièces détachées.

Pour chaque pièce ci-dessous, donne l'URL EXACTE de sa page produit officielle chez le fabricant.
Si tu ne connais pas l'URL exacte (pas seulement la page d'accueil ou une catégorie), OMETS le champ productUrl.

## Pièces à corriger (batch ${batchId})

${list}

## Format JSON EXACT (IngestPayload) :

{
  "source": "ollama-clean-${batchId}",
  "parts": [
    {
      "manufacturer": "NomFabricant",
      "industry": "industrie",
      "reference": "REFERENCE_EXACTE",
      "name": "Nom du produit",
      "status": "active",
      "productUrl": "https://url-exacte-page-produit.com/ref"
    }
  ]
}

## Règles STRICTES :
- productUrl doit pointer sur la page SPÉCIFIQUE du produit (avec la référence dans l'URL ou en titre de page)
- Ne mets JAMAIS une URL de catégorie ou avec '...' en placeholder
- Si tu n'es pas certain à 100% de l'URL exacte, OMETS le champ productUrl
- industry valeurs : "industrie", "informatique", "automobile", "electromenager", "hvac", "electronique"
- Réponds UNIQUEMENT avec le JSON.`;
}

async function runCleanMode(model: string): Promise<void> {
  log("🧹  [clean] Fetching parts with productUrl from lifecycle/pending…");

  const res = await fetch(`${LIFECYCLE_PENDING_URL}?limit=500`, {
    headers: { Authorization: `Bearer ${INGEST_API_KEY}` },
  });
  if (!res.ok) {
    log(`❌  lifecycle/pending HTTP ${res.status}: ${await res.text()}`);
    return;
  }
  const { parts: allParts } = (await res.json()) as { parts: LifecyclePart[] };
  log(`📋  ${allParts.length} parts with productUrl in lifecycle pending`);

  // Filter: productUrls that are clearly wrong (contain '...' or too short)
  const badParts = allParts.filter((p) => !isValidUrl(p.productUrl));
  log(`🔎  ${badParts.length} parts with bad productUrl (placeholder / too short)`);

  if (badParts.length === 0) { log("✅  No bad productUrls found. Nothing to clean."); return; }

  // Note: offer.url cleanup is NOT possible via the existing ingest API (offers are insert-only).
  // Bad offer.url rows already in DB must be cleaned via a direct DB migration or new API endpoint.
  log("⚠️  NOTE: offer.url cleanup requires direct DB access — ingest API is insert-only for offers.");
  log("         Only productUrl will be cleaned in this run.");

  let totalUpdated = 0, totalErrors = 0;
  let offset = 0;

  while (offset < badParts.length) {
    const batch = badParts.slice(offset, offset + CLEAN_BATCH_SIZE);
    log(`▶  [clean] batch ${Math.floor(offset / CLEAN_BATCH_SIZE) + 1}/${Math.ceil(badParts.length / CLEAN_BATCH_SIZE)} — ${batch.map((p) => p.reference).join(", ")}`);

    let raw: string;
    try { raw = await callOllama(buildCleanPrompt(batch), model); }
    catch (err) { log(`❌  Ollama: ${err}`); totalErrors++; offset += CLEAN_BATCH_SIZE; if (ONCE_MODE) break; await pause(); continue; }

    let payload: IngestPayload;
    try { payload = extractPayload(raw); }
    catch (err) { log(`❌  JSON parse: ${err}\n   Raw (500): ${raw.slice(0, 500)}`); totalErrors++; offset += CLEAN_BATCH_SIZE; if (ONCE_MODE) break; await pause(); continue; }

    // Keep only parts that now have a valid productUrl
    const batchRefs = new Set(batch.map((p) => normalizeRef(p.reference)));
    const partsWithValidUrl = validateParts(payload.parts)
      .filter((p) => batchRefs.has(normalizeRef(p.reference)) && p.productUrl);

    if (partsWithValidUrl.length === 0) {
      log(`⚠️  Ollama couldn't find valid productUrls for this batch — skipping`);
      offset += CLEAN_BATCH_SIZE; if (ONCE_MODE) break; await pause(); continue;
    }

    log(`   ${partsWithValidUrl.length}/${batch.length} parts got a valid productUrl`);

    let result: IngestResult;
    try { result = await sendToApi({ source: payload.source || `ollama-clean-${cleanBatchCounter}`, parts: partsWithValidUrl }); }
    catch (err) { log(`❌  API: ${err}`); totalErrors++; offset += CLEAN_BATCH_SIZE; if (ONCE_MODE) break; await pause(); continue; }

    totalUpdated += result.partsUpdated ?? 0;
    log(`✅  Clean batch: ~${result.partsUpdated} productUrls corrected${result.errors?.length ? ` (${result.errors.length} errors)` : ""}`);
    console.log(`\n   📊  Clean session: ~${totalUpdated} updated, ${totalErrors} errors\n`);

    offset += CLEAN_BATCH_SIZE;
    if (ONCE_MODE) { log("--once: stopping."); break; }
    await pause();
  }

  log(`\n🏁  Clean done. ~${totalUpdated} productUrls corrected, ${totalErrors} errors`);
}

// ---------------------------------------------------------------------------
// Progress tracking
// ---------------------------------------------------------------------------

interface ProgressTracker {
  totalTargets: number;
  processed: number;
  enriched: number;
  skipped: number;
  failed: number;
  batchTimes: number[];
}

function makeTracker(totalTargets: number): ProgressTracker {
  return { totalTargets, processed: 0, enriched: 0, skipped: 0, failed: 0, batchTimes: [] };
}

function tickProgress(tracker: ProgressTracker, batchMs: number, type: "enriched" | "skipped" | "failed"): void {
  tracker.processed++;
  tracker.batchTimes.push(batchMs);
  if (tracker.batchTimes.length > 10) tracker.batchTimes.shift();
  if (type === "enriched") tracker.enriched++;
  else if (type === "skipped") tracker.skipped++;
  else tracker.failed++;

  if (tracker.processed % 10 === 0) {
    const avgMs = tracker.batchTimes.reduce((a, b) => a + b, 0) / tracker.batchTimes.length;
    const remaining = Math.max(0, tracker.totalTargets - tracker.processed);
    const etaMin = Math.round((avgMs * remaining) / 60_000);
    console.log(`[Progress] ${tracker.processed}/${tracker.totalTargets} processed | ${tracker.enriched} enriched | ${tracker.skipped} skipped | ${tracker.failed} failed | ETA: ~${etaMin}min`);
  }
}

// ---------------------------------------------------------------------------
// Mode: --enrich
// ---------------------------------------------------------------------------

async function runEnrichMode(model: string): Promise<void> {
  const state = loadState();
  let { batchIndex, generationRound } = state.enrich;

  let targets = batchIndex < BASE_TARGETS.length
    ? [...BASE_TARGETS]
    : [...BASE_TARGETS, ...generateNewTargets(generationRound)];

  const excluded = await fetchExclusionSet();
  log(`📋  ${excluded.size} references in catalogue (exclusion list)`);

  let totalInserted = 0, totalUpdated = 0, totalOffers = 0, totalErrors = 0;
  const tracker = makeTracker(targets.length);

  while (true) {
    if (batchIndex >= targets.length) {
      if (ONCE_MODE) break;
      generationRound++;
      targets = [...BASE_TARGETS, ...generateNewTargets(generationRound)];
      batchIndex = 0;
      tracker.totalTargets = targets.length;
      const refreshed = await fetchExclusionSet();
      for (const r of refreshed) excluded.add(r);
      log(`📋  Exclusion list refreshed: ${excluded.size} refs`);
    }

    const target = targets[batchIndex];
    log(`▶  [enrich] ${target.brand} › ${target.family}`);
    const batchStart = Date.now();
    const prompt = buildEnrichPrompt(target, excluded);

    let raw: string;
    try {
      raw = await callOllama(prompt, model);
    } catch (err) {
      log(`❌  Ollama: ${err}`);
      totalErrors++;
      batchIndex++;
      tickProgress(tracker, Date.now() - batchStart, "failed");
      saveState({ ...state, enrich: { batchIndex, generationRound }, lastRun: new Date().toISOString() });
      if (ONCE_MODE) break;
      await pause();
      continue;
    }

    let payload: IngestPayload;
    try {
      payload = extractPayload(raw);
    } catch (parseErr) {
      log(`⚠️  JSON parse failed, retrying with num_predict: 6000…`);
      try {
        raw = await callOllama(prompt, model, 6000);
        payload = extractPayload(raw);
      } catch (err2) {
        log(`❌  JSON parse retry failed: ${err2}\n   Raw (500): ${raw.slice(0, 500)}`);
        totalErrors++;
        batchIndex++;
        tickProgress(tracker, Date.now() - batchStart, "failed");
        saveState({ ...state, enrich: { batchIndex, generationRound }, lastRun: new Date().toISOString() });
        if (ONCE_MODE) break;
        await pause();
        continue;
      }
    }

    const parts = validateParts(payload.parts, target.industry).filter((p) => !excluded.has(normalizeRef(p.reference)));
    if (parts.length === 0) {
      log(`⚠️  No valid parts for ${target.family}`);
      batchIndex++;
      tickProgress(tracker, Date.now() - batchStart, "skipped");
      saveState({ ...state, enrich: { batchIndex, generationRound }, lastRun: new Date().toISOString() });
      if (ONCE_MODE) break;
      await pause();
      continue;
    }

    log(`   Validated ${parts.length} parts (${payload.parts.length - parts.length} dropped)`);

    for (const part of parts) {
      const productUrl = await findProductUrl(part.reference, part.manufacturer);
      if (productUrl) { part.productUrl = productUrl; log(`   🔗  ${part.reference} → ${productUrl}`); }
      part.offers = [{
        sellerName: "Radwell",
        sellerType: "reconditionne",
        sellerWebsite: "https://www.radwell.com",
        url: `https://www.radwell.com/en-US/search/?QueryText=${encodeURIComponent(part.reference)}`,
      }];
    }

    let result: IngestResult;
    try {
      result = await sendToApi({ source: payload.source || `ollama-enrich-${enrichBatchCounter}`, parts });
    } catch (err) {
      log(`❌  API: ${err}`);
      totalErrors++;
      batchIndex++;
      tickProgress(tracker, Date.now() - batchStart, "failed");
      saveState({ ...state, enrich: { batchIndex, generationRound }, lastRun: new Date().toISOString() });
      if (ONCE_MODE) break;
      await pause();
      continue;
    }

    for (const p of parts) excluded.add(normalizeRef(p.reference));

    totalInserted += result.partsInserted ?? 0;
    totalUpdated  += result.partsUpdated  ?? 0;
    totalOffers   += result.offersInserted ?? 0;

    log(`✅  ${target.brand} › ${target.family}: +${result.partsInserted} inserted, ~${result.partsUpdated} updated, ${result.offersInserted} offers${result.errors?.length ? ` (${result.errors.length} API errors)` : ""}`);
    console.log(`\n   📊  Session: +${totalInserted} inserted, ~${totalUpdated} updated, ${totalOffers} offers, ${totalErrors} errors\n`);

    batchIndex++;
    tickProgress(tracker, Date.now() - batchStart, "enriched");
    const newLastStats: LastStats = {
      processed: tracker.processed, enriched: tracker.enriched,
      skipped: tracker.skipped, failed: tracker.failed, asOf: new Date().toISOString(),
    };
    saveState({ ...state, enrich: { batchIndex, generationRound }, lastRun: new Date().toISOString(), lastStats: newLastStats });
    if (ONCE_MODE) { log("--once: stopping."); break; }
    await pause();
  }

  log(`\n🏁  Enrich done. +${totalInserted} inserted, ~${totalUpdated} updated, ${totalOffers} offers, ${totalErrors} errors`);
}

// ---------------------------------------------------------------------------
// Mode: --update
// ---------------------------------------------------------------------------

async function runUpdateMode(model: string): Promise<void> {
  const state = loadState();

  log("🔄  Fetching all existing refs from sitemap…");
  const allRefs = await fetchSitemapRefs();
  if (allRefs.length === 0) { log("⚠️  No refs found in sitemap. Is the catalogue empty?"); return; }
  log(`📋  ${allRefs.length} refs to update (from /piece/ sitemap entries)`);

  let offset = state.update.batchOffset;
  if (offset >= allRefs.length) {
    log("🔄  All refs processed — restarting from beginning");
    offset = 0;
  }

  let totalInserted = 0, totalUpdated = 0, totalOffers = 0, totalErrors = 0;
  const totalBatches = Math.ceil(allRefs.length / UPDATE_BATCH_SIZE);
  const tracker = makeTracker(totalBatches);

  while (offset < allRefs.length) {
    const batch = allRefs.slice(offset, offset + UPDATE_BATCH_SIZE);
    const batchNorms = new Set(batch.map((r) => r.refNorm));
    log(`▶  [update] batch ${Math.floor(offset / UPDATE_BATCH_SIZE) + 1}/${totalBatches} — ${batch.map((r) => r.refNorm).join(", ")}`);
    const batchStart = Date.now();
    const prompt = buildUpdatePrompt(batch);

    let raw: string;
    try {
      raw = await callOllama(prompt, model);
    } catch (err) {
      log(`❌  Ollama: ${err}`);
      totalErrors++;
      offset += UPDATE_BATCH_SIZE;
      tickProgress(tracker, Date.now() - batchStart, "failed");
      saveState({ ...state, update: { batchOffset: offset }, lastRun: new Date().toISOString() });
      if (ONCE_MODE) break;
      await pause();
      continue;
    }

    let payload: IngestPayload;
    try {
      payload = extractPayload(raw);
    } catch {
      log(`⚠️  JSON parse failed, retrying with num_predict: 6000…`);
      try {
        raw = await callOllama(prompt, model, 6000);
        payload = extractPayload(raw);
      } catch (err2) {
        log(`❌  JSON parse retry failed: ${err2}\n   Raw (500): ${raw.slice(0, 500)}`);
        totalErrors++;
        offset += UPDATE_BATCH_SIZE;
        tickProgress(tracker, Date.now() - batchStart, "failed");
        saveState({ ...state, update: { batchOffset: offset }, lastRun: new Date().toISOString() });
        if (ONCE_MODE) break;
        await pause();
        continue;
      }
    }

    const parts = validateParts(payload.parts).filter((p) => batchNorms.has(normalizeRef(p.reference)));

    if (parts.length === 0) {
      log(`⚠️  No valid parts returned for this batch`);
      offset += UPDATE_BATCH_SIZE;
      tickProgress(tracker, Date.now() - batchStart, "skipped");
      saveState({ ...state, update: { batchOffset: offset }, lastRun: new Date().toISOString() });
      if (ONCE_MODE) break;
      await pause();
      continue;
    }

    log(`   Validated ${parts.length}/${batch.length} refs`);

    for (const part of parts) {
      const productUrl = await findProductUrl(part.reference, part.manufacturer);
      if (productUrl) { part.productUrl = productUrl; log(`   🔗  ${part.reference} → ${productUrl}`); }
      part.offers = [{
        sellerName: "Radwell",
        sellerType: "reconditionne",
        sellerWebsite: "https://www.radwell.com",
        url: `https://www.radwell.com/en-US/search/?QueryText=${encodeURIComponent(part.reference)}`,
      }];
    }

    let result: IngestResult;
    try {
      result = await sendToApi({ source: payload.source || `ollama-update-${updateBatchCounter}`, parts });
    } catch (err) {
      log(`❌  API: ${err}`);
      totalErrors++;
      offset += UPDATE_BATCH_SIZE;
      tickProgress(tracker, Date.now() - batchStart, "failed");
      saveState({ ...state, update: { batchOffset: offset }, lastRun: new Date().toISOString() });
      if (ONCE_MODE) break;
      await pause();
      continue;
    }

    totalInserted += result.partsInserted ?? 0;
    totalUpdated  += result.partsUpdated  ?? 0;
    totalOffers   += result.offersInserted ?? 0;

    log(`✅  Updated ${parts.length} parts: +${result.partsInserted} inserted, ~${result.partsUpdated} updated, ${result.offersInserted} offers${result.errors?.length ? ` (${result.errors.length} API errors)` : ""}`);
    console.log(`\n   📊  Session: +${totalInserted} inserted, ~${totalUpdated} updated, ${totalOffers} offers, ${totalErrors} errors\n`);

    offset += UPDATE_BATCH_SIZE;
    tickProgress(tracker, Date.now() - batchStart, "enriched");
    saveState({ ...state, update: { batchOffset: offset }, lastRun: new Date().toISOString() });
    if (ONCE_MODE) { log("--once: stopping."); break; }
    await pause();
  }

  if (!ONCE_MODE) {
    saveState({ ...state, update: { batchOffset: 0 }, lastRun: new Date().toISOString() });
    log(`\n🏁  Update cycle complete. +${totalInserted} inserted, ~${totalUpdated} updated, ${totalOffers} offers, ${totalErrors} errors`);
  } else {
    log(`\n🏁  Update done. +${totalInserted} inserted, ~${totalUpdated} updated, ${totalOffers} offers, ${totalErrors} errors`);
  }
}

// ---------------------------------------------------------------------------
// Mode: --stats
// ---------------------------------------------------------------------------

async function runStatsMode(): Promise<void> {
  console.log("=== SparePartSearch Stats ===");

  const state = loadState();

  // Total parts and per-brand breakdown from sitemap
  let total = 0;
  const byBrand = new Map<string, number>();
  try {
    const refs = await fetchSitemapRefs();
    total = refs.length;
    for (const r of refs) byBrand.set(r.brand, (byBrand.get(r.brand) ?? 0) + 1);
  } catch (err) {
    console.log(`(Could not fetch sitemap: ${err})`);
  }

  console.log(`Total parts: ${total.toLocaleString()}`);

  // Missing productUrl from lifecycle/pending
  try {
    const res = await fetch(`${LIFECYCLE_PENDING_URL}?limit=2000`, {
      headers: { Authorization: `Bearer ${INGEST_API_KEY}` },
    });
    if (res.ok) {
      const { parts } = (await res.json()) as { parts: LifecyclePart[] };
      const missing = parts.filter((p) => !p.productUrl || !isValidUrl(p.productUrl)).length;
      console.log(`Missing productUrl: ${missing}`);
    }
  } catch { /* optional */ }

  // Top manufacturers
  const sorted = [...byBrand.entries()].sort((a, b) => b[1] - a[1]).slice(0, 7);
  if (sorted.length > 0) {
    console.log(`Top manufacturers: ${sorted.map(([m, c]) => `${m} (${c})`).join(", ")}`);
  }

  // Queue and last session stats from state
  const totalEnrichTargets = BASE_TARGETS.length + generateNewTargets(state.enrich.generationRound).length;
  const queueRemaining = Math.max(0, totalEnrichTargets - state.enrich.batchIndex);
  console.log(`Queue remaining: ~${queueRemaining} targets`);

  if (state.lastRun) {
    const d = new Date(state.lastRun);
    console.log(`Last run: ${d.toISOString().replace("T", " ").slice(0, 16)}`);
  }

  if (state.lastStats) {
    const s = state.lastStats;
    console.log(`Last session: ${s.processed} processed | ${s.enriched} enriched | ${s.skipped} skipped | ${s.failed} failed (as of ${s.asOf.slice(0, 16)})`);
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function pause(): Promise<void> {
  return new Promise((r) => setTimeout(r, BATCH_PAUSE_MS));
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

process.on("SIGINT", () => {
  console.log("\n🛑  Ctrl+C — stopping after current batch…");
  process.exit(0);
});

async function main(): Promise<void> {
  const modeLabel = STATS_MODE ? "--stats" : UPDATE_MODE ? "--update" : CLEAN_MODE ? "--clean" : "--enrich";
  console.log("═══════════════════════════════════════════════════════════");
  console.log("   SparePartSearch — Catalog Accumulator");
  console.log(`   Mode: ${modeLabel}${ONCE_MODE ? " --once" : STATS_MODE ? "" : " (continuous)"}`);
  console.log("═══════════════════════════════════════════════════════════\n");

  if (STATS_MODE) {
    await runStatsMode();
    return;
  }

  let model: string;
  try { model = await getBestModel(); log(`🤖  Using Ollama model: ${model}`); }
  catch (err) { console.error(`❌  ${err}`); process.exit(1); }

  if (UPDATE_MODE) {
    await runUpdateMode(model);
  } else if (CLEAN_MODE) {
    await runCleanMode(model);
  } else {
    await runEnrichMode(model);
  }
}

main().catch((err) => { console.error("Fatal:", err); process.exit(1); });
