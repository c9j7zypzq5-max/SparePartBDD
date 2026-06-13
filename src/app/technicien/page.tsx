"use client";

import { useState } from "react";
import Link from "next/link";

type BulkResult = {
  inputRef: string;
  found: boolean;
  referenceRaw?: string;
  name?: string;
  manufacturerName?: string;
  manufacturerSlug?: string;
  slug?: string;
  status?: string;
  minPrice?: number;
  currency?: string;
};

function StatusChip({ status }: { status: string }) {
  if (status === "active")
    return (
      <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
        Fabriquée
      </span>
    );
  if (status === "obsolete")
    return (
      <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
        Obsolète
      </span>
    );
  return (
    <span className="rounded-full bg-zinc-200 px-2 py-0.5 text-xs font-medium text-zinc-500">
      Inconnu
    </span>
  );
}

function formatPrice(price?: number, currency = "EUR") {
  if (price === undefined) return "—";
  return `${price.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;
}

export default function TechnicienPage() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<BulkResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const refs = input
      .split(/[\n,;]+/)
      .map((r) => r.trim())
      .filter(Boolean);
    if (refs.length === 0) return;
    setLoading(true);
    setError(null);
    setResults(null);
    try {
      const res = await fetch("/api/parts/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(refs),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Erreur ${res.status}`);
      }
      const data: BulkResult[] = await res.json();
      setResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }

  function handleClear() {
    setInput("");
    setResults(null);
    setError(null);
  }

  function exportCSV() {
    if (!results) return;
    const header = "reference_saisie,reference_officielle,fabricant,designation,statut,prix_min,devise,fiche";
    const rows = results.map((r) =>
      [
        `"${r.inputRef}"`,
        r.found ? `"${r.referenceRaw}"` : "",
        r.found ? `"${r.manufacturerName}"` : "",
        r.found ? `"${r.name?.replace(/"/g, '""')}"` : "",
        r.found ? r.status : "introuvable",
        r.found && r.minPrice !== undefined ? r.minPrice : "",
        r.found ? (r.currency ?? "EUR") : "",
        r.found && r.manufacturerSlug && r.slug
          ? `${window.location.origin}/piece/${r.manufacturerSlug}/${r.slug}`
          : "",
      ].join(","),
    );
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `recherche-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const foundCount = results?.filter((r) => r.found).length ?? 0;
  const notFoundCount = results?.filter((r) => !r.found).length ?? 0;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Mode technicien</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Saisissez plusieurs références en une seule fois — une par ligne, ou séparées par
          des virgules ou points-virgules.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={"6SE6440-2UD21-5AA1\nPWR-C1-715WAC\n1756-L61"}
          rows={8}
          className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 font-mono text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
        />
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Recherche…
              </span>
            ) : (
              "Rechercher"
            )}
          </button>
          {(results || input) && (
            <button
              type="button"
              onClick={handleClear}
              className="rounded-lg border border-zinc-200 px-4 py-2.5 text-sm font-medium text-zinc-600 transition hover:border-zinc-400"
            >
              Effacer
            </button>
          )}
          {results && (
            <button
              type="button"
              onClick={exportCSV}
              className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-700 transition hover:border-zinc-500"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-4 w-4">
                <path d="M8 1a.75.75 0 0 1 .75.75v6.19l1.97-1.97a.75.75 0 0 1 1.06 1.06l-3.25 3.25a.75.75 0 0 1-1.06 0L4.22 7.03a.75.75 0 0 1 1.06-1.06L7.25 7.94V1.75A.75.75 0 0 1 8 1zM2.5 13.75A.75.75 0 0 1 3.25 13h9.5a.75.75 0 0 1 0 1.5h-9.5a.75.75 0 0 1-.75-.75z" />
              </svg>
              Exporter CSV
            </button>
          )}
        </div>
      </form>

      {error && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {results && (
        <div className="mt-6">
          <div className="mb-3 flex flex-wrap items-center gap-4 text-sm">
            <span className="font-semibold text-green-700">
              {foundCount} trouvée{foundCount > 1 ? "s" : ""}
            </span>
            {notFoundCount > 0 && (
              <span className="font-semibold text-zinc-500">
                {notFoundCount} introuvable{notFoundCount > 1 ? "s" : ""}
              </span>
            )}
          </div>

          <div className="overflow-x-auto rounded-xl border border-zinc-200">
            <table className="min-w-full divide-y divide-zinc-100 text-sm">
              <thead className="bg-zinc-50 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                <tr>
                  <th className="px-4 py-3 text-left">Référence saisie</th>
                  <th className="px-4 py-3 text-left">Référence officielle</th>
                  <th className="px-4 py-3 text-left">Fabricant</th>
                  <th className="px-4 py-3 text-left">Désignation</th>
                  <th className="px-4 py-3 text-left">Statut</th>
                  <th className="px-4 py-3 text-right">Prix min</th>
                  <th className="px-4 py-3 text-left">Fiche</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 bg-white">
                {results.map((r) => (
                  <tr
                    key={r.inputRef}
                    className={r.found ? "hover:bg-zinc-50" : "bg-zinc-50 opacity-60"}
                  >
                    <td className="px-4 py-3 font-mono text-zinc-600">{r.inputRef}</td>
                    <td className="px-4 py-3 font-mono text-zinc-900">
                      {r.found ? r.referenceRaw : <span className="text-zinc-400">—</span>}
                    </td>
                    <td className="px-4 py-3 text-zinc-700">{r.found ? r.manufacturerName : "—"}</td>
                    <td className="max-w-xs truncate px-4 py-3 text-zinc-700">
                      {r.found ? r.name : <span className="text-xs text-zinc-400">Introuvable</span>}
                    </td>
                    <td className="px-4 py-3">
                      {r.found && r.status ? (
                        <StatusChip status={r.status} />
                      ) : (
                        <span className="text-xs text-zinc-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-zinc-700">
                      {r.found ? formatPrice(r.minPrice, r.currency) : "—"}
                    </td>
                    <td className="px-4 py-3">
                      {r.found && r.manufacturerSlug && r.slug ? (
                        <Link
                          href={`/piece/${r.manufacturerSlug}/${r.slug}`}
                          className="text-xs text-blue-600 hover:underline"
                        >
                          Voir →
                        </Link>
                      ) : (
                        <span className="text-xs text-zinc-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
