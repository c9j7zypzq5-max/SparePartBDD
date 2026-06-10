/**
 * Contrôle hebdomadaire du cycle de vie des pièces (à lancer sur le Mac mini).
 *
 * Récupère les pièces dues pour un contrôle (GET /api/lifecycle/pending),
 * visite la page produit officielle de chacune, classifie le signal puis
 * renvoie le rapport (POST /api/lifecycle/report). La décision finale
 * (changement de statut) est appliquée côté serveur — voir
 * src/lib/lifecycle-pipeline.ts.
 *
 * Usage :
 *   npm run lifecycle          (ou : tsx scripts/lifecycle/check.ts)
 *
 * Variables d'env :
 *   INGEST_URL       — URL de base de l'app (ex : https://ton-domaine.vercel.app)
 *   INGEST_API_KEY   — clé API (identique à celle du serveur)
 *   OLLAMA_MODEL     — optionnel : modèle local pour trancher les cas ambigus
 *   OLLAMA_URL       — optionnel, défaut http://localhost:11434
 *   LIFECYCLE_LIMIT  — optionnel, nb max de pièces par run (défaut 200)
 *
 * Exemple de crontab (tous les lundis à 7 h) :
 *   0 7 * * 1 cd $HOME/SparePartBDD && INGEST_URL=https://… INGEST_API_KEY=… npm run lifecycle >> $HOME/lifecycle.log 2>&1
 */
import type {
  LifecycleOutcome,
  LifecyclePendingPart,
  LifecycleReportItem,
} from "../../src/lib/lifecycle-types";

const apiKey = process.env.INGEST_API_KEY;
const baseUrl = process.env.INGEST_URL;
if (!apiKey || !baseUrl) {
  console.error("Variables INGEST_URL et INGEST_API_KEY requises");
  process.exit(1);
}

const ollamaModel = process.env.OLLAMA_MODEL;
const ollamaUrl = process.env.OLLAMA_URL ?? "http://localhost:11434";
const limit = Number(process.env.LIFECYCLE_LIMIT ?? 200);

const CONCURRENCY = 4;
const DELAY_MS = 600; // politesse entre deux requêtes d'un même worker
const FETCH_TIMEOUT_MS = 15_000;
const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36";

/** Mentions explicites d'arrêt de commercialisation (FR/EN/DE). */
const OBSOLETE_KEYWORDS = [
  "discontinued",
  "end of life",
  "end-of-life",
  "no longer available",
  "no longer manufactured",
  "phase-out",
  "phased out",
  "product is obsolete",
  "produit arrêté",
  "n'est plus fabriqué",
  "n'est plus commercialisé",
  "fin de commercialisation",
  "abgekündigt",
  "nicht mehr lieferbar",
  "nachfolgeprodukt",
];

/** Signaux qu'une pièce est toujours en vente. */
const ACTIVE_KEYWORDS = [
  "add to cart",
  "add to basket",
  "ajouter au panier",
  "in den warenkorb",
  "in stock",
  "en stock",
  "auf lager",
  "buy now",
  "request a quote",
  "demander un devis",
];
const PRICE_REGEX = /\d+[.,]\d{2}\s*(€|eur|usd|\$|chf|gbp|£)/;

interface Classification {
  outcome: LifecycleOutcome;
  evidence: string;
}

/** Texte brut d'une page HTML : sans script/style/balises, en minuscules. */
function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/** Demande à Ollama de trancher un cas sans signal (réponse en un mot). */
async function askOllama(part: LifecyclePendingPart, pageText: string): Promise<Classification> {
  const prompt =
    `Voici le texte de la page produit officielle de la pièce ` +
    `"${part.reference}" du fabricant ${part.manufacturer}.\n` +
    `Réponds par UN SEUL mot :\n` +
    `- "active" si la pièce est toujours fabriquée/commercialisée\n` +
    `- "obsolete" si elle est arrêtée/remplacée\n` +
    `- "ambigu" si le texte ne permet pas de conclure\n\n` +
    pageText.slice(0, 4000);
  try {
    const res = await fetch(`${ollamaUrl}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: ollamaModel, prompt, stream: false }),
      signal: AbortSignal.timeout(120_000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const body = (await res.json()) as { response?: string };
    const answer = (body.response ?? "").trim().toLowerCase();
    if (answer.startsWith("active"))
      return { outcome: "active", evidence: `Ollama (${ollamaModel}) : active` };
    if (answer.startsWith("obsolete"))
      return { outcome: "obsolete", evidence: `Ollama (${ollamaModel}) : obsolete` };
    return { outcome: "ambiguous", evidence: "aucun signal, Ollama indécis" };
  } catch (err) {
    return { outcome: "ambiguous", evidence: `aucun signal, Ollama indisponible (${String(err)})` };
  }
}

/** Visite la page produit d'une pièce et classifie le signal. */
async function checkPart(part: LifecyclePendingPart): Promise<Classification> {
  let res: Response;
  try {
    res = await fetch(part.productUrl, {
      headers: {
        "User-Agent": USER_AGENT,
        "Accept-Language": "fr,en;q=0.8,de;q=0.6",
        Accept: "text/html,application/xhtml+xml",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
  } catch (err) {
    return { outcome: "error", evidence: `réseau/timeout (${String(err)})` };
  }

  // Page produit disparue : signal d'arrêt le plus sûr
  if (res.status === 404 || res.status === 410) {
    return { outcome: "obsolete", evidence: `HTTP ${res.status}` };
  }
  // Anti-bot ou erreur serveur : transitoire, on réessaiera
  if (res.status === 403 || res.status === 429) {
    return { outcome: "error", evidence: `HTTP ${res.status} (anti-bot probable)` };
  }
  if (!res.ok) {
    return { outcome: "error", evidence: `HTTP ${res.status}` };
  }

  // Redirection vers l'accueil du site : la page produit n'existe sans doute
  // plus, mais ce n'est pas une preuve → à vérifier
  try {
    const finalUrl = new URL(res.url);
    const originalUrl = new URL(part.productUrl);
    if (finalUrl.pathname === "/" && originalUrl.pathname !== "/") {
      return { outcome: "ambiguous", evidence: "redirection vers l'accueil" };
    }
  } catch {}

  const text = stripHtml(await res.text());

  for (const kw of OBSOLETE_KEYWORDS) {
    if (text.includes(kw)) {
      return { outcome: "obsolete", evidence: `mot-clé "${kw}"` };
    }
  }
  for (const kw of ACTIVE_KEYWORDS) {
    if (text.includes(kw)) {
      return { outcome: "active", evidence: `mot-clé "${kw}"` };
    }
  }
  if (PRICE_REGEX.test(text)) {
    return { outcome: "active", evidence: "prix affiché sur la page" };
  }

  if (ollamaModel) return askOllama(part, text);
  return { outcome: "ambiguous", evidence: "aucun signal détecté" };
}

// ── Run ────────────────────────────────────────────────────────────────────

async function main() {
  const pendingRes = await fetch(
    `${baseUrl}/api/lifecycle/pending?limit=${limit}`,
    { headers: { Authorization: `Bearer ${apiKey}` } },
  );
  if (!pendingRes.ok) {
    console.error(`Erreur ${pendingRes.status} sur /api/lifecycle/pending :`, await pendingRes.text());
    process.exit(1);
  }
  const { parts } = (await pendingRes.json()) as { parts: LifecyclePendingPart[] };

  if (parts.length === 0) {
    console.log("Aucune pièce à contrôler cette semaine.");
    return;
  }
  console.log(`${parts.length} pièce(s) à contrôler…`);

  const results: LifecycleReportItem[] = [];
  const queue = [...parts];
  const counts: Record<LifecycleOutcome, number> = {
    active: 0,
    obsolete: 0,
    ambiguous: 0,
    error: 0,
  };

  await Promise.all(
    Array.from({ length: CONCURRENCY }, async () => {
      for (;;) {
        const part = queue.shift();
        if (!part) return;
        const { outcome, evidence } = await checkPart(part);
        counts[outcome]++;
        console.log(`  [${outcome}] ${part.manufacturer} ${part.reference} — ${evidence}`);
        results.push({
          partId: part.id,
          outcome,
          evidence,
          checkedAt: new Date().toISOString(),
        });
        await new Promise((r) => setTimeout(r, DELAY_MS));
      }
    }),
  );

  // Envoi du rapport par lots de 50
  const source = `lifecycle-mac-mini-${new Date().toISOString().slice(0, 10)}`;
  for (let i = 0; i < results.length; i += 50) {
    const chunk = results.slice(i, i + 50);
    const res = await fetch(`${baseUrl}/api/lifecycle/report`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ source, results: chunk }),
    });
    const body = await res.json();
    if (res.ok || res.status === 207) {
      if (body.errors?.length) {
        console.warn(`⚠ ${body.errors.length} erreur(s) serveur :`, body.errors);
      }
    } else {
      console.error(`Erreur ${res.status} sur /api/lifecycle/report :`, body);
      process.exit(1);
    }
  }

  console.log(
    `✔ Rapport envoyé : ${counts.active} actives, ${counts.obsolete} obsolètes, ` +
      `${counts.ambiguous} à vérifier, ${counts.error} erreurs transitoires.`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
