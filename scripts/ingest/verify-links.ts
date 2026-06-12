#!/usr/bin/env npx tsx
/**
 * verify-links.ts — Vérifie les URLs produit de la base de données.
 *
 * Exécute des requêtes HEAD sur chaque productUrl et signale au serveur :
 *   - "dead"     → productUrl effacée + needsReview levé
 *   - "ok"       → urlVerifiedAt mis à jour
 *   - "redirect" → productUrl mise à jour avec l'URL finale
 *   - "error"    → timeout/réseau, non comptabilisé (réessayé au prochain run)
 *
 * AUCUNE dépendance à Ollama — peut tourner en continu EN PARALLÈLE avec
 * accumulate.ts --enrich ou --repair sans conflit.
 *
 * Usage :
 *   npx tsx scripts/ingest/verify-links.ts              — continu (toutes les URLs)
 *   npx tsx scripts/ingest/verify-links.ts --once       — un seul lot de 200
 *   npx tsx scripts/ingest/verify-links.ts --dry-run    — affiche sans modifier la BDD
 *   npx tsx scripts/ingest/verify-links.ts --days=3     — re-vérifie les URLs > 3 jours
 *   npx tsx scripts/ingest/verify-links.ts --batch=500  — taille de lot personnalisée
 *
 * Variables d'env (lues depuis .env à la racine) :
 *   INGEST_API_KEY — clé partagée avec le serveur Vercel
 */

import * as fs from "fs";
import * as path from "path";

// ── Config ──────────────────────────────────────────────────────────────────

const envPath = path.resolve(__dirname, "../../.env");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf-8").split("\n")) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)$/);
    if (m) process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
  }
}

const INGEST_API_KEY = process.env.INGEST_API_KEY;
if (!INGEST_API_KEY) {
  console.error("❌  INGEST_API_KEY not set. Add it to .env");
  process.exit(1);
}

const BASE_URL     = "https://spare-part-bdd.vercel.app";
const CONCURRENCY  = 12;      // HEAD requests en parallèle
const HEAD_TIMEOUT = 12_000;  // ms
const PAUSE_MS     = 2_000;   // pause entre lots (politesse)
const SLEEP_WHEN_DONE_MS = 3_600_000; // 1h avant de relancer quand tout est vérifié
const LOG_FILE     = path.resolve(__dirname, "verify-links.log");

const ONCE_MODE  = process.argv.includes("--once");
const DRY_RUN    = process.argv.includes("--dry-run");
const daysArg    = process.argv.find((a) => a.startsWith("--days="));
const DAYS       = daysArg ? parseInt(daysArg.split("=")[1]) : 7;
const batchArg   = process.argv.find((a) => a.startsWith("--batch="));
const BATCH_SIZE = batchArg ? parseInt(batchArg.split("=")[1]) : 200;

const BROWSER_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

// ── Types ───────────────────────────────────────────────────────────────────

type Outcome = "ok" | "dead" | "redirect" | "error";

interface VerifyPart {
  id: number;
  reference: string;
  manufacturer: string;
  productUrl: string;
}

interface HeadResult {
  outcome: Outcome;
  code?: number;
  newUrl?: string;
  note: string;
}

interface ReportItem {
  partId: number;
  outcome: Outcome;
  newUrl?: string;
  note: string;
}

// ── Logging ─────────────────────────────────────────────────────────────────

function log(msg: string): void {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  try { fs.appendFileSync(LOG_FILE, line + "\n"); } catch { /* non-fatal */ }
}

// ── HEAD check ──────────────────────────────────────────────────────────────

async function headCheck(url: string): Promise<HeadResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), HEAD_TIMEOUT);
  try {
    const res = await fetch(url, {
      method: "HEAD",
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "User-Agent": BROWSER_UA,
        "Accept-Language": "en-US,en;q=0.9",
      },
    });
    clearTimeout(timer);

    if (res.status === 404 || res.status === 410) {
      return { outcome: "dead", code: res.status, note: `HTTP ${res.status}` };
    }

    // Redirection suivie : vérifier si l'URL finale a changé
    if (res.url && res.url !== url) {
      try {
        const finalUrl = new URL(res.url);
        const origUrl  = new URL(url);
        if (finalUrl.hostname !== origUrl.hostname || finalUrl.pathname !== origUrl.pathname) {
          // Redirection vers la homepage = probablement page supprimée
          if (finalUrl.pathname === "/" && origUrl.pathname !== "/") {
            return { outcome: "dead", code: res.status, note: `redirect → accueil (${res.url.slice(0, 60)})` };
          }
          return { outcome: "redirect", code: res.status, newUrl: res.url, note: `→ ${res.url.slice(0, 60)}` };
        }
      } catch { /* URL parse failure, treat as ok */ }
    }

    // 403/405 = anti-bot ou method not allowed, serveur vivant
    if (res.ok || res.status === 403 || res.status === 405 || res.status === 429) {
      return { outcome: "ok", code: res.status, note: `HTTP ${res.status}` };
    }

    if (res.status >= 500) {
      return { outcome: "error", code: res.status, note: `HTTP ${res.status} (erreur serveur)` };
    }

    return { outcome: "ok", code: res.status, note: `HTTP ${res.status}` };
  } catch (err) {
    clearTimeout(timer);
    if ((err as Error).name === "AbortError") {
      return { outcome: "error", note: "timeout (12s)" };
    }
    return { outcome: "error", note: String(err).slice(0, 120) };
  }
}

// ── Concurrence ──────────────────────────────────────────────────────────────

async function runConcurrent<T>(
  items: T[],
  fn: (item: T) => Promise<void>,
  concurrency: number,
): Promise<void> {
  const queue = [...items];
  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, async () => {
      for (;;) {
        const item = queue.shift();
        if (item === undefined) return;
        await fn(item);
      }
    }),
  );
}

// ── API calls ─────────────────────────────────────────────────────────────

async function fetchPartsToVerify(): Promise<VerifyPart[]> {
  const res = await fetch(
    `${BASE_URL}/api/verify/parts?limit=${BATCH_SIZE}&days=${DAYS}`,
    { headers: { Authorization: `Bearer ${INGEST_API_KEY}` } },
  );
  if (!res.ok) throw new Error(`/api/verify/parts HTTP ${res.status}: ${await res.text()}`);
  const { parts } = (await res.json()) as { parts: VerifyPart[] };
  return parts;
}

async function sendReport(results: ReportItem[]): Promise<{ cleared: number; verified: number; skipped: number }> {
  const res = await fetch(`${BASE_URL}/api/verify/report`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${INGEST_API_KEY}`,
    },
    body: JSON.stringify({ results }),
  });
  if (!res.ok && res.status !== 207) throw new Error(`/api/verify/report HTTP ${res.status}`);
  return (await res.json()) as { cleared: number; verified: number; skipped: number };
}

// ── Main loop ────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log("═══════════════════════════════════════════════════════════");
  console.log("   SparePartSearch — Link Verifier");
  console.log(`   Concurrency: ${CONCURRENCY} | Timeout: ${HEAD_TIMEOUT / 1000}s | Batch: ${BATCH_SIZE} | Days: ${DAYS}`);
  if (DRY_RUN)  console.log("   ⚠️  DRY-RUN — aucune modification en base");
  if (ONCE_MODE) console.log("   Mode: --once (un seul lot)");
  console.log("═══════════════════════════════════════════════════════════\n");

  let totalOk = 0, totalDead = 0, totalRedirected = 0, totalErrors = 0, totalProcessed = 0;

  for (;;) {
    // ── Fetch ────────────────────────────────────────────────────────────────
    let parts: VerifyPart[];
    try {
      parts = await fetchPartsToVerify();
    } catch (err) {
      log(`❌  Fetch failed: ${err}`);
      if (ONCE_MODE) break;
      await new Promise((r) => setTimeout(r, 30_000));
      continue;
    }

    if (parts.length === 0) {
      log(`✅  Toutes les productUrls ont été vérifiées (< ${DAYS} jours). ${totalProcessed} vérifiées au total.`);
      if (ONCE_MODE) break;
      log(`💤  Pause ${SLEEP_WHEN_DONE_MS / 60_000} min avant le prochain cycle…`);
      await new Promise((r) => setTimeout(r, SLEEP_WHEN_DONE_MS));
      continue;
    }

    log(`🔍  ${parts.length} URLs à vérifier (concurrence: ${CONCURRENCY})…`);
    const batchStart = Date.now();

    // ── HEAD checks in parallel ───────────────────────────────────────────────
    const reportItems: ReportItem[] = [];
    let batchOk = 0, batchDead = 0, batchRedirected = 0, batchErrors = 0;

    await runConcurrent(parts, async (part) => {
      const result = await headCheck(part.productUrl);
      const icon =
        result.outcome === "ok"       ? "✓" :
        result.outcome === "dead"     ? "✗" :
        result.outcome === "redirect" ? "→" : "?";

      log(`  ${icon} [${result.outcome}] ${part.manufacturer} ${part.reference} — ${result.note}`);

      reportItems.push({
        partId:  part.id,
        outcome: result.outcome,
        ...(result.newUrl ? { newUrl: result.newUrl } : {}),
        note: result.note,
      });

      if      (result.outcome === "ok")       batchOk++;
      else if (result.outcome === "dead")     batchDead++;
      else if (result.outcome === "redirect") batchRedirected++;
      else                                    batchErrors++;
    }, CONCURRENCY);

    totalOk        += batchOk;
    totalDead      += batchDead;
    totalRedirected += batchRedirected;
    totalErrors    += batchErrors;
    totalProcessed += parts.length;

    const elapsed = ((Date.now() - batchStart) / 1000).toFixed(1);
    log(`\n  Lot terminé en ${elapsed}s : ✓${batchOk} ok | ✗${batchDead} morts | →${batchRedirected} redirects | ?${batchErrors} erreurs`);

    // ── Send report ───────────────────────────────────────────────────────────
    if (!DRY_RUN && reportItems.length > 0) {
      // N'envoyer que les résultats actionnables (pas les erreurs réseau)
      const actionable = reportItems.filter((r) => r.outcome !== "error");
      if (actionable.length > 0) {
        try {
          const { cleared, verified } = await sendReport(actionable);
          log(`  📨  Rapport envoyé : ${cleared} URLs effacées, ${verified} vérifiées`);
        } catch (err) {
          log(`  ⚠️  Envoi du rapport échoué : ${err}`);
        }
      }
    } else if (DRY_RUN) {
      const dead = reportItems.filter((r) => r.outcome === "dead");
      if (dead.length > 0) {
        log(`  [dry-run] URLs mortes (non modifiées) :`);
        for (const r of dead) log(`    ✗  partId=${r.partId} — ${r.note}`);
      }
    }

    log(`\n  📊  Total session : ${totalProcessed} vérifiées | ✓${totalOk} ok | ✗${totalDead} mortes | →${totalRedirected} redirects | ?${totalErrors} erreurs\n`);

    if (ONCE_MODE) {
      log("--once : arrêt après un lot.");
      break;
    }

    await new Promise((r) => setTimeout(r, PAUSE_MS));
  }
}

process.on("SIGINT", () => {
  console.log("\n🛑  Ctrl+C — arrêt propre.");
  process.exit(0);
});

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
