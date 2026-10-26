import { asc, eq, sql, type SQL } from "drizzle-orm";
import { db, schema } from "@/db";
import { siteUrl } from "@/lib/site-url";
import { toCsv } from "@/lib/csv";
import { buildSpreadsheetML, spreadsheetMLResponse } from "@/lib/spreadsheet-ml";

const { categories, manufacturers, parts } = schema;

export interface ExportRow {
  reference: string;
  name: string;
  manufacturer: string;
  category: string | null;
  status: string;
  minPrice: number | null;
  currency: string;
  url: string;
}

/** Offre la moins chère de la pièce : prix et devise viennent de la même offre. */
const cheapestOffer = (column: "price" | "currency") =>
  sql<string | null>`(SELECT o.${sql.raw(column)} FROM offers o WHERE o.part_id = ${parts.id} AND o.price IS NOT NULL ORDER BY o.price LIMIT 1)`;

/** Pièces d'un fabricant ou d'une catégorie, en une seule requête. */
export async function loadExportRows(where: SQL): Promise<ExportRow[]> {
  const rows = await db
    .select({
      reference: parts.referenceRaw,
      name: parts.name,
      status: parts.status,
      slug: parts.slug,
      manufacturerName: manufacturers.name,
      manufacturerSlug: manufacturers.slug,
      categoryName: categories.name,
      minPrice: cheapestOffer("price"),
      currency: cheapestOffer("currency"),
    })
    .from(parts)
    .innerJoin(manufacturers, eq(manufacturers.id, parts.manufacturerId))
    .leftJoin(categories, eq(categories.id, parts.categoryId))
    .where(where)
    .orderBy(asc(parts.referenceNormalized));

  return rows.map((r) => ({
    reference: r.reference,
    name: r.name,
    manufacturer: r.manufacturerName,
    category: r.categoryName,
    status: r.status,
    minPrice: r.minPrice != null ? Number(r.minPrice) : null,
    currency: r.currency ?? "EUR",
    url: `${siteUrl}/piece/${r.manufacturerSlug}/${r.slug}`,
  }));
}

/** Réponse CSV (défaut) ou Excel (?format=xlsx) pour une liste de pièces. */
export function exportResponse(
  rows: ExportRow[],
  opts: { format: string | null; baseName: string; sheetName: string },
): Response {
  const date = new Date().toISOString().slice(0, 10);

  if (opts.format === "xlsx") {
    const headers = ["Référence", "Désignation", "Fabricant", "Catégorie", "Statut", "Prix min", "Devise", "URL"];
    const xlsRows = rows.map((r) => [r.reference, r.name, r.manufacturer, r.category, r.status, r.minPrice, r.currency, r.url]);
    return spreadsheetMLResponse(buildSpreadsheetML(headers, xlsRows, opts.sheetName), `${opts.baseName}-${date}.xls`);
  }

  const csv = toCsv([
    ["reference", "name", "manufacturer", "category", "status", "min_price", "currency", "product_url"],
    ...rows.map((r) => [r.reference, r.name, r.manufacturer, r.category, r.status, r.minPrice, r.currency, r.url]),
  ]);
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${opts.baseName}-${date}.csv"`,
    },
  });
}
