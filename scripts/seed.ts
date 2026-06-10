/**
 * Seed de démonstration : un échantillon de pièces multi-industries avec
 * statuts, chaînes de remplacement, cross-references, compatibles et offres.
 * Les données sont réalistes dans leur forme mais sont des données de DÉMO :
 * elles ne doivent pas être considérées comme exactes.
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
  { name: "Bosch", industry: "electromenager", website: "https://www.bosch-home.fr" },
  { name: "Samsung", industry: "electronique", website: "https://www.samsung.com" },
  { name: "Whirlpool", industry: "electromenager", website: "https://www.whirlpool.fr" },
  { name: "BMW", industry: "automobile", website: "https://www.bmw.fr" },
  { name: "Bosch Automotive", industry: "automobile", website: "https://www.bosch.fr" },
  { name: "Valeo", industry: "automobile", website: "https://www.valeo.com" },
  { name: "Siemens", industry: "industrie", website: "https://www.siemens.com" },
  { name: "Schneider Electric", industry: "industrie", website: "https://www.se.com" },
  { name: "ABB", industry: "industrie", website: "https://www.abb.com" },
  { name: "Rockwell Automation", industry: "industrie", website: "https://www.rockwellautomation.com" },
  { name: "Cisco", industry: "informatique", website: "https://www.cisco.com" },
  { name: "Dell", industry: "informatique", website: "https://www.dell.com" },
  { name: "HPE", industry: "informatique", website: "https://www.hpe.com" },
  { name: "Lenovo", industry: "informatique", website: "https://www.lenovo.com" },
  { name: "Daikin", industry: "hvac", website: "https://www.daikin.fr" },
  { name: "Atlantic", industry: "hvac", website: "https://www.groupe-atlantic.fr" },
  { name: "LG", industry: "electronique", website: "https://www.lg.com" },
];

const CATEGORIES: { name: string; industry: Industry }[] = [
  { name: "Pompes de vidange", industry: "electromenager" },
  { name: "Roulements et paliers", industry: "electromenager" },
  { name: "Filtres à eau", industry: "electromenager" },
  { name: "Joints de hublot", industry: "electromenager" },
  { name: "Filtres à huile", industry: "automobile" },
  { name: "Embrayages", industry: "automobile" },
  { name: "Automates programmables", industry: "industrie" },
  { name: "Contacteurs", industry: "industrie" },
  { name: "Variateurs de vitesse", industry: "industrie" },
  { name: "Alimentations serveur et réseau", industry: "informatique" },
  { name: "Modules optiques SFP", industry: "informatique" },
  { name: "Batteries d'ordinateur portable", industry: "informatique" },
  { name: "Contrôleurs RAID", industry: "informatique" },
  { name: "Cartes électroniques", industry: "hvac" },
  { name: "Résistances de chauffe", industry: "hvac" },
  { name: "Alimentations TV", industry: "electronique" },
  { name: "Cartes mères TV", industry: "electronique" },
];

const SELLERS: {
  name: string;
  type: (typeof schema.sellerTypeEnum.enumValues)[number];
  website: string;
  country: string;
}[] = [
  { name: "Bosch Home Pièces", type: "constructeur", website: "https://www.bosch-home.fr", country: "FR" },
  { name: "Concession BMW", type: "constructeur", website: "https://www.bmw.fr", country: "FR" },
  { name: "Siemens Industry Mall", type: "constructeur", website: "https://mall.industry.siemens.com", country: "DE" },
  { name: "Adepem", type: "distributeur_officiel", website: "https://www.adepem.com", country: "FR" },
  { name: "Sogedis", type: "distributeur_officiel", website: "https://www.sogedis.fr", country: "FR" },
  { name: "AutoDoc", type: "aftermarket", website: "https://www.autodoc.fr", country: "DE" },
  { name: "eSpares", type: "aftermarket", website: "https://www.espares.co.uk", country: "GB" },
  { name: "Radwell", type: "reconditionne", website: "https://www.radwell.com", country: "US" },
  { name: "ServerSupply", type: "aftermarket", website: "https://www.serversupply.com", country: "US" },
  { name: "ETB Technologies", type: "reconditionne", website: "https://www.etb-tech.com", country: "GB" },
  { name: "eBay", type: "occasion", website: "https://www.ebay.fr", country: "FR" },
];

const PARTS: SeedPart[] = [
  // --- Électroménager ---
  {
    manufacturer: "Bosch",
    industry: "electromenager",
    reference: "00144978",
    name: "Pompe de vidange lave-linge (ancienne génération)",
    description:
      "Pompe de vidange pour lave-linge Bosch / Siemens séries WAE, WAQ. Référence remplacée par la pompe 00754870.",
    status: "obsolete",
    category: "Pompes de vidange",
    supersededBy: "00754870",
  },
  {
    manufacturer: "Bosch",
    industry: "electromenager",
    reference: "00754870",
    name: "Pompe de vidange lave-linge",
    description:
      "Pompe de vidange Copreci 30 W pour lave-linge Bosch, Siemens et Neff. Remplace plusieurs anciennes références.",
    status: "active",
    category: "Pompes de vidange",
    attributes: { Puissance: "30 W", Tension: "220-240 V", Marque_moteur: "Copreci" },
    crossRefs: [
      { reference: "00145787", type: "oem", brand: "Bosch" },
      { reference: "4055250551", type: "aftermarket", brand: "Universel" },
    ],
    compatibleWith: ["Whirlpool|481236018558"],
    offers: [
      { seller: "Bosch Home Pièces", price: 42.9, availability: "En stock" },
      { seller: "Adepem", price: 29.9, availability: "En stock" },
      { seller: "eSpares", price: 24.99, availability: "En stock" },
      { seller: "eBay", price: 15.0, availability: "Occasion" },
    ],
  },
  {
    manufacturer: "Samsung",
    industry: "electromenager",
    reference: "DC97-16350C",
    name: "Kit roulements tambour lave-linge",
    description:
      "Kit complet roulements + joint spi pour tambour de lave-linge Samsung EcoBubble.",
    status: "active",
    category: "Roulements et paliers",
    offers: [
      { seller: "Adepem", price: 54.5, availability: "En stock" },
      { seller: "eSpares", price: 49.99, availability: "Sous 5 jours" },
    ],
  },
  {
    manufacturer: "Samsung",
    industry: "electromenager",
    reference: "DA29-00020B",
    name: "Filtre à eau réfrigérateur américain",
    description:
      "Filtre à eau interne HAF-CIN pour réfrigérateurs américains Samsung. Durée de vie 6 mois.",
    status: "active",
    category: "Filtres à eau",
    crossRefs: [{ reference: "HAF-CIN/EXP", type: "mpn", brand: "Samsung" }],
    offers: [
      { seller: "Adepem", price: 39.9, availability: "En stock" },
      { seller: "eBay", price: 22.0, availability: "Neuf compatible" },
    ],
  },
  {
    manufacturer: "Whirlpool",
    industry: "electromenager",
    reference: "481236018558",
    name: "Pompe de vidange lave-linge",
    description: "Pompe de vidange Askoll M50 pour lave-linge Whirlpool et Laden.",
    status: "active",
    category: "Pompes de vidange",
    compatibleWith: ["Bosch|00754870"],
    offers: [{ seller: "Sogedis", price: 27.4, availability: "En stock" }],
  },
  {
    manufacturer: "Whirlpool",
    industry: "electromenager",
    reference: "481246668784",
    name: "Joint de hublot lave-linge",
    description: "Manchette de hublot pour lave-linge Whirlpool 6ème sens.",
    status: "obsolete",
    category: "Joints de hublot",
    supersededBy: "481010632436",
  },
  {
    manufacturer: "Whirlpool",
    industry: "electromenager",
    reference: "481010632436",
    name: "Joint de hublot lave-linge (nouvelle référence)",
    description: "Manchette de hublot, remplace la référence 481246668784.",
    status: "active",
    category: "Joints de hublot",
    offers: [
      { seller: "Sogedis", price: 34.9, availability: "En stock" },
      { seller: "Adepem", price: 36.5, availability: "En stock" },
    ],
  },

  // --- Automobile ---
  {
    manufacturer: "BMW",
    industry: "automobile",
    reference: "11 42 7 511 161",
    name: "Filtre à huile (ancienne référence)",
    description:
      "Élément filtrant à huile pour moteurs BMW N42/N46. Référence remplacée au catalogue par 11 42 7 953 129.",
    status: "obsolete",
    category: "Filtres à huile",
    supersededBy: "11 42 7 953 129",
  },
  {
    manufacturer: "BMW",
    industry: "automobile",
    reference: "11 42 7 953 129",
    name: "Filtre à huile moteur",
    description:
      "Élément filtrant à huile d'origine BMW pour moteurs 4 cylindres essence. Livré avec joints.",
    status: "active",
    category: "Filtres à huile",
    attributes: { Hauteur: "79 mm", Diamètre: "72 mm" },
    crossRefs: [
      { reference: "HU 816 x", type: "aftermarket", brand: "Mann-Filter" },
      { reference: "OX 813/2D", type: "aftermarket", brand: "Mahle" },
    ],
    compatibleWith: ["Bosch Automotive|F 026 407 228"],
    offers: [
      { seller: "Concession BMW", price: 19.8, availability: "En stock" },
      { seller: "AutoDoc", price: 8.45, availability: "En stock" },
      { seller: "eBay", price: 6.9, availability: "Neuf" },
    ],
  },
  {
    manufacturer: "Bosch Automotive",
    industry: "automobile",
    reference: "F 026 407 228",
    name: "Filtre à huile",
    description:
      "Filtre à huile aftermarket Bosch, équivalent constructeur pour moteurs BMW 4 cylindres.",
    status: "active",
    category: "Filtres à huile",
    compatibleWith: ["BMW|11 42 7 953 129"],
    offers: [{ seller: "AutoDoc", price: 7.2, availability: "En stock" }],
  },
  {
    manufacturer: "Valeo",
    industry: "automobile",
    reference: "826704",
    name: "Kit d'embrayage 3 pièces",
    description:
      "Kit embrayage complet (mécanisme, disque, butée) pour moteurs 1.6 HDi / TDCi.",
    status: "active",
    category: "Embrayages",
    attributes: { Diamètre: "235 mm", Dents: "19" },
    offers: [
      { seller: "AutoDoc", price: 129.9, availability: "En stock" },
      { seller: "eBay", price: 95.0, availability: "Neuf" },
    ],
  },

  // --- Industrie ---
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
    offers: [{ seller: "Radwell", price: 420.0, availability: "Reconditionné, garanti 2 ans" }],
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
    attributes: { Alimentation: "24 V DC", Mémoire: "100 KB" },
    offers: [
      { seller: "Siemens Industry Mall", price: 545.0, availability: "En stock" },
      { seller: "Radwell", price: 389.0, availability: "Surplus neuf" },
      { seller: "eBay", price: 310.0, availability: "Occasion" },
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
    compatibleWith: ["ABB|1SBL177001R8010"],
    offers: [
      { seller: "Radwell", price: 48.0, availability: "Surplus neuf" },
      { seller: "eBay", price: 32.0, availability: "Neuf" },
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
    compatibleWith: ["Schneider Electric|LC1D18M7"],
    offers: [{ seller: "Radwell", price: 52.5, availability: "Surplus neuf" }],
  },

  {
    manufacturer: "Rockwell Automation",
    industry: "industrie",
    reference: "2711P-T7C4D8",
    name: "Terminal opérateur PanelView Plus 7",
    description:
      "IHM tactile PanelView Plus 7 Standard 6,5\" Allen-Bradley, Ethernet, 24 V DC.",
    status: "active",
    category: "Automates programmables",
    offers: [
      { seller: "Radwell", price: 1450.0, availability: "Surplus neuf" },
      { seller: "eBay", price: 980.0, availability: "Occasion" },
    ],
  },
  {
    manufacturer: "Siemens",
    industry: "industrie",
    reference: "6SE6440-2UD21-5AA1",
    name: "Variateur MICROMASTER 440, 1,5 kW",
    description:
      "Variateur de fréquence MICROMASTER 440. Gamme arrêtée par Siemens, successeur conseillé : SINAMICS G120 (6SL3210-1KE21-3UF1).",
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
    offers: [{ seller: "Siemens Industry Mall", price: 890.0, availability: "En stock" }],
  },

  // --- Informatique ---
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
    manufacturer: "Dell",
    industry: "informatique",
    reference: "0X8DXD",
    name: "Contrôleur RAID PERC H730P 2 Go",
    description:
      "Carte contrôleur RAID PERC H730P mini mono 2 Go cache pour serveurs Dell PowerEdge R630/R730.",
    status: "obsolete",
    category: "Contrôleurs RAID",
    offers: [
      { seller: "ServerSupply", price: 189.0, availability: "Refurbished" },
      { seller: "ETB Technologies", price: 165.0, availability: "Reconditionné, garanti 3 ans" },
      { seller: "eBay", price: 120.0, availability: "Occasion" },
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

  // --- HVAC ---
  {
    manufacturer: "Daikin",
    industry: "hvac",
    reference: "5021205",
    name: "Carte électronique unité extérieure",
    description:
      "Carte de puissance pour groupes extérieurs Daikin multisplit. Pièce SAV.",
    status: "active",
    category: "Cartes électroniques",
    offers: [{ seller: "eBay", price: 280.0, availability: "Occasion testée" }],
  },
  {
    manufacturer: "Atlantic",
    industry: "hvac",
    reference: "099110",
    name: "Résistance stéatite 2400 W chauffe-eau",
    description:
      "Résistance stéatite triphasée 2400 W pour chauffe-eau Atlantic / Sauter / Thermor Ø52.",
    status: "active",
    category: "Résistances de chauffe",
    attributes: { Puissance: "2400 W", Diamètre: "52 mm" },
    offers: [
      { seller: "Adepem", price: 45.9, availability: "En stock" },
      { seller: "Sogedis", price: 43.0, availability: "En stock" },
    ],
  },

  // --- Électronique ---
  {
    manufacturer: "Samsung",
    industry: "electronique",
    reference: "BN44-00932B",
    name: "Alimentation TV QLED",
    description:
      "Carte d'alimentation L55E7N_RDY pour téléviseurs Samsung QLED 55\" série Q7/Q8.",
    status: "active",
    category: "Alimentations TV",
    crossRefs: [{ reference: "L55E7N_RDY", type: "mpn", brand: "Samsung" }],
    offers: [
      { seller: "eBay", price: 65.0, availability: "Occasion testée" },
      { seller: "Sogedis", price: 98.0, availability: "Sous 10 jours" },
    ],
  },
  {
    manufacturer: "Samsung",
    industry: "electronique",
    reference: "BN94-12876A",
    name: "Carte mère TV UE49MU6105",
    description:
      "Carte principale pour téléviseur Samsung UE49MU6105. Production arrêtée, disponible en occasion uniquement.",
    status: "obsolete",
    category: "Cartes mères TV",
    offers: [{ seller: "eBay", price: 89.0, availability: "Occasion" }],
  },
  {
    manufacturer: "LG",
    industry: "electronique",
    reference: "EAY64388801",
    name: "Alimentation TV OLED",
    description: "Carte d'alimentation EAX67264001 pour téléviseurs LG OLED55B7.",
    status: "active",
    category: "Alimentations TV",
    crossRefs: [{ reference: "EAX67264001", type: "mpn", brand: "LG" }],
    offers: [{ seller: "eBay", price: 75.0, availability: "Occasion testée" }],
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
