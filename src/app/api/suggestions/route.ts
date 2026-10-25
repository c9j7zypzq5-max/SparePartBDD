import { NextRequest } from "next/server";
import { db, schema } from "@/db";
import { rateLimitResponse } from "@/lib/rate-limit";

const { suggestions } = schema;

export async function POST(req: NextRequest) {
  const limited = rateLimitResponse(req, "suggestions", { limit: 10 });
  if (limited) return limited;

  let body: { reference: string; manufacturer?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const reference = body.reference?.trim().slice(0, 100);
  if (!reference) {
    return Response.json({ error: "reference is required" }, { status: 400 });
  }

  await db.insert(suggestions).values({
    reference,
    manufacturer: body.manufacturer?.trim().slice(0, 100) || null,
  });

  return Response.json({ ok: true });
}
