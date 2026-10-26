/**
 * Construit le catalogue étendu à partir de scripts/catalog/data/*.ts :
 * contrôle les données puis écrit, dans data/catalogue/<édition>/,
 *   - lot-NN.json   : lots IngestPayload (≤ 500 pièces) pour `npm run push` ;
 *   - catalogue.sql : script idempotent à exécuter dans l'éditeur SQL de Neon
 *                     ou avec psql (ne supprime ni ne modifie rien).
 *
 * Les pièces déjà présentes dans le catalogue de démonstration
 * (neon-catalog.sql) sont écartées : le catalogue étendu complète la base
 * sans réécrire les fiches existantes.
 *
 * Usage : npm run catalog:build [-- --check]   (--check : contrôles seuls)
 */
import fs from "node:fs";
import path from "node:path";
import type { IngestPart, IngestPayload } from "../../src/lib/ingest-types";
import { validatePart } from "../../src/lib/ingest-validation";
import { normalizeReference, referenceSlug, slugify } from "../../src/lib/normalize";
import { CATALOGUE } from "./data";

export const EDITION = "2026-10";
export const SOURCE = `catalogue-${EDITION}`;
const LOT_SIZE = 500;
/** Confiance appliquée aux compatibilités, identique au pipeline d'ingestion. */
const COMPAT_CONFIDENCE = 0.7;

const ROOT = path.resolve(__dirname, "../..");
const OUT_DIR = path.join(ROOT, "data", "catalogue", EDITION);

/** Sites officiels des fabricants absents du catalogue de démonstration (par slug). */
const WEBSITES: Record<string, string> = {
  apc: "https://www.apc.com",
  beckhoff: "https://www.beckhoff.com",
  crucial: "https://www.crucial.com",
  eaton: "https://www.eaton.com",
  fortinet: "https://www.fortinet.com",
  kingston: "https://www.kingston.com",
  "mitsubishi-electric": "https://www.mitsubishielectric.com",
  samsung: "https://www.samsung.com",
  seagate: "https://www.seagate.com",
  synology: "https://www.synology.com",
  wago: "https://www.wago.com",
  "western-digital": "https://www.westerndigital.com",
};

/** Renseigne le site du fabricant, repris à sa création par les deux voies de chargement. */
function withWebsite(part: IngestPart): IngestPart {
  const website = WEBSITES[slugify(part.manufacturer)];
  return website && !part.manufacturerWebsite ? { ...part, manufacturerWebsite: website } : part;
}

const key = (manufacturer: string, reference: string) => `${slugify(manufacturer)}|${normalizeReference(reference)}`;

// ── Catalogue existant (neon-catalog.sql) ──────────────────────────────────

export interface ExistingCatalog {
  manufacturers: Map<string, string>; // slug → nom
  categories: Map<string, string>; // slug → nom
  parts: Map<string, { status: string; supersededBy: string[] }>; // clé → infos
  crossRefs: Map<string, string>; // référence normalisée → clé de la pièce
}

export function readExistingCatalog(): ExistingCatalog {
  const sql = fs.readFileSync(path.join(ROOT, "neon-catalog.sql"), "utf-8");
  const str = "'((?:[^']|'')*)'";
  const unquote = (s: string) => s.replace(/''/g, "'");
  const manufacturerSlugById = new Map<string, string>();
  const keyById = new Map<string, string>();
  const catalog: ExistingCatalog = { manufacturers: new Map(), categories: new Map(), parts: new Map(), crossRefs: new Map() };

  for (const m of sql.matchAll(new RegExp(`INSERT INTO public\\.manufacturers .*? VALUES \\((\\d+), ${str}, ${str}`, "g"))) {
    manufacturerSlugById.set(m[1], m[3]);
    catalog.manufacturers.set(m[3], unquote(m[2]));
  }
  for (const m of sql.matchAll(new RegExp(`INSERT INTO public\\.categories .*? VALUES \\(\\d+, ${str}, ${str}`, "g"))) {
    catalog.categories.set(m[2], unquote(m[1]));
  }
  const partRe = new RegExp(
    `INSERT INTO public\\.parts .*? VALUES \\((\\d+), (\\d+), (?:\\d+|NULL), ${str}, ${str}, ${str}, ${str}, (?:${str}|NULL), '(\\w+)'`,
    "g",
  );
  for (const m of sql.matchAll(partRe)) {
    const k = `${manufacturerSlugById.get(m[2])}|${m[4]}`;
    keyById.set(m[1], k);
    catalog.parts.set(k, { status: m[8], supersededBy: [] });
  }
  for (const m of sql.matchAll(/INSERT INTO public\.supersessions .*? VALUES \(\d+, (\d+), (\d+),/g)) {
    const oldKey = keyById.get(m[1]);
    const newKey = keyById.get(m[2]);
    if (oldKey && newKey) catalog.parts.get(oldKey)?.supersededBy.push(newKey);
  }
  for (const m of sql.matchAll(new RegExp(`INSERT INTO public\\.part_references .*? VALUES \\(\\d+, (\\d+), ${str}, ${str}`, "g"))) {
    const partKey = keyById.get(m[1]);
    if (partKey) catalog.crossRefs.set(m[3], partKey);
  }
  if (catalog.parts.size === 0) throw new Error("neon-catalog.sql : aucune pièce lue, format inattendu");
  return catalog;
}

// ── Contrôles ──────────────────────────────────────────────────────────────

export interface Report {
  errors: string[];
  notes: string[];
  skippedExisting: string[];
}

export function check(all: IngestPart[], existing: ExistingCatalog): { parts: IngestPart[]; report: Report } {
  const report: Report = { errors: [], notes: [], skippedExisting: [] };
  const seen = new Map<string, IngestPart>();

  for (const part of all) {
    const label = `[${part.manufacturer} ${part.reference}]`;
    const problem = validatePart(part);
    if (problem) report.errors.push(`${label} ${problem}`);
    if (!part.category) report.errors.push(`${label} catégorie manquante`);
    if (part.productUrl || part.offers?.length) report.errors.push(`${label} productUrl/offres interdites (données non vérifiées)`);
    if (part.reference !== part.reference.trim() || /\s{2,}/.test(part.reference)) report.errors.push(`${label} espaces parasites`);
    if (part.status === "active" && part.supersededBy) report.errors.push(`${label} active mais remplacée`);
    const k = key(part.manufacturer, part.reference);
    if (seen.has(k)) report.errors.push(`${label} doublon (même référence normalisée que ${seen.get(k)!.reference})`);
    seen.set(k, part);
  }

  // Pièces déjà en base : écartées (les fiches existantes ne sont pas réécrites)
  const parts = all.filter((p) => {
    const k = key(p.manufacturer, p.reference);
    if (!existing.parts.has(k)) return true;
    report.skippedExisting.push(`${p.manufacturer} ${p.reference}`);
    return false;
  });
  const statusOf = (k: string) => seen.get(k)?.status ?? existing.parts.get(k)?.status;
  const exists = (k: string) => seen.has(k) || existing.parts.has(k);

  for (const part of all) {
    const label = `[${part.manufacturer} ${part.reference}]`;
    const k = key(part.manufacturer, part.reference);
    if (part.supersededBy) {
      const target = key(part.manufacturer, part.supersededBy);
      if (target === k) report.errors.push(`${label} se remplace elle-même`);
      else if (!exists(target)) report.errors.push(`${label} remplacement ${part.supersededBy} absent du catalogue`);
      const already = existing.parts.get(k)?.supersededBy ?? [];
      if (already.length > 0 && !already.includes(target)) {
        report.notes.push(`${label} déjà remplacée en base par ${already.join(", ")} ; remplacement ${part.supersededBy} non appliqué`);
      }
    }
    for (const compat of part.compatibleWith ?? []) {
      const [brand, ref] = compat.split("|");
      if (!ref) report.errors.push(`${label} compatibilité mal formée : ${compat}`);
      else if (!exists(key(brand, ref))) report.errors.push(`${label} compatible ${compat} absent du catalogue`);
    }
    for (const x of part.crossReferences ?? []) {
      const n = normalizeReference(x.reference);
      const clash = seen.get(`${slugify(part.manufacturer)}|${n}`) ?? (existing.crossRefs.get(n) && existing.crossRefs.get(n) !== k);
      if (clash) report.errors.push(`${label} cross-référence ${x.reference} déjà utilisée par une autre pièce`);
    }
  }

  // Chaînes de remplacement : pas de cycle ; on signale celles qui ne
  // mènent pas à une pièce encore fabriquée.
  const openEnded = new Map<string, string[]>();
  for (const part of all) {
    if (!part.supersededBy) continue;
    const visited = new Set<string>();
    let k = key(part.manufacturer, part.reference);
    while (true) {
      if (visited.has(k)) {
        report.errors.push(`[${part.manufacturer} ${part.reference}] cycle de remplacement`);
        break;
      }
      visited.add(k);
      const next = seen.get(k)?.supersededBy;
      const nextKey = next ? key(part.manufacturer, next) : existing.parts.get(k)?.supersededBy[0];
      if (!nextKey || !exists(nextKey)) break;
      k = nextKey;
    }
    const end = statusOf(k) ?? "unknown";
    if (end !== "active") openEnded.set(end, [...(openEnded.get(end) ?? []), `${part.manufacturer} ${part.reference}`]);
  }
  for (const [end, refs] of openEnded) {
    report.notes.push(`${refs.length} chaîne(s) de remplacement aboutissent à une pièce « ${end} » : ${refs.join(", ")}`);
  }

  return { parts, report };
}

/**
 * Ordre de chargement : une pièce passe après son remplacement et ses
 * compatibles, pour que la passe 2 du pipeline les trouve (même lot ou lot
 * précédent). Les pièces restent groupées par fabricant à profondeur égale.
 */
export function loadOrder(parts: IngestPart[]): IngestPart[] {
  const byKey = new Map(parts.map((p) => [key(p.manufacturer, p.reference), p]));
  const depth = new Map<string, number>();
  const depthOf = (k: string, stack: Set<string>): number => {
    const cached = depth.get(k);
    if (cached !== undefined) return cached;
    const part = byKey.get(k);
    if (!part || stack.has(k)) return -1; // pièce déjà en base : disponible d'emblée
    stack.add(k);
    const targets = [
      ...(part.supersededBy ? [key(part.manufacturer, part.supersededBy)] : []),
      ...(part.compatibleWith ?? []).map((c) => key(c.split("|")[0], c.split("|")[1] ?? "")),
    ];
    const d = 1 + Math.max(-1, ...targets.map((t) => depthOf(t, stack)));
    stack.delete(k);
    depth.set(k, d);
    return d;
  };
  return parts
    .map((p, i) => ({ p, i, d: depthOf(key(p.manufacturer, p.reference), new Set()) }))
    .sort((a, b) => a.d - b.d || a.i - b.i)
    .map(({ p }) => p);
}

// ── Sorties ────────────────────────────────────────────────────────────────

const q = (value: string | null | undefined) => (value == null ? "NULL" : `'${value.replace(/'/g, "''")}'`);

function valuesBlock(rows: string[][]): string {
  return rows.map((r) => `  (${r.join(", ")})`).join(",\n");
}

export function buildSql(parts: IngestPart[], existing: ExistingCatalog): string {
  const manufacturers = new Map<string, { name: string; industry: string; website?: string }>();
  const categories = new Map<string, { name: string; industry: string }>();
  for (const p of parts) {
    const ms = slugify(p.manufacturer);
    if (!manufacturers.has(ms)) manufacturers.set(ms, { name: p.manufacturer, industry: p.industry, website: p.manufacturerWebsite });
    const cs = slugify(p.category!);
    if (!categories.has(cs)) categories.set(cs, { name: p.category!, industry: p.industry });
  }
  const newManufacturers = [...manufacturers].filter(([slug]) => !existing.manufacturers.has(slug));
  const newCategories = [...categories].filter(([slug]) => !existing.categories.has(slug));

  const partRows = parts.map((p) => [
    q(slugify(p.manufacturer)),
    q(slugify(p.category!)),
    q(p.reference),
    q(normalizeReference(p.reference)),
    q(referenceSlug(p.reference)),
    q(p.name),
    q(p.description ?? null),
    q(p.status ?? "unknown"),
    p.attributes ? `${q(JSON.stringify(p.attributes))}::jsonb` : "NULL::jsonb",
    String(Math.round(p.confidenceScore ?? 0)),
  ]);
  const xrefRows = parts.flatMap((p) =>
    (p.crossReferences ?? []).map((x) => [
      q(slugify(p.manufacturer)),
      q(normalizeReference(p.reference)),
      q(x.reference),
      q(normalizeReference(x.reference)),
      q(x.type),
      q(x.brand ?? null),
    ]),
  );
  const supersessionRows = parts
    .filter((p) => p.supersededBy)
    .map((p) => [q(slugify(p.manufacturer)), q(normalizeReference(p.reference)), q(normalizeReference(p.supersededBy!))]);
  const compatRows = parts.flatMap((p) =>
    (p.compatibleWith ?? []).map((c) => {
      const [brand, ref] = c.split("|");
      return [q(slugify(p.manufacturer)), q(normalizeReference(p.reference)), q(slugify(brand)), q(normalizeReference(ref))];
    }),
  );

  const lines = [
    "-- ============================================================",
    `-- SparePartSearch — catalogue étendu ${EDITION}`,
    `-- ${parts.length} pièces, ${supersessionRows.length} remplacements, ${xrefRows.length} cross-références.`,
    "-- Généré par `npm run catalog:build` : ne pas modifier à la main.",
    "--",
    "-- Idempotent : n'ajoute que ce qui manque (ON CONFLICT DO NOTHING), ne",
    "-- supprime et ne modifie aucune ligne existante. Peut être relancé.",
    "-- Exécution : éditeur SQL de Neon (coller puis Run), ou",
    `--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f data/catalogue/${EDITION}/catalogue.sql`,
    "-- ============================================================",
    "",
    "BEGIN;",
    "",
    "-- Les séquences doivent dépasser les id insérés explicitement par le catalogue de démonstration.",
    ...["manufacturers", "categories", "parts", "part_references", "supersessions", "compatibilities"].map(
      (t) => `SELECT setval('${t}_id_seq', GREATEST((SELECT COALESCE(MAX(id), 0) FROM ${t}), 1));`,
    ),
    "",
  ];
  if (newManufacturers.length > 0) {
    lines.push(
      "INSERT INTO manufacturers (name, slug, industry, website) VALUES",
      valuesBlock(newManufacturers.map(([slug, m]) => [q(m.name), q(slug), `${q(m.industry)}::industry`, q(m.website ?? null)])),
      "ON CONFLICT (slug) DO NOTHING;",
      "",
    );
  }
  if (newCategories.length > 0) {
    lines.push(
      "INSERT INTO categories (name, slug, industry) VALUES",
      valuesBlock(newCategories.map(([slug, c]) => [q(c.name), q(slug), `${q(c.industry)}::industry`])),
      "ON CONFLICT (slug) DO NOTHING;",
      "",
    );
  }
  // Par tranches : une requête par lot de 500 pièces reste lisible et rapide
  for (let i = 0; i < partRows.length; i += LOT_SIZE) {
    lines.push(
      "INSERT INTO parts (manufacturer_id, category_id, reference_raw, reference_normalized, slug, name, description, status, attributes, confidence_score)",
      "SELECT m.id, c.id, v.reference_raw, v.reference_normalized, v.slug, v.name, v.description, v.status::part_status, v.attributes, v.confidence_score",
      "FROM (VALUES",
      valuesBlock(partRows.slice(i, i + LOT_SIZE)),
      ") AS v(manufacturer_slug, category_slug, reference_raw, reference_normalized, slug, name, description, status, attributes, confidence_score)",
      "JOIN manufacturers m ON m.slug = v.manufacturer_slug",
      "LEFT JOIN categories c ON c.slug = v.category_slug",
      "ON CONFLICT (manufacturer_id, reference_normalized) DO NOTHING;",
      "",
    );
  }
  if (xrefRows.length > 0) {
    lines.push(
      "INSERT INTO part_references (part_id, reference, reference_normalized, type, brand, source)",
      `SELECT p.id, v.reference, v.reference_normalized, v.type::reference_type, v.brand, ${q(SOURCE)}`,
      "FROM (VALUES",
      valuesBlock(xrefRows),
      ") AS v(manufacturer_slug, part_reference, reference, reference_normalized, type, brand)",
      "JOIN manufacturers m ON m.slug = v.manufacturer_slug",
      "JOIN parts p ON p.manufacturer_id = m.id AND p.reference_normalized = v.part_reference",
      "ON CONFLICT (part_id, reference_normalized) DO NOTHING;",
      "",
    );
  }
  if (supersessionRows.length > 0) {
    lines.push(
      "-- Une pièce déjà remplacée en base garde son remplacement.",
      "INSERT INTO supersessions (old_part_id, new_part_id, source, note)",
      `SELECT o.id, n.id, ${q(SOURCE)}, 'Remplacement officiel'`,
      "FROM (VALUES",
      valuesBlock(supersessionRows),
      ") AS v(manufacturer_slug, old_reference, new_reference)",
      "JOIN manufacturers m ON m.slug = v.manufacturer_slug",
      "JOIN parts o ON o.manufacturer_id = m.id AND o.reference_normalized = v.old_reference",
      "JOIN parts n ON n.manufacturer_id = m.id AND n.reference_normalized = v.new_reference",
      "WHERE o.id <> n.id AND NOT EXISTS (SELECT 1 FROM supersessions s WHERE s.old_part_id = o.id)",
      "ON CONFLICT (old_part_id, new_part_id) DO NOTHING;",
      "",
    );
  }
  if (compatRows.length > 0) {
    lines.push(
      "INSERT INTO compatibilities (part_id, compatible_part_id, confidence, source)",
      `SELECT a.id, b.id, ${COMPAT_CONFIDENCE}, ${q(SOURCE)}`,
      "FROM (VALUES",
      valuesBlock(compatRows),
      ") AS v(manufacturer_slug, reference, compatible_manufacturer_slug, compatible_reference)",
      "JOIN manufacturers ma ON ma.slug = v.manufacturer_slug",
      "JOIN parts a ON a.manufacturer_id = ma.id AND a.reference_normalized = v.reference",
      "JOIN manufacturers mb ON mb.slug = v.compatible_manufacturer_slug",
      "JOIN parts b ON b.manufacturer_id = mb.id AND b.reference_normalized = v.compatible_reference",
      "WHERE a.id <> b.id",
      "ON CONFLICT (part_id, compatible_part_id) DO NOTHING;",
      "",
    );
  }
  lines.push("COMMIT;", "");
  return lines.join("\n");
}

function summary(parts: IngestPart[], existing: ExistingCatalog): string {
  const count = (f: (p: IngestPart) => string) => {
    const m = new Map<string, number>();
    for (const p of parts) m.set(f(p), (m.get(f(p)) ?? 0) + 1);
    return [...m].sort((a, b) => b[1] - a[1]);
  };
  const isNew = (slug: string, known: Map<string, string>) => (known.has(slug) ? "" : " (nouveau)");
  return [
    `${parts.length} pièces à ajouter`,
    `Statuts : ${count((p) => p.status ?? "unknown").map(([s, n]) => `${s} ${n}`).join(", ")}`,
    `Remplacements : ${parts.filter((p) => p.supersededBy).length} ; cross-références : ${parts.reduce((n, p) => n + (p.crossReferences?.length ?? 0), 0)} ; compatibilités : ${parts.reduce((n, p) => n + (p.compatibleWith?.length ?? 0), 0)}`,
    `À revoir (confiance < 60) : ${parts.filter((p) => (p.confidenceScore ?? 0) < 60).length}`,
    "Fabricants :",
    ...count((p) => p.manufacturer).map(([m, n]) => `  ${m}${isNew(slugify(m), existing.manufacturers)} : ${n}`),
    "Catégories :",
    ...count((p) => p.category!).map(([c, n]) => `  ${c}${isNew(slugify(c), existing.categories)} : ${n}`),
  ].join("\n");
}

function main() {
  const existing = readExistingCatalog();
  const { parts, report } = check(CATALOGUE, existing);

  if (report.skippedExisting.length > 0) {
    console.log(`Déjà en base, écartées (${report.skippedExisting.length}) : ${report.skippedExisting.join(", ")}\n`);
  }
  for (const note of report.notes) console.log(`note  ${note}`);
  if (report.errors.length > 0) {
    for (const error of report.errors) console.error(`ERREUR ${error}`);
    console.error(`\n${report.errors.length} erreur(s) : rien n'est écrit.`);
    process.exit(1);
  }
  console.log(`\n${summary(parts, existing)}`);
  if (process.argv.includes("--check")) return;

  const ordered = loadOrder(parts).map(withWebsite);
  fs.rmSync(OUT_DIR, { recursive: true, force: true });
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const lots = Math.ceil(ordered.length / LOT_SIZE);
  for (let i = 0; i < lots; i++) {
    const payload: IngestPayload = { source: SOURCE, parts: ordered.slice(i * LOT_SIZE, (i + 1) * LOT_SIZE) };
    const file = path.join(OUT_DIR, `lot-${String(i + 1).padStart(2, "0")}.json`);
    fs.writeFileSync(file, `${JSON.stringify(payload, null, 1)}\n`);
  }
  fs.writeFileSync(path.join(OUT_DIR, "catalogue.sql"), buildSql(ordered, existing));
  console.log(`\nÉcrit : ${lots} lot(s) JSON et catalogue.sql dans ${path.relative(ROOT, OUT_DIR)}/`);
}

if (require.main === module) main();
