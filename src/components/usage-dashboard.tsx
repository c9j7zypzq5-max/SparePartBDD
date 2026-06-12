"use client";

import { useState } from "react";

interface UsageData {
  keyPrefix:      string;
  plan:           string;
  active:         boolean;
  quota:          number;
  used:           number;
  remaining:      number;
  overage:        number;
  overageEnabled: boolean;
  overageCostEur: number;
  periodStart:    string;
  periodEnd:      string;
  lastUsedAt:     string | null;
}

const PLAN_LABELS: Record<string, string> = {
  free:     "Free",
  pro:      "Pro",
  business: "Business",
};

export function UsageDashboard() {
  const [apiKey,  setApiKey]  = useState("");
  const [data,    setData]    = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  async function lookup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setData(null);
    try {
      const res = await fetch("/api/developers/usage", {
        headers: { Authorization: `Bearer ${apiKey.trim()}` },
      });
      const body = await res.json();
      if (!res.ok) { setError(body.error ?? "Erreur inconnue"); return; }
      setData(body);
    } catch {
      setError("Erreur réseau. Réessayez.");
    } finally {
      setLoading(false);
    }
  }

  const pct = data ? Math.min(100, Math.round((data.used / data.quota) * 100)) : 0;

  return (
    <div>
      <form onSubmit={lookup} className="flex gap-2">
        <input
          type="password"
          required
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="spb_…"
          autoComplete="off"
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 font-mono text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <button
          type="submit"
          disabled={loading}
          className="shrink-0 rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
        >
          {loading ? "…" : "Consulter"}
        </button>
      </form>

      {error && (
        <p className="mt-4 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {data && (
        <div className="mt-6 rounded-xl border border-zinc-200 p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="font-mono text-sm text-zinc-500">{data.keyPrefix}…</span>
              <span className={`ml-2 rounded-full px-2 py-0.5 text-xs font-semibold ${
                data.active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
              }`}>
                {data.active ? "Active" : "Suspendue"}
              </span>
            </div>
            <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-700">
              Plan {PLAN_LABELS[data.plan] ?? data.plan}
            </span>
          </div>

          {/* Barre de progression du quota */}
          <div className="mt-6">
            <div className="flex items-baseline justify-between text-sm">
              <span className="font-medium text-zinc-700">
                {data.used.toLocaleString("fr-FR")} / {data.quota.toLocaleString("fr-FR")} requêtes
              </span>
              <span className="text-zinc-500">{pct} %</span>
            </div>
            <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-zinc-100">
              <div
                className={`h-full rounded-full transition-all ${
                  pct >= 100 ? "bg-red-500" : pct >= 80 ? "bg-amber-400" : "bg-green-500"
                }`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>

          <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-zinc-500">Restantes</dt>
              <dd className="font-semibold text-zinc-900">{data.remaining.toLocaleString("fr-FR")}</dd>
            </div>
            <div>
              <dt className="text-zinc-500">Période en cours jusqu'au</dt>
              <dd className="font-semibold text-zinc-900">
                {new Date(data.periodEnd).toLocaleDateString("fr-FR")}
              </dd>
            </div>
            <div>
              <dt className="text-zinc-500">Dernier appel</dt>
              <dd className="font-semibold text-zinc-900">
                {data.lastUsedAt ? new Date(data.lastUsedAt).toLocaleString("fr-FR") : "—"}
              </dd>
            </div>
          </dl>

          {data.overage > 0 && (
            <div className={`mt-5 rounded-lg border px-4 py-3 text-sm ${
              data.overageEnabled
                ? "border-amber-300 bg-amber-50 text-amber-800"
                : "border-red-300 bg-red-50 text-red-700"
            }`}>
              {data.overageEnabled ? (
                <>
                  <strong>{data.overage.toLocaleString("fr-FR")} requêtes</strong> au-delà du
                  quota ce mois-ci — facturées à l'usage ≈{" "}
                  <strong>{data.overageCostEur.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}</strong>.
                </>
              ) : (
                <>
                  Quota atteint — les requêtes supplémentaires sont refusées (429).
                  Activez la facturation à l'usage ou passez au plan supérieur.
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
