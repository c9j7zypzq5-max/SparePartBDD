import { NextRequest } from "next/server";
import { asc, eq, inArray, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { siteUrl } from "@/lib/site-url";

const { parts, manufacturers, categories, offers } = schema;

export const dynamic = "force-dynamic";

type Params = Promise<{ categorie: string }>;

function csvCell(value: string): string {
  const escaped = value.replace(/"/g, '""');
  return /^[=+\-@\t\r\n]/.test(value) ? `"'${escaped}"` : `"${escaped}"`;
}

export async function GET(_req: NextRequest, { params }: { params: Params }) {
  const { categorie } = await params;

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

  const header = "reference,name,manufacturer,category,status,min_price,currency,product_url\n";
  const csvRows = rows.map((r) => {
    const price = priceMap.get(r.partId);
    const fields = [
      csvCell(r.referenceRaw),
      csvCell(r.name),
      csvCell(r.manufacturerName),
      csvCell(category.name),
      r.status,
      price?.minPrice ?? "",
      price?.currency ?? "EUR",
      csvCell(`${siteUrl}/piece/${r.manufacturerSlug}/${r.slug}`),
    ];
    return fields.join(",");
  });

  const csv = header + csvRows.join("\n");
  const filename = `${category.slug}-${new Date().toISOString().slice(0, 10)}.csv`;

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
