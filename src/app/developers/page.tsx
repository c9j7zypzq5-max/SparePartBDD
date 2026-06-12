import type { Metadata } from "next";
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
                {plan.price === 0 ? "Gratuit" : plan.price != null ? `${plan.price} €` : "Sur devis"}
                {plan.price != null && plan.price > 0 && (
                  <span className="text-base font-normal text-zinc-500">/mois</span>
                )}
              </p>
              <p className="mt-1 text-sm text-zinc-500">
                {plan.quota >= 10_000_000
                  ? "Illimité"
                  : `${plan.quota.toLocaleString("fr-FR")} req/mois`}
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
              ["429", "Quota mensuel dépassé — passez au plan supérieur"],
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
