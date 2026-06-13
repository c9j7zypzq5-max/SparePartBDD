import { NextRequest } from "next/server";
import { asc, eq, inArray, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { siteUrl } from "@/lib/site-url";

const { parts, manufacturers, offers } = schema;

export const dynamic = "force-dynamic";

type Params = Promise<{ marque: string }>;

export async function GET(_req: NextRequest, { params }: { params: Params }) {
  const { marque } = await params;

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

  const header = "reference,name,manufacturer,status,min_price,currency,product_url\n";
  const csvRows = allPartRows.map((r) => {
    const price = priceMap.get(r.id);
    const fields = [
      `"${r.referenceRaw}"`,
      `"${r.name.replace(/"/g, '""')}"`,
      `"${manufacturer.name}"`,
      r.status,
      price?.minPrice ?? "",
      price?.currency ?? "EUR",
      `"${siteUrl}/piece/${manufacturer.slug}/${r.slug}"`,
    ];
    return fields.join(",");
  });

  const csv = header + csvRows.join("\n");
  const filename = `${manufacturer.slug}-${new Date().toISOString().slice(0, 10)}.csv`;

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
