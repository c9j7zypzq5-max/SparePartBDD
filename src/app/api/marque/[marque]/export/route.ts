import { NextRequest } from "next/server";
import { asc, eq, sql } from "drizzle-orm";
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

  const rows = await db
    .select({
      referenceRaw: parts.referenceRaw,
      name: parts.name,
      status: parts.status,
      productUrl: parts.productUrl,
      slug: parts.slug,
    })
    .from(parts)
    .where(eq(parts.manufacturerId, manufacturer.id))
    .orderBy(asc(parts.referenceNormalized));

  const partIds = rows.map((_, i) => i);
  const slugToId = new Map<string, number>();
  const allPartRows = await db
    .select({ id: parts.id, slug: parts.slug })
    .from(parts)
    .where(eq(parts.manufacturerId, manufacturer.id));
  allPartRows.forEach((p) => slugToId.set(p.slug, p.id));

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
          .where(
            ids.length === 1
              ? eq(offers.partId, ids[0])
              : sql`${offers.partId} = any(${sql.raw(`array[${ids.join(",")}]`)})`,
          )
          .groupBy(offers.partId, offers.currency)
      : [];

  const priceMap = new Map(priceRows.map((p) => [p.partId, p]));

  const header = "reference,name,manufacturer,status,min_price,currency,product_url\n";
  const csvRows = rows.map((r) => {
    const id = slugToId.get(r.slug);
    const price = id ? priceMap.get(id) : undefined;
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
