import { NextRequest } from "next/server";
import { asc, eq, inArray, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { siteUrl } from "@/lib/site-url";
import { buildSpreadsheetML, spreadsheetMLResponse } from "@/lib/spreadsheet-ml";

const { parts, manufacturers, categories, offers } = schema;

export const dynamic = "force-dynamic";

type Params = Promise<{ categorie: string }>;

function csvCell(value: string): string {
  const escaped = value.replace(/"/g, '""');
  return /^[=+\-@\t\r\n]/.test(value) ? `"'${escaped}"` : `"${escaped}"`;
}

export async function GET(req: NextRequest, { params }: { params: Params }) {
  const { categorie } = await params;
  const format = req.nextUrl.searchParams.get("format");

  const [category] = await db
    .select()
    .from(categories)
    .where(eq(categories.slug, categorie))
    .limit(1);

  if (!category) {
    return new Response("Not found", { status: 404 });
  }

  const rows = await db
    .select({
      referenceRaw: parts.referenceRaw,
      name: parts.name,
      status: parts.status,
      slug: parts.slug,
      partId: parts.id,
      manufacturerName: manufacturers.name,
      manufacturerSlug: manufacturers.slug,
    })
    .from(parts)
    .innerJoin(manufacturers, eq(manufacturers.id, parts.manufacturerId))
    .where(eq(parts.categoryId, category.id))
    .orderBy(asc(parts.referenceNormalized));

  const ids = rows.map((r) => r.partId);
  const priceRows =
    ids.length > 0
      ? await db
          .select({
            partId: offers.partId,
            minPrice: sql<string>`min(${offers.price})`,
            currency: offers.currency,
          })
          .from(offers)
          .where(inArray(offers.partId, ids))
          .groupBy(offers.partId, offers.currency)
      : [];

  const priceMap = new Map(priceRows.map((p) => [p.partId, p]));

  const date = new Date().toISOString().slice(0, 10);
  const dataRows = rows.map((r) => {
    const price = priceMap.get(r.partId);
    return {
      ref: r.referenceRaw,
      name: r.name,
      manufacturer: r.manufacturerName,
      category: category.name,
      status: r.status,
      minPrice: price?.minPrice ? parseFloat(price.minPrice) : null,
      currency: price?.currency ?? "EUR",
      url: `${siteUrl}/piece/${r.manufacturerSlug}/${r.slug}`,
    };
  });

  if (format === "xlsx") {
    const headers = ["Référence", "Désignation", "Fabricant", "Catégorie", "Statut", "Prix min", "Devise", "URL"];
    const xlsRows = dataRows.map((r) => [r.ref, r.name, r.manufacturer, r.category, r.status, r.minPrice, r.currency, r.url]);
    return spreadsheetMLResponse(buildSpreadsheetML(headers, xlsRows, category.name), `${category.slug}-${date}.xls`);
  }

  const header = "reference,name,manufacturer,category,status,min_price,currency,product_url\n";
  const csvRows = dataRows.map((r) => {
    const fields = [
      csvCell(r.ref),
      csvCell(r.name),
      csvCell(r.manufacturer),
      csvCell(r.category),
      r.status,
      r.minPrice ?? "",
      r.currency,
      csvCell(r.url),
    ];
    return fields.join(",");
  });

  return new Response(header + csvRows.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${category.slug}-${date}.csv"`,
    },
  });
}
