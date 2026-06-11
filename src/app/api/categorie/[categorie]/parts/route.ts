import { NextRequest, NextResponse } from "next/server";
import { getCategoryBySlug, getCategoryPartsPaginated } from "@/lib/queries";

const PAGE_SIZE = 24;

type Params = Promise<{ categorie: string }>;

export async function GET(req: NextRequest, { params }: { params: Params }) {
  const { categorie } = await params;
  const offset = parseInt(req.nextUrl.searchParams.get("offset") ?? "0", 10);

  const category = await getCategoryBySlug(categorie);
  if (!category) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const rows = await getCategoryPartsPaginated(category.id, PAGE_SIZE + 1, offset);
  const hasMore = rows.length > PAGE_SIZE;
  const pageRows = hasMore ? rows.slice(0, PAGE_SIZE) : rows;

  return NextResponse.json({
    parts: pageRows.map(({ part, manufacturer }) => ({
      id: part.id,
      slug: part.slug,
      name: part.name,
      referenceRaw: part.referenceRaw,
      status: part.status,
      manufacturerSlug: manufacturer.slug,
      manufacturerName: manufacturer.name,
      updatedAt: part.updatedAt?.toISOString() ?? null,
    })),
    hasMore,
  });
}
