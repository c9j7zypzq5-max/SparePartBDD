import { NextRequest, NextResponse } from "next/server";
import {
  getManufacturerBySlug,
  getManufacturerPartsPaginated,
} from "@/lib/queries";

const PAGE_SIZE = 24;

type Params = Promise<{ marque: string }>;

export async function GET(req: NextRequest, { params }: { params: Params }) {
  const { marque } = await params;
  const offset = parseInt(req.nextUrl.searchParams.get("offset") ?? "0", 10);

  const manufacturer = await getManufacturerBySlug(marque);
  if (!manufacturer) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Fetch one extra to detect hasMore without a separate count query
  const rows = await getManufacturerPartsPaginated(manufacturer.id, PAGE_SIZE + 1, offset);
  const hasMore = rows.length > PAGE_SIZE;
  const pageParts = hasMore ? rows.slice(0, PAGE_SIZE) : rows;

  return NextResponse.json({
    parts: pageParts.map((p) => ({
      id: p.id,
      slug: p.slug,
      name: p.name,
      referenceRaw: p.referenceRaw,
      status: p.status,
      manufacturerSlug: marque,
      manufacturerName: manufacturer.name,
    })),
    hasMore,
  });
}
