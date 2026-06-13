import { NextRequest } from "next/server";
import { db, schema } from "@/db";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

const { suggestions } = schema;

export async function POST(req: NextRequest) {
  if (!rateLimit(getClientIp(req.headers), { limit: 10, windowMs: 60_000 })) {
    return Response.json({ error: "Too many requests" }, { status: 429 });
  }

  let body: { reference: string; manufacturer?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const reference = body.reference?.trim();
  if (!reference) {
    return Response.json({ error: "reference is required" }, { status: 400 });
  }

  await db.insert(suggestions).values({
    reference,
    manufacturer: body.manufacturer?.trim() || null,
  });

  return Response.json({ ok: true });
}
