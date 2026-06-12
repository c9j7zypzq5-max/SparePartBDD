import type { Metadata } from "next";
import Link from "next/link";
import { ApiKeyForm } from "@/components/api-key-form";
import { PLANS } from "@/lib/plans";
import { siteUrl } from "@/lib/site-url";

export const metadata: Metadata = {
  title: "API Développeurs — SparePartSearch",
  description: "Accédez aux données de pièces détachées industrielles et IT via une API REST JSON. Plans gratuit et payants.",
  alternates: { canonical: "/developers" },
};

const CODE_EXAMPLES = {
  part: `curl -X GET \\
  "${siteUrl}/api/v1/part/6ES7214-1AG40-0XB0" \\
  -H "Authorization: Bearer spb_votre_clé"`,

  search: `curl -X GET \\
  "${siteUrl}/api/v1/search?q=siemens+s7-1200&limit=5" \\
  -H "Authorization: Bearer spb_votre_clé"`,

  manufacturer: `curl -X GET \\
  "${siteUrl}/api/v1/manufacturer/siemens?limit=20&status=active" \\
  -H "Authorization: Bearer spb_votre_clé"`,

  partResponse: JSON.stringify({
    reference:   "6ES7214-1AG40-0XB0",
    name:        "SIMATIC S7-1200 CPU 1214C DC/DC/DC",
    status:      "active",
    manufacturer: { name: "Siemens", slug: "siemens", industry: "industrie" },
    category:    "Automates / PLC",
    attributes:  { "Tension": "24V DC", "Entrées num.": "14", "Sorties num.": "10" },
    productUrl:  "https://mall.industry.siemens.com/...",
    supersededBy: null,
    offers: [
      { seller: "RS Components", sellerType: "distributeur_officiel", price: 385, currency: "EUR", url: "https://fr.rs-online.com/..." },
      { seller: "Radwell",       sellerType: "reconditionne",         price: 220, currency: "EUR", url: "https://www.radwell.com/..." },
    ],
  }, null, 2),

  python: `import requests

API_KEY = "spb_votre_clé"
r = requests.get(
    "${siteUrl}/api/v1/part/6ES7214-1AG40-0XB0",
    headers={"Authorization": f"Bearer {API_KEY}"},
)
r.raise_for_status()
part = r.json()
print(part["status"], part["offers"])`,

  javascript: `const API_KEY = "spb_votre_clé";

const res = await fetch(
  "${siteUrl}/api/v1/part/6ES7214-1AG40-0XB0",
  { headers: { Authorization: \`Bearer \${API_KEY}\` } },
);
if (!res.ok) throw new Error(\`HTTP \${res.status}\`);
const part = await res.json();
console.log(part.status, part.offers);`,
};

export default function DevelopersPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      {/* Hero */}
      <div className="mb-14 text-center">
        <h1 className="text-4xl font-bold tracking-tight">API SparePartSearch</h1>
        <p className="mt-4 text-lg text-zinc-600">
          Intégrez les données de pièces détachées industrielles et IT directement dans vos applications.
        </p>
        <Link
          href="/developers/usage"
          className="mt-4 inline-block text-sm font-medium text-blue-600 hover:underline"
        >
          Déjà client ? Consulter votre consommation →
        </Link>
      </div>

      {/* Pricing */}
      <section className="mb-16">
        <h2 className="mb-6 text-2xl font-semibold">Plans</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`rounded-xl border p-6 ${
                plan.id === "pro"
                  ? "border-blue-500 bg-blue-50 shadow-sm"
                  : "border-zinc-200"
              }`}
            >
              {plan.id === "pro" && (
                <span className="mb-2 inline-block rounded-full bg-blue-600 px-2 py-0.5 text-xs font-semibold text-white">
                  Populaire
                </span>
              )}
              <h3 className="text-lg font-semibold">{plan.name}</h3>
              <p className="mt-1 text-2xl font-bold">
                {plan.price === 0 ? "Gratuit" : `${plan.price} €`}
                {plan.price > 0 && (
                  <span className="text-base font-normal text-zinc-500">/mois</span>
                )}
              </p>
              <p className="mt-1 text-sm text-zinc-500">
                {plan.quota.toLocaleString("fr-FR")} req/mois
              </p>
              <ul className="mt-4 space-y-2">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-zinc-700">
                    <span className="mt-0.5 text-green-500">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Get a key */}
      <section className="mb-16 rounded-xl border border-zinc-200 bg-zinc-50 p-8">
        <h2 className="mb-2 text-2xl font-semibold">Obtenir une clé API</h2>
        <p className="mb-6 text-zinc-600">
          Le plan gratuit est immédiat. Les plans payants redirigent vers Stripe.
        </p>
        <div className="max-w-md">
          <ApiKeyForm />
        </div>
      </section>

      {/* Endpoints */}
      <section className="mb-16">
        <h2 className="mb-6 text-2xl font-semibold">Endpoints</h2>

        <div className="space-y-10">
          {/* GET /api/v1/part */}
          <div>
            <div className="flex items-center gap-3">
              <span className="rounded bg-green-100 px-2 py-0.5 font-mono text-xs font-bold text-green-800">GET</span>
              <code className="font-mono text-sm text-zinc-800">/api/v1/part/{"{reference}"}</code>
            </div>
            <p className="mt-2 text-zinc-600">Fiche complète d'une pièce : statut, attributs, offres vendeurs, référence de remplacement.</p>
            <div className="mt-3 overflow-x-auto rounded-lg border border-zinc-200 bg-zinc-900 p-4">
              <pre className="text-sm text-zinc-100">{CODE_EXAMPLES.part}</pre>
            </div>
            <details className="mt-2">
              <summary className="cursor-pointer text-sm text-blue-600 hover:underline">Voir la réponse exemple</summary>
              <div className="mt-2 overflow-x-auto rounded-lg border border-zinc-200 bg-zinc-900 p-4">
                <pre className="text-xs text-zinc-100">{CODE_EXAMPLES.partResponse}</pre>
              </div>
            </details>
          </div>

          {/* GET /api/v1/search */}
          <div>
            <div className="flex items-center gap-3">
              <span className="rounded bg-green-100 px-2 py-0.5 font-mono text-xs font-bold text-green-800">GET</span>
              <code className="font-mono text-sm text-zinc-800">/api/v1/search?q=…</code>
            </div>
            <p className="mt-2 text-zinc-600">Recherche par référence ou nom de pièce.</p>
            <table className="mt-3 w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 text-left text-zinc-500">
                  <th className="py-1 pr-4 font-medium">Paramètre</th>
                  <th className="py-1 pr-4 font-medium">Type</th>
                  <th className="py-1 font-medium">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {[
                  ["q",            "string",  "Requis. Référence ou texte libre."],
                  ["limit",        "int",     "Résultats par page (max 100, défaut 20)."],
                  ["offset",       "int",     "Décalage pour la pagination."],
                  ["industry",     "string",  "industrie | informatique | electronique…"],
                  ["status",       "string",  "active | obsolete | unknown"],
                  ["manufacturer", "string",  "Slug du fabricant (ex: siemens)."],
                  ["sort",         "string",  "relevance | price_asc | price_desc | name_asc"],
                ].map(([p, t, d]) => (
                  <tr key={p}>
                    <td className="py-1.5 pr-4 font-mono text-xs text-zinc-800">{p}</td>
                    <td className="py-1.5 pr-4 text-zinc-500">{t}</td>
                    <td className="py-1.5 text-zinc-600">{d}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-3 overflow-x-auto rounded-lg border border-zinc-200 bg-zinc-900 p-4">
              <pre className="text-sm text-zinc-100">{CODE_EXAMPLES.search}</pre>
            </div>
          </div>

          {/* GET /api/v1/manufacturer */}
          <div>
            <div className="flex items-center gap-3">
              <span className="rounded bg-green-100 px-2 py-0.5 font-mono text-xs font-bold text-green-800">GET</span>
              <code className="font-mono text-sm text-zinc-800">/api/v1/manufacturer/{"{slug}"}</code>
            </div>
            <p className="mt-2 text-zinc-600">Catalogue complet d'un fabricant, paginé.</p>
            <div className="mt-3 overflow-x-auto rounded-lg border border-zinc-200 bg-zinc-900 p-4">
              <pre className="text-sm text-zinc-100">{CODE_EXAMPLES.manufacturer}</pre>
            </div>
          </div>
        </div>
      </section>

      {/* SDK & OpenAPI */}
      <section className="mb-16">
        <h2 className="mb-2 text-2xl font-semibold">SDK & spécification OpenAPI</h2>
        <p className="mb-6 text-zinc-600">
          L'API est décrite par une spécification{" "}
          <a href="/api/v1/openapi.json" className="font-medium text-blue-600 hover:underline" target="_blank" rel="noopener">
            OpenAPI 3.1
          </a>{" "}
          — importable dans Postman, Swagger UI ou un générateur de SDK
          (<code className="rounded bg-zinc-100 px-1 font-mono text-sm">openapi-generator</code>) pour produire un client dans votre langage.
        </p>
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <h3 className="mb-2 text-sm font-semibold text-zinc-700">Python</h3>
            <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-zinc-900 p-4">
              <pre className="text-xs text-zinc-100">{CODE_EXAMPLES.python}</pre>
            </div>
          </div>
          <div>
            <h3 className="mb-2 text-sm font-semibold text-zinc-700">JavaScript / TypeScript</h3>
            <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-zinc-900 p-4">
              <pre className="text-xs text-zinc-100">{CODE_EXAMPLES.javascript}</pre>
            </div>
          </div>
        </div>
      </section>

      {/* Webhooks (Business) */}
      <section className="mb-16">
        <h2 className="mb-2 text-2xl font-semibold">
          Webhooks{" "}
          <span className="ml-1 rounded-full bg-zinc-900 px-2 py-0.5 align-middle text-xs font-semibold text-white">
            Business
          </span>
        </h2>
        <p className="mb-4 text-zinc-600">
          Soyez notifié en temps réel quand une pièce change de statut
          (passage en <strong>obsolète</strong> ou retour en production) — sans
          interroger l&apos;API en boucle. Surveillez des références précises ou
          tout le catalogue.
        </p>
        <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-zinc-900 p-4">
          <pre className="text-sm text-zinc-100">{`# Créer un webhook (le secret n'est affiché qu'une fois)
curl -X POST "${siteUrl}/api/v1/webhooks" \\
  -H "Authorization: Bearer spb_votre_clé" \\
  -H "Content-Type: application/json" \\
  -d '{"url": "https://votre-app.com/hooks/spb",
       "references": ["6ES7214-1AG40-0XB0", "LC1D09BD"]}'

# Lister / supprimer
curl "${siteUrl}/api/v1/webhooks" -H "Authorization: Bearer spb_votre_clé"
curl -X DELETE "${siteUrl}/api/v1/webhooks/1" -H "Authorization: Bearer spb_votre_clé"`}</pre>
        </div>
        <p className="mt-4 text-zinc-600">Payload envoyé (POST JSON) :</p>
        <div className="mt-2 overflow-x-auto rounded-lg border border-zinc-200 bg-zinc-900 p-4">
          <pre className="text-xs text-zinc-100">{JSON.stringify({
            event: "part.status_changed",
            reference: "6ES7214-1AG40-0XB0",
            manufacturer: "Siemens",
            oldStatus: "active",
            newStatus: "obsolete",
            url: `${siteUrl}/piece/siemens/6es72141ag400xb0`,
            occurredAt: "2026-06-12T14:00:00.000Z",
          }, null, 2)}</pre>
        </div>
        <p className="mt-4 text-sm text-zinc-600">
          Chaque requête porte l&apos;en-tête{" "}
          <code className="rounded bg-zinc-100 px-1 font-mono">X-SPB-Signature: sha256=&lt;hex&gt;</code>{" "}
          — HMAC-SHA256 du corps calculé avec votre secret. Vérifiez-la avant de
          traiter l&apos;événement. Livraison toutes les heures, 3 tentatives par
          événement, réponse 2xx attendue.
        </p>
      </section>

      {/* Usage-based billing */}
      <section className="mb-16">
        <h2 className="mb-4 text-2xl font-semibold">Facturation à l'usage</h2>
        <p className="text-zinc-600">
          Les plans payants peuvent activer la <strong>facturation à l'usage</strong> :
          au-delà du quota mensuel inclus, les requêtes continuent de passer et le
          dépassement est facturé <strong>1 € / 1 000 requêtes</strong> sur la facture
          Stripe du mois. Sans cette option, l'API répond <code className="rounded bg-zinc-100 px-1 font-mono text-sm">429</code> une
          fois le quota atteint.
        </p>
        <p className="mt-3 text-zinc-600">
          Chaque réponse de l'API inclut vos compteurs en temps réel :
        </p>
        <div className="mt-3 overflow-x-auto rounded-lg border border-zinc-200 bg-zinc-900 p-4">
          <pre className="text-sm text-zinc-100">{`X-Quota-Limit:   50000   # quota mensuel inclus dans votre plan
X-Quota-Used:    52340   # requêtes consommées sur la période
X-Quota-Overage: 2340    # requêtes facturées à l'usage`}</pre>
        </div>
      </section>

      {/* Auth + errors */}
      <section className="mb-16">
        <h2 className="mb-4 text-2xl font-semibold">Authentification et erreurs</h2>
        <p className="text-zinc-600">
          Toutes les requêtes doivent inclure l'en-tête{" "}
          <code className="rounded bg-zinc-100 px-1 font-mono text-sm">Authorization: Bearer spb_…</code>.
        </p>
        <table className="mt-4 w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-200 text-left text-zinc-500">
              <th className="py-1 pr-6 font-medium">Code HTTP</th>
              <th className="py-1 font-medium">Signification</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {[
              ["200", "Succès"],
              ["400", "Paramètre manquant ou invalide"],
              ["401", "Clé API manquante ou invalide"],
              ["404", "Référence ou fabricant introuvable"],
              ["429", "Quota mensuel dépassé (sans option à l'usage) — activez-la ou passez au plan supérieur"],
            ].map(([code, msg]) => (
              <tr key={code}>
                <td className="py-1.5 pr-6 font-mono text-zinc-800">{code}</td>
                <td className="py-1.5 text-zinc-600">{msg}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
