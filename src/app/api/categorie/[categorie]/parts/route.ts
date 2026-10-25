import { NextRequest, NextResponse } from "next/server";
import { intParam } from "@/lib/params";
import { getCategoryBySlug, getCategoryPartsPaginated, getPartCardExtras } from "@/lib/queries";

const PAGE_SIZE = 24;

type Params = Promise<{ categorie: string }>;

export async function GET(req: NextRequest, { params }: { params: Params }) {
  const { categorie } = await params;
  const offset = intParam(req.nextUrl.searchParams.get("offset"), { fallback: 0, min: 0, max: 100_000 });

  const category = await getCategoryBySlug(categorie);
  if (!category) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const rows = await getCategoryPartsPaginated(category.id, PAGE_SIZE + 1, offset);
  const hasMore = rows.length > PAGE_SIZE;
  const pageRows = hasMore ? rows.slice(0, PAGE_SIZE) : rows;
  const extras = await getPartCardExtras(pageRows.map(({ part }) => part));

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
      extras: extras.get(part.id),
    })),
    hasMore,
  });
}
