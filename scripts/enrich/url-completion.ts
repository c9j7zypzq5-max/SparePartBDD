/**
 * Enrichissement des URLs : page produit fabricant + revendeurs FR.
 *
 * Pour chaque pièce sans `product_url`, demande à Claude Haiku l'URL officielle
 * du fabricant, puis met à jour la DB. Met aussi à jour `sellers.website`
 * avec les URLs françaises des revendeurs.
 *
 * Usage :
 *   DATABASE_URL=... ANTHROPIC_API_KEY=... tsx scripts/enrich/url-completion.ts
 *
 * Options :
 *   DRY_RUN=1          — affiche les mises à jour sans écrire en DB
 *   SKIP_HAIKU=1       — utilise uniquement le cache JSON (pas d'appels API)
 *   BATCH_SIZE=10      — nombre d'appels Haiku simultanés (défaut 8)
 */
import Anthropic from "@anthropic-ai/sdk";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq, isNull } from "drizzle-orm";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import * as schema from "../../src/db/schema";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Config ────────────────────────────────────────────────────────────────────

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL requis");
  process.exit(1);
}

const DRY_RUN = process.env.DRY_RUN === "1";
const SKIP_HAIKU = process.env.SKIP_HAIKU === "1";
const BATCH_SIZE = Number(process.env.BATCH_SIZE ?? 8);
const MODEL = "claude-haiku-4-5-20251001";

const client = postgres(DATABASE_URL, { max: 5 });
const db = drizzle(client, { schema });

const anthropic = SKIP_HAIKU
  ? null
  : new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ── Cache JSON (généré par agents Haiku) ─────────────────────────────────────

interface UrlCache {
  parts: Record<string, string>;
  sellers_fr: Record<string, string>;
}

const cache: UrlCache = JSON.parse(
  readFileSync(join(__dirname, "product-urls.json"), "utf-8"),
);

// ── Haiku : URL produit fabricant ─────────────────────────────────────────────

async function askHaikuProductUrl(
  manufacturer: string,
  reference: string,
): Promise<string | null> {
  if (!anthropic) return null;
  try {
    const msg = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 256,
      messages: [
        {
          role: "user",
          content:
            `What is the official manufacturer product page URL for part reference "${reference}" from ${manufacturer}?\n` +
            `Return ONLY the URL starting with https://, nothing else.\n` +
            `If you don't know with certainty, return: null`,
        },
      ],
    });
    const text =
      msg.content[0].type === "text" ? msg.content[0].text.trim() : "";
    if (text === "null" || !text.startsWith("https://")) return null;
    return text;
  } catch {
    return null;
  }
}

// ── Haiku : URL revendeur FR ──────────────────────────────────────────────────

async function askHaikuSellerFrUrl(sellerName: string): Promise<string | null> {
  if (!anthropic) return null;
  try {
    const msg = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 128,
      messages: [
        {
          role: "user",
          content:
            `What is the French website URL (prefer .fr domain or /fr/ path) for the industrial parts reseller "${sellerName}"?\n` +
            `Return ONLY the homepage URL starting with https://, nothing else.\n` +
            `If they have no French site, return their main site URL.\n` +
            `If unknown, return: null`,
        },
      ],
    });
    const text =
      msg.content[0].type === "text" ? msg.content[0].text.trim() : "";
    if (text === "null" || !text.startsWith("https://")) return null;
    return text;
  } catch {
    return null;
  }
}

// ── Run par lots (concurrence contrôlée) ─────────────────────────────────────

async function runInBatches<T, R>(
  items: T[],
  fn: (item: T) => Promise<R>,
  batchSize: number,
): Promise<R[]> {
  const results: R[] = [];
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(fn));
    results.push(...batchResults);
  }
  return results;
}

// ── Étape 1 : productUrl des pièces ──────────────────────────────────────────

async function enrichPartsProductUrl() {
  const rows = await db
    .select({
      id: schema.parts.id,
      referenceRaw: schema.parts.referenceRaw,
      referenceNormalized: schema.parts.referenceNormalized,
      manufacturerName: schema.manufacturers.name,
    })
    .from(schema.parts)
    .innerJoin(
      schema.manufacturers,
      eq(schema.parts.manufacturerId, schema.manufacturers.id),
    )
    .where(isNull(schema.parts.productUrl));

  console.log(`\n── Étape 1 : ${rows.length} pièce(s) sans productUrl`);

  let updated = 0;
  let fromCache = 0;
  let fromHaiku = 0;
  let skipped = 0;

  await runInBatches(
    rows,
    async (row) => {
      // Cherche dans le cache JSON d'abord
      let url =
        cache.parts[row.referenceRaw] ??
        cache.parts[row.referenceNormalized] ??
        null;

      if (!url) {
        url = await askHaikuProductUrl(row.manufacturerName, row.referenceRaw);
        if (url) fromHaiku++;
        else skipped++;
      } else {
        fromCache++;
      }

      if (!url) return;

      console.log(`  [${url ? "✓" : "✗"}] ${row.manufacturerName} ${row.referenceRaw} → ${url}`);

      if (!DRY_RUN && url) {
        await db
          .update(schema.parts)
          .set({ productUrl: url })
          .where(eq(schema.parts.id, row.id));
        updated++;
      }
    },
    BATCH_SIZE,
  );

  console.log(
    `  → ${updated} mis à jour (${fromCache} cache, ${fromHaiku} Haiku, ${skipped} sans URL)`,
  );
}

// ── Étape 2 : website des revendeurs (URLs FR) ────────────────────────────────

async function enrichSellersFrWebsite() {
  const sellers = await db
    .select({
      id: schema.sellers.id,
      name: schema.sellers.name,
      website: schema.sellers.website,
    })
    .from(schema.sellers);

  console.log(`\n── Étape 2 : ${sellers.length} revendeur(s) — URLs françaises`);

  let updated = 0;

  for (const seller of sellers) {
    const frUrl =
      cache.sellers_fr[seller.name] ??
      (await askHaikuSellerFrUrl(seller.name));

    if (!frUrl) continue;

    // Ne met à jour que si l'URL change (version FR préférée)
    if (seller.website === frUrl) {
      console.log(`  [=] ${seller.name} — déjà à jour (${frUrl})`);
      continue;
    }

    console.log(
      `  [✓] ${seller.name} : ${seller.website ?? "null"} → ${frUrl}`,
    );

    if (!DRY_RUN) {
      await db
        .update(schema.sellers)
        .set({ website: frUrl })
        .where(eq(schema.sellers.id, seller.id));
      updated++;
    }
  }

  console.log(`  → ${updated} revendeur(s) mis à jour`);
}

// ── Étape 3 : website des fabricants (si manquant) ───────────────────────────

async function enrichManufacturersWebsite() {
  const mfrs = await db
    .select({ id: schema.manufacturers.id, name: schema.manufacturers.name })
    .from(schema.manufacturers)
    .where(isNull(schema.manufacturers.website));

  if (mfrs.length === 0) {
    console.log(`\n── Étape 3 : tous les fabricants ont déjà un site web`);
    return;
  }

  console.log(`\n── Étape 3 : ${mfrs.length} fabricant(s) sans website`);

  let updated = 0;
  for (const mfr of mfrs) {
    if (!anthropic) continue;
    const msg = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 128,
      messages: [
        {
          role: "user",
          content:
            `What is the official homepage URL for the manufacturer "${mfr.name}"?\n` +
            `Return ONLY the URL starting with https://, nothing else.`,
        },
      ],
    });
    const url =
      msg.content[0].type === "text" ? msg.content[0].text.trim() : "";
    if (!url.startsWith("https://")) continue;

    console.log(`  [✓] ${mfr.name} → ${url}`);
    if (!DRY_RUN) {
      await db
        .update(schema.manufacturers)
        .set({ website: url })
        .where(eq(schema.manufacturers.id, mfr.id));
      updated++;
    }
  }
  console.log(`  → ${updated} fabricant(s) mis à jour`);
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log(
    `SparePartBDD — enrichissement URLs${DRY_RUN ? " [DRY RUN]" : ""}`,
  );
  console.log(`Modèle Haiku : ${SKIP_HAIKU ? "désactivé (cache JSON seul)" : MODEL}`);
  console.log(`Concurrence : ${BATCH_SIZE} appels simultanés\n`);

  await enrichPartsProductUrl();
  await enrichSellersFrWebsite();
  await enrichManufacturersWebsite();

  await client.end();
  console.log("\n✔ Enrichissement terminé.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
