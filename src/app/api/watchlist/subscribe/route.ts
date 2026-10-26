import { NextRequest } from "next/server";
import { db, schema } from "@/db";
import { rateLimitResponse } from "@/lib/rate-limit";

const { watchlistSubscriptions } = schema;

export async function POST(req: NextRequest) {
  const limited = rateLimitResponse(req, "watchlist-subscribe", { limit: 5 });
  if (limited) return limited;

  let body: { email: string; references: string[] };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const email = body.email?.trim();
  const references = Array.isArray(body.references)
    ? body.references.filter(Boolean).slice(0, 20).map((r) => String(r).slice(0, 100))
    : [];

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return Response.json({ error: "email invalide" }, { status: 400 });
  }

  if (references.length === 0) {
    return Response.json({ error: "La liste est vide" }, { status: 400 });
  }

  await db
    .insert(watchlistSubscriptions)
    .values({ email, references })
    .onConflictDoUpdate({
      target: watchlistSubscriptions.email,
      set: { references },
    });

  return Response.json({ ok: true });
}
