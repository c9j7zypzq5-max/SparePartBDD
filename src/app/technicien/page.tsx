"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { StatusBadge } from "@/components/status-badge";
import { DownloadIcon } from "@/components/icons";
import { addSearchHistory } from "@/lib/search-history";
import { addToWatchlist } from "@/lib/watchlist";
import { formatPrice, plural } from "@/lib/format";
import { downloadTextFile, toCsv } from "@/lib/csv";

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

/** Même plafond que /api/parts/bulk. */
const MAX_REFS = 50;

/** Une référence par ligne, ou séparées par des virgules / points-virgules ; doublons retirés. */
function parseRefs(text: string): string[] {
  return [
    ...new Set(
      text
        .split(/[\n,;]+/)
        .map((r) => r.trim())
        .filter(Boolean),
    ),
  ];
}

/** Recherche par lot (« mode technicien ») : vérifier une liste de références d'un coup. */
export default function TechnicienPage() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<BulkResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [addedCount, setAddedCount] = useState<number | null>(null);
  const refs = useMemo(() => parseRefs(input), [input]);

  async function search() {
    if (refs.length === 0 || loading) return;
    setLoading(true);
    setError(null);
    setAddedCount(null);
    try {
      const res = await fetch("/api/parts/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(refs.slice(0, MAX_REFS)),
      });
      if (!res.ok) {
        throw new Error(
          res.status === 429
            ? "Trop de recherches en peu de temps : patientez une minute."
            : `La recherche a échoué (erreur ${res.status}).`,
        );
      }
      setResults(await res.json());
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : "La recherche a échoué, vérifiez votre connexion.");
    } finally {
      setLoading(false);
    }
  }

  function handleClear() {
    setInput("");
    setResults(null);
    setError(null);
    setAddedCount(null);
  }

  function addAllToWatchlist() {
    if (!results) return;
    const now = new Date().toISOString();
    // Ajout seulement : un toggle retirerait les pièces déjà suivies.
    const added = addToWatchlist(
      results
        .filter((r) => r.found && r.referenceRaw && r.manufacturerSlug && r.slug)
        .map((r) => ({
          reference: r.referenceRaw!,
          manufacturer: r.manufacturerName!,
          manufacturerSlug: r.manufacturerSlug!,
          partSlug: r.slug!,
          name: r.name!,
          status: r.status!,
          minPrice: r.minPrice,
          currency: r.currency,
          dateAdded: now,
          snapshotDate: now,
        })),
    );
    window.dispatchEvent(new Event("watchlist-change"));
    setAddedCount(added);
  }

  function exportCSV() {
    if (!results) return;
    const csv = toCsv([
      ["reference_saisie", "reference_officielle", "fabricant", "designation", "statut", "prix_min", "devise", "fiche"],
      ...results.map((r) =>
        r.found
          ? [
              r.inputRef,
              r.referenceRaw,
              r.manufacturerName,
              r.name,
              r.status,
              r.minPrice,
              r.currency ?? "EUR",
              r.manufacturerSlug && r.slug ? `${window.location.origin}/piece/${r.manufacturerSlug}/${r.slug}` : "",
            ]
          : [r.inputRef, "", "", "", "introuvable", "", "", ""],
      ),
    ]);
    downloadTextFile(csv, `recherche-lot-${new Date().toISOString().slice(0, 10)}.csv`);
  }

  const foundCount = results?.filter((r) => r.found).length ?? 0;
  const notFoundCount = (results?.length ?? 0) - foundCount;

  return (
    <div>
      <p className="text-sm font-medium text-blue-700">Mode technicien</p>
      <h1 className="mt-1 text-2xl font-bold tracking-tight">Recherche par lot</h1>
      <p className="mt-1 max-w-2xl text-sm text-zinc-500">
        Collez jusqu&apos;à {MAX_REFS} références (une par ligne, ou séparées par des virgules ou
        points-virgules) : statut de fabrication et meilleur prix de chacune, en un seul tableau
        exportable.
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          search();
        }}
        className="mt-6 space-y-3"
      >
        <label htmlFor="refs" className="sr-only">
          Références à rechercher
        </label>
        <textarea
          id="refs"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
              e.preventDefault();
              search();
            }
          }}
          placeholder={"6SE6440-2UD21-5AA1\nPWR-C1-715WAC\n1756-L61"}
          rows={8}
          spellCheck={false}
          aria-describedby="refs-help"
          className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 font-mono text-sm text-zinc-900 shadow-sm placeholder:text-zinc-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none"
        />
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={loading || refs.length === 0}
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
          <span id="refs-help" className="text-sm text-zinc-500">
            {refs.length > 0 ? (
              <>
                {plural(Math.min(refs.length, MAX_REFS), "référence")}
                {refs.length > MAX_REFS && (
                  <span className="text-amber-700"> (seules les {MAX_REFS} premières seront recherchées)</span>
                )}
              </>
            ) : (
              <span className="hidden sm:inline">Astuce : Ctrl + Entrée pour lancer la recherche</span>
            )}
          </span>
        </div>
      </form>

      {error && (
        <div role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {results && (
        <div className="mt-8">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm" aria-live="polite">
              <span className="font-semibold text-green-700">{plural(foundCount, "trouvée")}</span>
              {notFoundCount > 0 && (
                <>
                  <span className="text-zinc-300"> · </span>
                  <span className="font-semibold text-zinc-500">{plural(notFoundCount, "introuvable")}</span>
                </>
              )}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              {foundCount > 0 && (
                <button
                  type="button"
                  onClick={addAllToWatchlist}
                  disabled={addedCount !== null}
                  className="rounded-lg border border-blue-300 px-4 py-2 text-sm font-medium text-blue-700 transition hover:border-blue-500 hover:bg-blue-50 disabled:opacity-70"
                >
                  {addedCount === null
                    ? "Tout ajouter à ma liste"
                    : addedCount > 0
                      ? `✓ ${plural(addedCount, "pièce")} ajoutée${addedCount > 1 ? "s" : ""}`
                      : "✓ Déjà dans ma liste"}
                </button>
              )}
              <button
                type="button"
                onClick={exportCSV}
                className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:border-zinc-500"
              >
                <DownloadIcon />
                Exporter CSV
              </button>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-zinc-200">
            <table className="min-w-full divide-y divide-zinc-100 text-sm">
              <thead className="bg-zinc-50 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left">Saisie</th>
                  <th scope="col" className="px-4 py-3 text-left">Pièce</th>
                  <th scope="col" className="px-4 py-3 text-left">Statut</th>
                  <th scope="col" className="px-4 py-3 text-right">Prix min</th>
                  <th scope="col" className="px-4 py-3"><span className="sr-only">Fiche</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 bg-white">
                {results.map((r) =>
                  r.found ? (
                    <tr key={r.inputRef} className="hover:bg-zinc-50">
                      <td className="px-4 py-3 font-mono text-zinc-500">{r.inputRef}</td>
                      <td className="px-4 py-3">
                        <span className="font-mono font-semibold text-zinc-900">{r.referenceRaw}</span>{" "}
                        <span className="text-zinc-500">{r.manufacturerName}</span>
                        <span className="block max-w-xs truncate text-zinc-600">{r.name}</span>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={r.status ?? "unknown"} size="sm" />
                      </td>
                      <td className="px-4 py-3 text-right font-mono whitespace-nowrap text-zinc-700">
                        {formatPrice(r.minPrice, r.currency)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/piece/${r.manufacturerSlug}/${r.slug}`}
                          className="whitespace-nowrap text-blue-700 hover:underline"
                        >
                          Fiche →
                        </Link>
                      </td>
                    </tr>
                  ) : (
                    <tr key={r.inputRef} className="bg-zinc-50">
                      <td className="px-4 py-3 font-mono text-zinc-500">{r.inputRef}</td>
                      <td colSpan={3} className="px-4 py-3 text-zinc-500">
                        Aucune pièce avec cette référence exacte.
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/recherche?q=${encodeURIComponent(r.inputRef)}`}
                          onClick={() => addSearchHistory(r.inputRef)}
                          className="whitespace-nowrap text-blue-700 hover:underline"
                        >
                          Recherche approchée →
                        </Link>
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
          {addedCount !== null && addedCount > 0 && (
            <p className="mt-3 text-sm text-zinc-500">
              <Link href="/liste" className="font-medium text-blue-700 hover:underline">
                Voir ma liste →
              </Link>
            </p>
          )}
        </div>
      )}
    </div>
  );
}
