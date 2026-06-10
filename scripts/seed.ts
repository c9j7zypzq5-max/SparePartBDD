/**
 * Seed de démonstration — verticales industrie et informatique uniquement.
 * Données réalistes dans leur forme mais de DÉMO : non garanties exactes.
 *
 * Usage : npm run db:push && npm run seed
 */
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../src/db/schema";
import { normalizeReference, referenceSlug, slugify } from "../src/lib/normalize";

const connectionString =
  process.env.DATABASE_URL ?? "postgres://localhost:5432/sparepart";

const client = postgres(connectionString, { max: 1 });
const db = drizzle(client, { schema });

type Industry = (typeof schema.industryEnum.enumValues)[number];
type Status = (typeof schema.partStatusEnum.enumValues)[number];

interface SeedPart {
  manufacturer: string;
  industry: Industry;
  reference: string;
  name: string;
  description: string;
  status: Status;
  category: string;
  attributes?: Record<string, string>;
  crossRefs?: { reference: string; type: "oem" | "aftermarket" | "ean" | "mpn"; brand?: string }[];
  /** Référence (même fabricant) qui remplace officiellement cette pièce */
  supersededBy?: string;
  /** Références compatibles non officielles : "Fabricant|Référence" */
  compatibleWith?: string[];
  offers?: { seller: string; price?: number; availability?: string }[];
}

const MANUFACTURERS: { name: string; industry: Industry; website: string }[] = [
  { name: "Siemens", industry: "industrie", website: "https://www.siemens.com" },
  { name: "Schneider Electric", industry: "industrie", website: "https://www.se.com" },
  { name: "ABB", industry: "industrie", website: "https://www.abb.com" },
  { name: "Rockwell Automation", industry: "industrie", website: "https://www.rockwellautomation.com" },
  { name: "Festo", industry: "industrie", website: "https://www.festo.com" },
  { name: "Cisco", industry: "informatique", website: "https://www.cisco.com" },
  { name: "Dell", industry: "informatique", website: "https://www.dell.com" },
  { name: "HPE", industry: "informatique", website: "https://www.hpe.com" },
  { name: "Lenovo", industry: "informatique", website: "https://www.lenovo.com" },
];

const CATEGORIES: { name: string; industry: Industry }[] = [
  { name: "Automates programmables", industry: "industrie" },
  { name: "Variateurs de vitesse", industry: "industrie" },
  { name: "Contacteurs", industry: "industrie" },
  { name: "Alimentations industrielles", industry: "industrie" },
  { name: "IHM et pupitres", industry: "industrie" },
  { name: "Pneumatique", industry: "industrie" },
  { name: "Alimentations serveur et réseau", industry: "informatique" },
  { name: "Modules optiques SFP", industry: "informatique" },
  { name: "Modules réseau", industry: "informatique" },
  { name: "Batteries d'ordinateur portable", industry: "informatique" },
  { name: "Contrôleurs RAID", industry: "informatique" },
  { name: "Stockage serveur", industry: "informatique" },
];

const SELLERS: {
  name: string;
  type: (typeof schema.sellerTypeEnum.enumValues)[number];
  website: string;
  country: string;
}[] = [
  { name: "Siemens Industry Mall", type: "constructeur", website: "https://mall.industry.siemens.com", country: "DE" },
  { name: "RS Components", type: "distributeur_officiel", website: "https://www.rs-online.com", country: "GB" },
  { name: "Radwell", type: "reconditionne", website: "https://www.radwell.com", country: "US" },
  { name: "EU Automation", type: "aftermarket", website: "https://www.euautomation.com", country: "GB" },
  { name: "ServerSupply", type: "aftermarket", website: "https://www.serversupply.com", country: "US" },
  { name: "ETB Technologies", type: "reconditionne", website: "https://www.etb-tech.com", country: "GB" },
  { name: "eBay", type: "occasion", website: "https://www.ebay.fr", country: "FR" },
];

const PARTS: SeedPart[] = [
  // ─── Industrie ───
  {
    manufacturer: "Siemens",
    industry: "industrie",
    reference: "6ES7214-1AG31-0XB0",
    name: "CPU S7-1200 1214C DC/DC/DC (gén. 3)",
    description:
      "Automate SIMATIC S7-1200, CPU 1214C. Phase-out annoncé : remplacé par 6ES7214-1AG40-0XB0.",
    status: "obsolete",
    category: "Automates programmables",
    supersededBy: "6ES7214-1AG40-0XB0",
    offers: [
      { seller: "Radwell", price: 420.0, availability: "Reconditionné, garanti 2 ans" },
      { seller: "EU Automation", price: 465.0, availability: "Surplus neuf" },
    ],
  },
  {
    manufacturer: "Siemens",
    industry: "industrie",
    reference: "6ES7214-1AG40-0XB0",
    name: "CPU S7-1200 1214C DC/DC/DC",
    description:
      "Automate SIMATIC S7-1200, CPU 1214C, 14 entrées / 10 sorties TOR, 2 entrées analogiques.",
    status: "active",
    category: "Automates programmables",
    attributes: { Alimentation: "24 V DC", Mémoire: "100 KB", "E/S TOR": "14 E / 10 S" },
    offers: [
      { seller: "Siemens Industry Mall", price: 545.0, availability: "En stock" },
      { seller: "RS Components", price: 520.0, availability: "En stock" },
      { seller: "Radwell", price: 389.0, availability: "Surplus neuf" },
      { seller: "eBay", price: 310.0, availability: "Occasion" },
    ],
  },
  {
    manufacturer: "Siemens",
    industry: "industrie",
    reference: "6ES7315-2AH14-0AB0",
    name: "CPU S7-300 315-2 DP",
    description:
      "Automate SIMATIC S7-300, CPU 315-2 DP avec interface PROFIBUS. Gamme S7-300 en phase-out global (PM410), pièces disponibles jusqu'en 2033 environ.",
    status: "obsolete",
    category: "Automates programmables",
    attributes: { Mémoire: "256 KB", Interface: "MPI + PROFIBUS DP" },
    offers: [
      { seller: "Radwell", price: 780.0, availability: "Reconditionné, garanti 2 ans" },
      { seller: "EU Automation", price: 950.0, availability: "Surplus neuf" },
      { seller: "eBay", price: 420.0, availability: "Occasion testée" },
    ],
  },
  {
    manufacturer: "Siemens",
    industry: "industrie",
    reference: "6SE6440-2UD21-5AA1",
    name: "Variateur MICROMASTER 440, 1,5 kW",
    description:
      "Variateur de fréquence MICROMASTER 440. Gamme arrêtée par Siemens, successeur conseillé : SINAMICS G120C (6SL3210-1KE21-3UF1).",
    status: "obsolete",
    category: "Variateurs de vitesse",
    supersededBy: "6SL3210-1KE21-3UF1",
    offers: [
      { seller: "Radwell", price: 520.0, availability: "Reconditionné, garanti 2 ans" },
      { seller: "eBay", price: 350.0, availability: "Occasion" },
    ],
  },
  {
    manufacturer: "Siemens",
    industry: "industrie",
    reference: "6SL3210-1KE21-3UF1",
    name: "Variateur SINAMICS G120C, 5,5 kW",
    description:
      "Variateur de fréquence compact SINAMICS G120C, successeur de la gamme MICROMASTER.",
    status: "active",
    category: "Variateurs de vitesse",
    attributes: { Puissance: "5,5 kW", Tension: "380-480 V triphasé" },
    offers: [
      { seller: "Siemens Industry Mall", price: 890.0, availability: "En stock" },
      { seller: "RS Components", price: 870.0, availability: "En stock" },
    ],
  },
  {
    manufacturer: "Siemens",
    industry: "industrie",
    reference: "6EP1334-2BA20",
    name: "Alimentation SITOP PSU100S 24 V / 10 A",
    description:
      "Alimentation stabilisée SITOP smart, entrée 120/230 V AC, sortie 24 V DC 10 A, rail DIN.",
    status: "active",
    category: "Alimentations industrielles",
    attributes: { Sortie: "24 V DC / 10 A", Entrée: "120-230 V AC" },
    offers: [
      { seller: "RS Components", price: 145.0, availability: "En stock" },
      { seller: "Radwell", price: 98.0, availability: "Surplus neuf" },
    ],
  },
  {
    manufacturer: "Schneider Electric",
    industry: "industrie",
    reference: "LC1D18M7",
    name: "Contacteur TeSys D 18 A, bobine 220 V AC",
    description:
      "Contacteur tripolaire TeSys Deca 18 A AC-3, bobine 220-230 V 50/60 Hz.",
    status: "active",
    category: "Contacteurs",
    attributes: { Calibre: "18 A AC-3", Bobine: "220-230 V AC" },
    compatibleWith: ["ABB|1SBL177001R8010"],
    offers: [
      { seller: "RS Components", price: 58.0, availability: "En stock" },
      { seller: "Radwell", price: 48.0, availability: "Surplus neuf" },
      { seller: "eBay", price: 32.0, availability: "Neuf" },
    ],
  },
  {
    manufacturer: "Schneider Electric",
    industry: "industrie",
    reference: "ATV312HU15N4",
    name: "Variateur Altivar 312, 1,5 kW",
    description:
      "Variateur de fréquence ATV312 1,5 kW 380-500 V. Gamme retirée du catalogue, remplacement officiel : Altivar Machine ATV320.",
    status: "obsolete",
    category: "Variateurs de vitesse",
    supersededBy: "ATV320U15N4B",
    offers: [
      { seller: "Radwell", price: 310.0, availability: "Reconditionné, garanti 2 ans" },
      { seller: "EU Automation", price: 365.0, availability: "Surplus neuf" },
      { seller: "eBay", price: 180.0, availability: "Occasion" },
    ],
  },
  {
    manufacturer: "Schneider Electric",
    industry: "industrie",
    reference: "ATV320U15N4B",
    name: "Variateur Altivar Machine ATV320, 1,5 kW",
    description:
      "Variateur de fréquence ATV320 format book, 1,5 kW 380-500 V, successeur de l'ATV312.",
    status: "active",
    category: "Variateurs de vitesse",
    attributes: { Puissance: "1,5 kW", Tension: "380-500 V" },
    offers: [
      { seller: "RS Components", price: 420.0, availability: "En stock" },
    ],
  },
  {
    manufacturer: "ABB",
    industry: "industrie",
    reference: "1SBL177001R8010",
    name: "Contacteur AF16-30-10-80, 18 A",
    description:
      "Contacteur tripolaire AF16, bobine large plage 100-250 V AC/DC, contact auxiliaire 1 NO.",
    status: "active",
    category: "Contacteurs",
    attributes: { Calibre: "18 A", Bobine: "100-250 V AC/DC" },
    compatibleWith: ["Schneider Electric|LC1D18M7"],
    offers: [
      { seller: "RS Components", price: 61.0, availability: "En stock" },
      { seller: "Radwell", price: 52.5, availability: "Surplus neuf" },
    ],
  },
  {
    manufacturer: "ABB",
    industry: "industrie",
    reference: "ACS550-01-038A-4",
    name: "Variateur ACS550, 18,5 kW",
    description:
      "Variateur de fréquence ACS550 18,5 kW triphasé 400 V. Gamme remplacée par les ACS580.",
    status: "obsolete",
    category: "Variateurs de vitesse",
    offers: [
      { seller: "Radwell", price: 850.0, availability: "Reconditionné, garanti 2 ans" },
      { seller: "EU Automation", price: 1100.0, availability: "Surplus neuf" },
    ],
  },
  {
    manufacturer: "Rockwell Automation",
    industry: "industrie",
    reference: "2711P-T7C4D8",
    name: "Terminal opérateur PanelView Plus 7",
    description:
      "IHM tactile PanelView Plus 7 Standard 6,5\" Allen-Bradley, Ethernet, 24 V DC.",
    status: "active",
    category: "IHM et pupitres",
    attributes: { Écran: "6,5\" tactile", Alimentation: "24 V DC" },
    offers: [
      { seller: "Radwell", price: 1450.0, availability: "Surplus neuf" },
      { seller: "eBay", price: 980.0, availability: "Occasion" },
    ],
  },
  {
    manufacturer: "Rockwell Automation",
    industry: "industrie",
    reference: "1756-L61",
    name: "Processeur ControlLogix 5561",
    description:
      "CPU ControlLogix série 1756, 2 Mo de mémoire. Statut Discontinued chez Rockwell, migration conseillée vers ControlLogix 5580.",
    status: "obsolete",
    category: "Automates programmables",
    attributes: { Mémoire: "2 Mo" },
    offers: [
      { seller: "Radwell", price: 1900.0, availability: "Reconditionné, garanti 2 ans" },
      { seller: "EU Automation", price: 2400.0, availability: "Surplus neuf" },
      { seller: "eBay", price: 850.0, availability: "Occasion" },
    ],
  },
  {
    manufacturer: "Festo",
    industry: "industrie",
    reference: "DSBC-32-100-PPVA-N3",
    name: "Vérin normalisé DSBC Ø32, course 100 mm",
    description:
      "Vérin pneumatique double effet ISO 15552, amortissement pneumatique réglable.",
    status: "active",
    category: "Pneumatique",
    attributes: { Diamètre: "32 mm", Course: "100 mm" },
    offers: [
      { seller: "RS Components", price: 89.0, availability: "En stock" },
    ],
  },

  // ─── Informatique ───
  {
    manufacturer: "Cisco",
    industry: "informatique",
    reference: "PWR-C1-715WAC",
    name: "Alimentation 715 W AC Catalyst 3850/9300",
    description:
      "Bloc d'alimentation 715 W AC pour commutateurs Cisco Catalyst 3850 et 9300. Annoncé en fin de vie (EoS), successeur : PWR-C1-715WAC-P.",
    status: "obsolete",
    category: "Alimentations serveur et réseau",
    supersededBy: "PWR-C1-715WAC-P",
    crossRefs: [{ reference: "341-0612-02", type: "mpn", brand: "Cisco" }],
    offers: [
      { seller: "ServerSupply", price: 145.0, availability: "Refurbished" },
      { seller: "eBay", price: 89.0, availability: "Occasion testée" },
    ],
  },
  {
    manufacturer: "Cisco",
    industry: "informatique",
    reference: "PWR-C1-715WAC-P",
    name: "Alimentation 715 W AC platine Catalyst 9300",
    description:
      "Bloc d'alimentation 715 W AC haut rendement (platinum) pour Catalyst 9300, remplace PWR-C1-715WAC.",
    status: "active",
    category: "Alimentations serveur et réseau",
    offers: [{ seller: "ServerSupply", price: 320.0, availability: "Neuf" }],
  },
  {
    manufacturer: "Cisco",
    industry: "informatique",
    reference: "GLC-SX-MMD",
    name: "Module SFP 1000BASE-SX multimode",
    description:
      "Émetteur-récepteur optique SFP 1 Gb/s multimode 850 nm avec DOM. De nombreux modules tiers compatibles existent.",
    status: "active",
    category: "Modules optiques SFP",
    crossRefs: [{ reference: "SFP1G-SX-85", type: "aftermarket", brand: "FS" }],
    offers: [
      { seller: "ServerSupply", price: 24.0, availability: "Neuf" },
      { seller: "eBay", price: 9.9, availability: "Occasion" },
    ],
  },
  {
    manufacturer: "Cisco",
    industry: "informatique",
    reference: "C9300-NM-8X",
    name: "Module réseau 8 ports 10G Catalyst 9300",
    description:
      "Module d'extension réseau 8 ports SFP+ 10 Gb/s pour commutateurs Catalyst 9300.",
    status: "active",
    category: "Modules réseau",
    offers: [
      { seller: "ServerSupply", price: 980.0, availability: "Neuf" },
      { seller: "eBay", price: 520.0, availability: "Occasion testée" },
    ],
  },
  {
    manufacturer: "Dell",
    industry: "informatique",
    reference: "0X8DXD",
    name: "Contrôleur RAID PERC H730P 2 Go",
    description:
      "Carte contrôleur RAID PERC H730P mini mono 2 Go cache pour serveurs Dell PowerEdge R630/R730. N'est plus produite : génération remplacée par les PERC série 11.",
    status: "obsolete",
    category: "Contrôleurs RAID",
    attributes: { Cache: "2 Go", Format: "Mini mono" },
    offers: [
      { seller: "ServerSupply", price: 189.0, availability: "Refurbished" },
      { seller: "ETB Technologies", price: 165.0, availability: "Reconditionné, garanti 3 ans" },
      { seller: "eBay", price: 120.0, availability: "Occasion" },
    ],
  },
  {
    manufacturer: "Dell",
    industry: "informatique",
    reference: "450-AEBN",
    name: "Alimentation 750 W PowerEdge",
    description:
      "Bloc d'alimentation redondant 750 W pour serveurs Dell PowerEdge R630/R730/T430.",
    status: "obsolete",
    category: "Alimentations serveur et réseau",
    offers: [
      { seller: "ETB Technologies", price: 75.0, availability: "Reconditionné, garanti 3 ans" },
      { seller: "eBay", price: 45.0, availability: "Occasion" },
    ],
  },
  {
    manufacturer: "HPE",
    industry: "informatique",
    reference: "511778-001",
    name: "Alimentation 460 W ProLiant G6/G7",
    description:
      "Bloc d'alimentation 460 W common slot pour serveurs HPE ProLiant DL360/DL380 G6 et G7. Spare HPE, plus produit.",
    status: "obsolete",
    category: "Alimentations serveur et réseau",
    crossRefs: [{ reference: "503296-B21", type: "oem", brand: "HPE" }],
    offers: [
      { seller: "ServerSupply", price: 49.0, availability: "Refurbished" },
      { seller: "eBay", price: 25.0, availability: "Occasion" },
    ],
  },
  {
    manufacturer: "HPE",
    industry: "informatique",
    reference: "720478-B21",
    name: "Alimentation 500 W ProLiant Gen9",
    description:
      "Bloc d'alimentation flex slot platinum 500 W pour serveurs HPE ProLiant DL360/DL380 Gen9.",
    status: "active",
    category: "Alimentations serveur et réseau",
    crossRefs: [{ reference: "754377-001", type: "oem", brand: "HPE" }],
    offers: [
      { seller: "ServerSupply", price: 89.0, availability: "Neuf" },
      { seller: "ETB Technologies", price: 65.0, availability: "Reconditionné, garanti 3 ans" },
    ],
  },
  {
    manufacturer: "HPE",
    industry: "informatique",
    reference: "P18434-B21",
    name: "SSD 960 Go SATA Read Intensive",
    description:
      "SSD 960 Go SATA 6G 2,5\" hot-plug pour serveurs HPE ProLiant Gen10.",
    status: "active",
    category: "Stockage serveur",
    attributes: { Capacité: "960 Go", Interface: "SATA 6G" },
    offers: [
      { seller: "ServerSupply", price: 290.0, availability: "Neuf" },
      { seller: "ETB Technologies", price: 195.0, availability: "Reconditionné" },
    ],
  },
  {
    manufacturer: "Lenovo",
    industry: "informatique",
    reference: "01AV430",
    name: "Batterie interne ThinkPad X1 Carbon Gen 5/6",
    description:
      "Batterie Li-Po 57 Wh (FRU) pour ThinkPad X1 Carbon 5e et 6e génération.",
    status: "active",
    category: "Batteries d'ordinateur portable",
    crossRefs: [{ reference: "SB10K97566", type: "oem", brand: "Lenovo" }],
    offers: [
      { seller: "ServerSupply", price: 95.0, availability: "Neuf" },
      { seller: "eBay", price: 45.0, availability: "Compatible neuf" },
    ],
  },
  {
    manufacturer: "Lenovo",
    industry: "informatique",
    reference: "00HW028",
    name: "Batterie interne ThinkPad X1 Carbon Gen 4",
    description:
      "Batterie Li-Po 52 Wh (FRU) pour ThinkPad X1 Carbon 4e génération. N'est plus produite.",
    status: "obsolete",
    category: "Batteries d'ordinateur portable",
    offers: [{ seller: "eBay", price: 39.0, availability: "Compatible neuf" }],
  },
];

async function main() {
  console.log("Création de l'extension pg_trgm…");
  await client`CREATE EXTENSION IF NOT EXISTS pg_trgm`;

  console.log("Purge des tables…");
  await db.delete(schema.offers);
  await db.delete(schema.compatibilities);
  await db.delete(schema.supersessions);
  await db.delete(schema.partReferences);
  await db.delete(schema.parts);
  await db.delete(schema.sellers);
  await db.delete(schema.categories);
  await db.delete(schema.manufacturers);

  console.log("Insertion des fabricants, catégories, vendeurs…");
  const manufacturerRows = await db
    .insert(schema.manufacturers)
    .values(
      MANUFACTURERS.map((m) => ({
        name: m.name,
        slug: slugify(m.name),
        industry: m.industry,
        website: m.website,
      })),
    )
    .returning();
  const manufacturerByName = new Map(manufacturerRows.map((m) => [m.name, m]));

  const categoryRows = await db
    .insert(schema.categories)
    .values(
      CATEGORIES.map((c) => ({
        name: c.name,
        slug: slugify(c.name),
        industry: c.industry,
      })),
    )
    .returning();
  const categoryByName = new Map(categoryRows.map((c) => [c.name, c]));

  const sellerRows = await db
    .insert(schema.sellers)
    .values(
      SELLERS.map((s) => ({
        name: s.name,
        slug: slugify(s.name),
        type: s.type,
        website: s.website,
        country: s.country,
      })),
    )
    .returning();
  const sellerByName = new Map(sellerRows.map((s) => [s.name, s]));

  console.log(`Insertion de ${PARTS.length} pièces…`);
  const partKey = (manufacturer: string, reference: string) =>
    `${manufacturer}|${normalizeReference(reference)}`;
  const partByKey = new Map<string, { id: number }>();

  for (const p of PARTS) {
    const manufacturer = manufacturerByName.get(p.manufacturer)!;
    const [row] = await db
      .insert(schema.parts)
      .values({
        manufacturerId: manufacturer.id,
        categoryId: categoryByName.get(p.category)?.id,
        referenceRaw: p.reference,
        referenceNormalized: normalizeReference(p.reference),
        slug: referenceSlug(p.reference),
        name: p.name,
        description: p.description,
        status: p.status,
        attributes: p.attributes,
      })
      .returning();
    partByKey.set(partKey(p.manufacturer, p.reference), row);
  }

  console.log("Insertion des cross-references, remplacements, compatibles, offres…");
  for (const p of PARTS) {
    const part = partByKey.get(partKey(p.manufacturer, p.reference))!;

    for (const ref of p.crossRefs ?? []) {
      await db.insert(schema.partReferences).values({
        partId: part.id,
        reference: ref.reference,
        referenceNormalized: normalizeReference(ref.reference),
        type: ref.type,
        brand: ref.brand,
        source: "seed-demo",
      });
    }

    if (p.supersededBy) {
      const newPart = partByKey.get(partKey(p.manufacturer, p.supersededBy));
      if (newPart) {
        await db.insert(schema.supersessions).values({
          oldPartId: part.id,
          newPartId: newPart.id,
          source: "seed-demo",
          note: "Remplacement officiel catalogue",
        });
      }
    }

    for (const compatKey of p.compatibleWith ?? []) {
      const [manufacturerName, reference] = compatKey.split("|");
      const compatible = partByKey.get(partKey(manufacturerName, reference));
      if (compatible) {
        await db.insert(schema.compatibilities).values({
          partId: part.id,
          compatiblePartId: compatible.id,
          confidence: 0.8,
          source: "seed-demo",
        });
      }
    }

    for (const offer of p.offers ?? []) {
      const seller = sellerByName.get(offer.seller)!;
      await db.insert(schema.offers).values({
        partId: part.id,
        sellerId: seller.id,
        price: offer.price?.toFixed(2),
        currency: "EUR",
        availability: offer.availability,
        url: seller.website ?? "https://example.com",
      });
    }
  }

  console.log("Seed terminé ✔");
  await client.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
