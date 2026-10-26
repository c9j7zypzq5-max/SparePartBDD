import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { schema } from "@/db";
import { getCategoryBySlug } from "@/lib/queries";
import { exportResponse, loadExportRows } from "@/lib/part-export";
import { rateLimitResponse } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

type Params = Promise<{ categorie: string }>;

export async function GET(req: NextRequest, { params }: { params: Params }) {
  const limited = rateLimitResponse(req, "export", { limit: 10 });
  if (limited) return limited;

  const { categorie } = await params;
  const category = await getCategoryBySlug(categorie);
  if (!category) {
    return new Response("Not found", { status: 404 });
  }

  const rows = await loadExportRows(eq(schema.parts.categoryId, category.id));
  return exportResponse(rows, {
    format: req.nextUrl.searchParams.get("format"),
    baseName: category.slug,
    sheetName: category.name,
  });
}
