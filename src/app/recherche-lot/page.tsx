"use client";

import { useState } from "react";
import Link from "next/link";
import { StatusBadge } from "@/components/status-badge";
import { addSearchHistory } from "@/lib/search-history";
import { readWatchlist, toggleWatchlist } from "@/lib/watchlist";

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

function parseRefs(text: string): string[] {
  return [
    ...new Set(
      text
        .split(/[\n,;]+/)
        .map((r) => r.trim())
        .filter((r) => r.length > 0),
    ),
  ];
}

function formatPrice(price?: number, currency = "EUR") {
  if (price === undefined) return "—";
  return `${price.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;
}

export default function RechercheLotPage() {
  const [text, setText] = useState("");
  const [results, setResults] = useState<BulkResult[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [addedAll, setAddedAll] = useState(false);

  async function handleSearch() {
    const refs = parseRefs(text);
    if (refs.length === 0) return;
    setLoading(true);
    setResults(null);
    setAddedAll(false);
    try {
      const res = await fetch("/api/parts/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(refs.slice(0, 50)),
      });
      const data: BulkResult[] = await res.json();
      setResults(data);
    } catch {
      alert("Erreur lors de la recherche en lot.");
    } finally {
      setLoading(false);
    }
  }

  function addAllToWatchlist() {
    if (!results) return;
    results
      .filter((r) => r.found && r.referenceRaw && r.manufacturerSlug && r.slug)
      .forEach((r) => {
        toggleWatchlist({
          reference: r.referenceRaw!,
          manufacturer: r.manufacturerName!,
          manufacturerSlug: r.manufacturerSlug!,
          partSlug: r.slug!,
          name: r.name!,
          status: r.status!,
          minPrice: r.minPrice,
          currency: r.currency,
          dateAdded: new Date().toISOString(),
          snapshotDate: new Date().toISOString(),
        });
      });
    window.dispatchEvent(new Event("watchlist-change"));
    setAddedAll(true);
  }

  const found = results?.filter((r) => r.found) ?? [];
  const notFound = results?.filter((r) => !r.found) ?? [];

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-3xl font-bold tracking-tight">Recherche par lot</h1>
      <p className="mt-2 text-zinc-500">
        Collez vos références ci-dessous (une par ligne, ou séparées par virgule/point-virgule).
        Maximum 50 références par recherche.
      </p>

      <div className="mt-6">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={8}
          placeholder={"6ES7214-1AG40\nPWR-C1-715WAC\n1756-L71"}
          className="w-full rounded-xl border border-zinc-300 p-4 font-mono text-sm text-zinc-900 placeholder-zinc-400 shadow-sm transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none"
        />
        <div className="mt-3 flex items-center gap-3">
          <button
            type="button"
            onClick={handleSearch}
            disabled={loading || !text.trim()}
            className="rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Recherche…" : "Rechercher"}
          </button>
          <span className="text-sm text-zinc-400">
            {parseRefs(text).length > 0 && `${Math.min(parseRefs(text).length, 50)} référence${parseRefs(text).length > 1 ? "s" : ""} détectée${parseRefs(text).length > 1 ? "s" : ""}`}
          </span>
        </div>
      </div>

      {results && (
        <div className="mt-8">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-3 text-sm">
              <span className="font-medium text-green-700">{found.length} trouvée{found.length > 1 ? "s" : ""}</span>
              {notFound.length > 0 && (
                <>
                  <span className="text-zinc-300">·</span>
                  <span className="font-medium text-red-600">{notFound.length} introuvable{notFound.length > 1 ? "s" : ""}</span>
                </>
              )}
            </div>
            {found.length > 0 && (
              <button
                type="button"
                onClick={addAllToWatchlist}
                disabled={addedAll}
                className="rounded-lg border border-blue-300 px-4 py-2 text-sm font-medium text-blue-700 transition hover:border-blue-500 hover:bg-blue-50 disabled:opacity-60"
              >
                {addedAll ? "✓ Ajoutées à ma liste" : "Tout ajouter à ma liste"}
              </button>
            )}
          </div>

          <div className="overflow-x-auto rounded-xl border border-zinc-200">
            <table className="min-w-full divide-y divide-zinc-100 text-sm">
              <thead className="bg-zinc-50 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                <tr>
                  <th className="px-4 py-3 text-left">Référence saisie</th>
                  <th className="px-4 py-3 text-left">Nom</th>
                  <th className="px-4 py-3 text-left">Fabricant</th>
                  <th className="px-4 py-3 text-left">Statut</th>
                  <th className="px-4 py-3 text-right">Prix min</th>
                  <th className="px-4 py-3 text-left">Fiche</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 bg-white">
                {results.map((r) =>
                  r.found ? (
                    <tr key={r.inputRef} className="hover:bg-zinc-50">
                      <td className="px-4 py-3 font-mono text-zinc-700">{r.inputRef}</td>
                      <td className="px-4 py-3 text-zinc-900">{r.name}</td>
                      <td className="px-4 py-3 text-zinc-600">{r.manufacturerName}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={r.status ?? "unknown"} />
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-zinc-700">
                        {formatPrice(r.minPrice, r.currency)}
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/piece/${r.manufacturerSlug}/${r.slug}`}
                          className="text-blue-600 hover:underline"
                        >
                          Voir →
                        </Link>
                      </td>
                    </tr>
                  ) : (
                    <tr key={r.inputRef} className="bg-red-50">
                      <td className="px-4 py-3 font-mono text-red-700">{r.inputRef}</td>
                      <td colSpan={4} className="px-4 py-3 text-sm text-red-500">
                        Référence introuvable
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/recherche?q=${encodeURIComponent(r.inputRef)}`}
                          onClick={() => addSearchHistory(r.inputRef)}
                          className="text-xs text-zinc-500 hover:underline"
                        >
                          Rechercher
                        </Link>
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
