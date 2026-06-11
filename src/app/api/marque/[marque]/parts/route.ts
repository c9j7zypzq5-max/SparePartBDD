import { NextRequest, NextResponse } from "next/server";
import {
  getManufacturerBySlug,
  getManufacturerPartsPaginatedFiltered,
} from "@/lib/queries";

const PAGE_SIZE = 24;

type Params = Promise<{ marque: string }>;

export async function GET(req: NextRequest, { params }: { params: Params }) {
  const { marque } = await params;
  const offset = parseInt(req.nextUrl.searchParams.get("offset") ?? "0", 10);
  const status = req.nextUrl.searchParams.get("status") ?? undefined;
  const sort = req.nextUrl.searchParams.get("sort") ?? undefined;

  const manufacturer = await getManufacturerBySlug(marque);
  if (!manufacturer) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const rows = await getManufacturerPartsPaginatedFiltered(
    manufacturer.id,
    PAGE_SIZE + 1,
    offset,
    { status, sort },
  );
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
