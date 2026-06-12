import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/db";
import { findResellerByUrl } from "@/lib/resellers";
import { decorateAffiliate } from "@/lib/affiliate";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /go?to=<url>&seller=<slug>&ref=<reference>&part=<partId>
 *
 * Redirection traçante vers un revendeur : enregistre le clic, décore l'URL
 * avec l'affiliation, puis redirige (302). Protégé contre l'open-redirect :
 * la destination DOIT être une URL d'un revendeur connu.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const to     = searchParams.get("to");
  const seller = searchParams.get("seller") ?? "";
  const ref    = searchParams.get("ref") ?? undefined;
  const partId = searchParams.get("part");

  if (!to) {
    return NextResponse.json({ error: "Paramètre 'to' requis" }, { status: 400 });
  }

  // Validation : destination HTTPS chez un revendeur reconnu (anti open-redirect)
  let dest: URL;
  try {
    dest = new URL(to);
  } catch {
    return NextResponse.json({ error: "URL invalide" }, { status: 400 });
  }
  const reseller = findResellerByUrl(dest.toString());
  if (dest.protocol !== "https:" || !reseller) {
    return NextResponse.json({ error: "Destination non autorisée" }, { status: 400 });
  }

  // Slug fiable = celui déduit de l'URL (le paramètre seller n'est qu'indicatif)
  const sellerSlug = reseller.slug || seller;
  const { url: finalUrl, affiliated } = decorateAffiliate(sellerSlug, dest.toString());

  // Enregistrement best-effort — ne jamais bloquer la redirection. Au-delà de
  // 60 clics/min/IP (bot), on redirige toujours mais on cesse d'écrire en base
  // pour ne pas polluer les statistiques ni saturer la table.
  const rl = rateLimit(`go:${clientIp(req)}`, 60, 60_000);
  if (rl.ok) {
    try {
      await db.insert(schema.outboundClicks).values({
        partId:     partId ? Number(partId) : null,
        sellerSlug,
        reference:  ref,
        affiliated,
      });
    } catch {
      /* la traçabilité ne doit pas casser le parcours utilisateur */
    }
  }

  return NextResponse.redirect(finalUrl, 302);
}
