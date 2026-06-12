import { NextRequest } from "next/server";
import { db, schema } from "@/db";
import { clientIp, rateLimit, tooManyRequests } from "@/lib/rate-limit";

const { watchlistSubscriptions } = schema;

export async function POST(req: NextRequest) {
  // Anti-spam : 5 abonnements / minute / IP
  const rl = rateLimit(`watchlist:${clientIp(req)}`, 5, 60_000);
  if (!rl.ok) return tooManyRequests(rl);

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
