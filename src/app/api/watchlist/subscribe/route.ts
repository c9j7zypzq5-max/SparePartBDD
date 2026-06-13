import { NextRequest } from "next/server";
import { db, schema } from "@/db";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

const { watchlistSubscriptions } = schema;

export async function POST(req: NextRequest) {
  if (!rateLimit(getClientIp(req.headers), { limit: 5, windowMs: 60_000 })) {
    return Response.json({ error: "Too many requests" }, { status: 429 });
  }

  let body: { email: string; references: string[] };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const email = body.email?.trim();
  const references = Array.isArray(body.references) ? body.references.filter(Boolean) : [];

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return Response.json({ error: "email invalide" }, { status: 400 });
  }

  if (references.length === 0) {
    return Response.json({ error: "La liste est vide" }, { status: 400 });
  }

  await db.insert(watchlistSubscriptions).values({ email, references });

  return Response.json({ ok: true });
}
