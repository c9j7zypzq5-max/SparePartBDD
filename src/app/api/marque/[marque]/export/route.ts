import { NextRequest } from "next/server";
import { asc, eq, inArray, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { siteUrl } from "@/lib/site-url";
import { buildSpreadsheetML, spreadsheetMLResponse } from "@/lib/spreadsheet-ml";

const { parts, manufacturers, offers } = schema;

export const dynamic = "force-dynamic";

type Params = Promise<{ marque: string }>;

function csvCell(value: string): string {
  const escaped = value.replace(/"/g, '""');
  return /^[=+\-@\t\r\n]/.test(value) ? `"'${escaped}"` : `"${escaped}"`;
}

export async function GET(req: NextRequest, { params }: { params: Params }) {
  const { marque } = await params;
  const format = req.nextUrl.searchParams.get("format");

  const [manufacturer] = await db
    .select()
    .from(manufacturers)
    .where(eq(manufacturers.slug, marque))
    .limit(1);

  if (!manufacturer) {
    return new Response("Not found", { status: 404 });
  }

  const allPartRows = await db
    .select({
      id: parts.id,
      referenceRaw: parts.referenceRaw,
      name: parts.name,
      status: parts.status,
      slug: parts.slug,
    })
    .from(parts)
    .where(eq(parts.manufacturerId, manufacturer.id))
    .orderBy(asc(parts.referenceNormalized));

  const ids = allPartRows.map((p) => p.id);
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
  const dataRows = allPartRows.map((r) => {
    const price = priceMap.get(r.id);
    return {
      ref: r.referenceRaw,
      name: r.name,
      manufacturer: manufacturer.name,
      status: r.status,
      minPrice: price?.minPrice ? parseFloat(price.minPrice) : null,
      currency: price?.currency ?? "EUR",
      url: `${siteUrl}/piece/${manufacturer.slug}/${r.slug}`,
    };
  });

  if (format === "xlsx") {
    const headers = ["Référence", "Désignation", "Fabricant", "Statut", "Prix min", "Devise", "URL"];
    const rows = dataRows.map((r) => [r.ref, r.name, r.manufacturer, r.status, r.minPrice, r.currency, r.url]);
    return spreadsheetMLResponse(buildSpreadsheetML(headers, rows, manufacturer.name), `${manufacturer.slug}-${date}.xls`);
  }

  const header = "reference,name,manufacturer,status,min_price,currency,product_url\n";
  const csvRows = dataRows.map((r) => {
    const fields = [
      csvCell(r.ref),
      csvCell(r.name),
      csvCell(r.manufacturer),
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
      "Content-Disposition": `attachment; filename="${manufacturer.slug}-${date}.csv"`,
    },
  });
}
