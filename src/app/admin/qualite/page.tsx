import type { Metadata } from "next";
import Link from "next/link";
import { and, asc, eq, isNotNull, lt, or, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { RESELLERS } from "@/lib/resellers";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Qualité des données — Admin",
  robots: { index: false, follow: false },
};

const { parts, manufacturers } = schema;

/** Slugs de revendeurs qui ne devraient JAMAIS apparaître comme fabricants. */
const RESELLER_SLUGS = new Set([
  ...RESELLERS.map((r) => r.slug),
  "rs", "rs-online", "element14", "digikey", "arrow", "avnet",
  "distrelec", "radwell-international", "eu-automation", "euautomation",
  "amazon", "aliexpress", "cdiscount", "leboncoin", "rakuten",
]);

function StatCard({ label, value, total, tone }: {
  label: string;
  value: number;
  total?: number;
  tone: "ok" | "warn" | "bad";
}) {
  const colors = {
    ok:   "border-green-200 bg-green-50 text-green-900",
    warn: "border-amber-200 bg-amber-50 text-amber-900",
    bad:  "border-red-200 bg-red-50 text-red-900",
  };
  return (
    <div className={`rounded-xl border p-4 ${colors[tone]}`}>
      <p className="text-2xl font-bold">
        {value.toLocaleString("fr-FR")}
        {total != null && total > 0 && (
          <span className="ml-1 text-sm font-normal opacity-70">
            ({Math.round((value / total) * 100)} %)
          </span>
        )}
      </p>
      <p className="mt-1 text-sm opacity-80">{label}</p>
    </div>
  );
}

export default async function QualityPage({
  searchParams,
}: {
  searchParams: Promise<{ key?: string }>;
}) {
  const { key } = await searchParams;
  const expected = process.env.INGEST_API_KEY;

  if (!expected || key !== expected) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <h1 className="text-2xl font-bold">Accès restreint</h1>
        <p className="mt-3 text-zinc-600">
          Cette page nécessite la clé d'administration :{" "}
          <code className="rounded bg-zinc-100 px-1 font-mono text-sm">/admin/qualite?key=…</code>
        </p>
      </div>
    );
  }

  // ── Statistiques globales ──────────────────────────────────────────────────
  const [stats] = await db
    .select({
      total:         sql<number>`count(*)`,
      noDescription: sql<number>`count(*) FILTER (WHERE description IS NULL OR description = '')`,
      noProductUrl:  sql<number>`count(*) FILTER (WHERE product_url IS NULL)`,
      noCategory:    sql<number>`count(*) FILTER (WHERE category_id IS NULL)`,
      noDatasheet:   sql<number>`count(*) FILTER (WHERE datasheet_url IS NULL)`,
      unknownStatus: sql<number>`count(*) FILTER (WHERE status = 'unknown')`,
      lowConfidence: sql<number>`count(*) FILTER (WHERE confidence_score IS NOT NULL AND confidence_score < 60)`,
      needsReview:   sql<number>`count(*) FILTER (WHERE needs_review = true)`,
      noOffers:      sql<number>`count(*) FILTER (WHERE NOT EXISTS (SELECT 1 FROM offers o WHERE o.part_id = parts.id))`,
    })
    .from(parts);

  const total = Number(stats.total);

  // ── Monétisation : clics sortants vers revendeurs (30 derniers jours) ──────
  const clickStats = await db.execute(sql`
    SELECT seller_slug,
           count(*)::int AS clicks,
           count(*) FILTER (WHERE affiliated)::int AS affiliated_clicks
    FROM outbound_clicks
    WHERE created_at > now() - interval '30 days'
    GROUP BY seller_slug
    ORDER BY clicks DESC
  `) as unknown as Array<{ seller_slug: string; clicks: number; affiliated_clicks: number }>;
  const totalClicks = clickStats.reduce((a, c) => a + Number(c.clicks), 0);

  // ── Fabricants suspects (revendeurs ingérés comme marques) ────────────────
  const allManufacturers = await db
    .select({
      id:   manufacturers.id,
      name: manufacturers.name,
      slug: manufacturers.slug,
      partsCount: sql<number>`(SELECT count(*) FROM parts WHERE manufacturer_id = ${manufacturers.id})`,
    })
    .from(manufacturers);

  const suspectManufacturers = allManufacturers.filter((m) => RESELLER_SLUGS.has(m.slug));

  // ── Pires fiches : confiance faible ou signalées à vérifier ───────────────
  const worstParts = await db
    .select({
      reference:       parts.referenceRaw,
      name:            parts.name,
      slug:            parts.slug,
      status:          parts.status,
      confidenceScore: parts.confidenceScore,
      needsReview:     parts.needsReview,
      lifecycleNote:   parts.lifecycleNote,
      mfgName:         manufacturers.name,
      mfgSlug:         manufacturers.slug,
    })
    .from(parts)
    .innerJoin(manufacturers, eq(manufacturers.id, parts.manufacturerId))
    .where(
      or(
        and(isNotNull(parts.confidenceScore), lt(parts.confidenceScore, 60)),
        eq(parts.needsReview, true),
      ),
    )
    .orderBy(asc(parts.confidenceScore))
    .limit(30);

  // ── Fiches les plus incomplètes (tri par nb de champs manquants) ──────────
  const worstIncomplete = await db.execute(sql`
    SELECT p.reference_raw AS reference, p.name, p.slug,
           m.slug AS mfg_slug, m.name AS mfg_name,
           (CASE WHEN p.description IS NULL OR p.description = '' THEN 1 ELSE 0 END)
           + (CASE WHEN p.product_url IS NULL THEN 1 ELSE 0 END)
           + (CASE WHEN p.category_id IS NULL THEN 1 ELSE 0 END)
           + (CASE WHEN p.status = 'unknown' THEN 1 ELSE 0 END) AS missing
    FROM parts p
    JOIN manufacturers m ON m.id = p.manufacturer_id
    WHERE p.description IS NULL OR p.product_url IS NULL
       OR p.category_id IS NULL OR p.status = 'unknown'
    ORDER BY missing DESC, p.updated_at ASC
    LIMIT 30
  `) as unknown as Array<{
    reference: string; name: string; slug: string;
    mfg_slug: string; mfg_name: string; missing: number;
  }>;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-bold tracking-tight">Qualité des données</h1>
      <p className="mt-2 text-zinc-600">
        {total.toLocaleString("fr-FR")} pièces au catalogue — tableau de bord pour
        piloter les runs <code className="rounded bg-zinc-100 px-1 font-mono text-sm">--repair</code> /{" "}
        <code className="rounded bg-zinc-100 px-1 font-mono text-sm">--update</code> du script.
      </p>

      {/* Stats */}
      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Sans description"     value={Number(stats.noDescription)} total={total} tone={Number(stats.noDescription) > total * 0.3 ? "bad" : Number(stats.noDescription) > 0 ? "warn" : "ok"} />
        <StatCard label="Sans URL produit"     value={Number(stats.noProductUrl)}  total={total} tone={Number(stats.noProductUrl) > total * 0.5 ? "bad" : Number(stats.noProductUrl) > 0 ? "warn" : "ok"} />
        <StatCard label="Sans catégorie"       value={Number(stats.noCategory)}    total={total} tone={Number(stats.noCategory) > total * 0.3 ? "bad" : Number(stats.noCategory) > 0 ? "warn" : "ok"} />
        <StatCard label="Statut inconnu"       value={Number(stats.unknownStatus)} total={total} tone={Number(stats.unknownStatus) > total * 0.3 ? "bad" : Number(stats.unknownStatus) > 0 ? "warn" : "ok"} />
        <StatCard label="Sans datasheet"       value={Number(stats.noDatasheet)}   total={total} tone="warn" />
        <StatCard label="Sans aucune offre"    value={Number(stats.noOffers)}      total={total} tone={Number(stats.noOffers) > 0 ? "bad" : "ok"} />
        <StatCard label="Confiance < 60"       value={Number(stats.lowConfidence)} total={total} tone={Number(stats.lowConfidence) > 0 ? "warn" : "ok"} />
        <StatCard label="À vérifier (review)"  value={Number(stats.needsReview)}   total={total} tone={Number(stats.needsReview) > 0 ? "warn" : "ok"} />
      </div>

      {/* Monétisation — clics revendeurs */}
      <section className="mt-12">
        <h2 className="text-xl font-semibold">
          Clics revendeurs — 30 derniers jours{" "}
          <span className="text-zinc-400">({totalClicks.toLocaleString("fr-FR")})</span>
        </h2>
        {clickStats.length === 0 ? (
          <p className="mt-2 text-sm text-zinc-500">
            Aucun clic enregistré. Les liens revendeurs passent par /go dès cette mise en ligne.
          </p>
        ) : (
          <table className="mt-3 w-full max-w-xl text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-200 text-zinc-500">
                <th className="py-2 pr-4 font-medium">Revendeur</th>
                <th className="py-2 pr-4 font-medium">Clics</th>
                <th className="py-2 font-medium">Dont affiliés</th>
              </tr>
            </thead>
            <tbody>
              {clickStats.map((c) => (
                <tr key={c.seller_slug} className="border-b border-zinc-100">
                  <td className="py-2 pr-4 font-medium">{c.seller_slug}</td>
                  <td className="py-2 pr-4">{Number(c.clicks).toLocaleString("fr-FR")}</td>
                  <td className="py-2">
                    {Number(c.affiliated_clicks) > 0 ? (
                      <span className="text-green-600">{Number(c.affiliated_clicks).toLocaleString("fr-FR")}</span>
                    ) : (
                      <span className="text-zinc-400">0 — affiliation non configurée</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* Fabricants suspects */}
      <section className="mt-12">
        <h2 className="text-xl font-semibold">
          Revendeurs ingérés comme fabricants{" "}
          <span className={suspectManufacturers.length > 0 ? "text-red-600" : "text-green-600"}>
            ({suspectManufacturers.length})
          </span>
        </h2>
        {suspectManufacturers.length === 0 ? (
          <p className="mt-2 text-sm text-zinc-500">✓ Aucun revendeur détecté dans la table des fabricants.</p>
        ) : (
          <table className="mt-3 w-full text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-200 text-zinc-500">
                <th className="py-2 pr-4 font-medium">Fabricant suspect</th>
                <th className="py-2 pr-4 font-medium">Slug</th>
                <th className="py-2 font-medium">Pièces rattachées</th>
              </tr>
            </thead>
            <tbody>
              {suspectManufacturers.map((m) => (
                <tr key={m.id} className="border-b border-zinc-100">
                  <td className="py-2 pr-4 font-medium text-red-700">{m.name}</td>
                  <td className="py-2 pr-4 font-mono text-xs">{m.slug}</td>
                  <td className="py-2">
                    <Link href={`/marque/${m.slug}`} className="text-blue-600 hover:underline">
                      {Number(m.partsCount).toLocaleString("fr-FR")} pièces →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* Confiance faible */}
      <section className="mt-12">
        <h2 className="text-xl font-semibold">Fiches à faible confiance ou à vérifier ({worstParts.length})</h2>
        {worstParts.length === 0 ? (
          <p className="mt-2 text-sm text-zinc-500">✓ Rien à signaler.</p>
        ) : (
          <table className="mt-3 w-full text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-200 text-zinc-500">
                <th className="py-2 pr-4 font-medium">Référence</th>
                <th className="py-2 pr-4 font-medium">Confiance</th>
                <th className="py-2 pr-4 font-medium">Statut</th>
                <th className="py-2 font-medium">Note</th>
              </tr>
            </thead>
            <tbody>
              {worstParts.map((p) => (
                <tr key={`${p.mfgSlug}-${p.slug}`} className="border-b border-zinc-100">
                  <td className="py-2 pr-4">
                    <Link href={`/piece/${p.mfgSlug}/${p.slug}`} className="font-mono text-blue-600 hover:underline">
                      {p.mfgName} {p.reference}
                    </Link>
                  </td>
                  <td className="py-2 pr-4">
                    {p.confidenceScore != null ? (
                      <span className={p.confidenceScore < 40 ? "font-semibold text-red-600" : "text-amber-600"}>
                        {p.confidenceScore}
                      </span>
                    ) : "—"}
                  </td>
                  <td className="py-2 pr-4">{p.status}{p.needsReview && " ⚠️"}</td>
                  <td className="py-2 text-xs text-zinc-500">{p.lifecycleNote ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* Fiches incomplètes */}
      <section className="mt-12">
        <h2 className="text-xl font-semibold">Fiches les plus incomplètes (top 30)</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Champs comptés : description, URL produit, catégorie, statut. Le mode{" "}
          <code className="rounded bg-zinc-100 px-1 font-mono">--repair</code> traite ces pièces en priorité.
        </p>
        <table className="mt-3 w-full text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-200 text-zinc-500">
              <th className="py-2 pr-4 font-medium">Référence</th>
              <th className="py-2 pr-4 font-medium">Nom</th>
              <th className="py-2 font-medium">Champs manquants</th>
            </tr>
          </thead>
          <tbody>
            {worstIncomplete.map((p) => (
              <tr key={`${p.mfg_slug}-${p.slug}`} className="border-b border-zinc-100">
                <td className="py-2 pr-4">
                  <Link href={`/piece/${p.mfg_slug}/${p.slug}`} className="font-mono text-blue-600 hover:underline">
                    {p.mfg_name} {p.reference}
                  </Link>
                </td>
                <td className="max-w-xs truncate py-2 pr-4 text-zinc-600">{p.name}</td>
                <td className="py-2">
                  <span className={Number(p.missing) >= 3 ? "font-semibold text-red-600" : "text-amber-600"}>
                    {p.missing} / 4
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
