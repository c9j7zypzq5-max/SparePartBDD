import { NextRequest } from "next/server";
import { db, schema } from "@/db";
import { clientIp, rateLimit, tooManyRequests } from "@/lib/rate-limit";

const { suggestions } = schema;

export async function POST(req: NextRequest) {
  // Anti-spam : 5 suggestions / minute / IP
  const rl = rateLimit(`suggestions:${clientIp(req)}`, 5, 60_000);
  if (!rl.ok) return tooManyRequests(rl);

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
