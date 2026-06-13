"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import {
  readWatchlist,
  writeWatchlist,
  toggleWatchlist,
  type WatchlistEntry,
} from "@/lib/watchlist";
import { StatusBadge } from "@/components/status-badge";
import { WatchlistSubscribeForm } from "@/components/watchlist-subscribe-form";
import { ShareButton } from "@/components/share-button";

type CompareResult = {
  reference: string;
  found: boolean;
  current: {
    reference: string;
    manufacturer: string;
    manufacturerSlug: string;
    partSlug: string;
    name: string;
    status: string;
    minPrice?: number;
    currency?: string;
  } | null;
  changes: string[];
};

function formatPrice(price?: number, currency = "EUR") {
  if (price === undefined) return "—";
  return `${price.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;
}

function exportCSV(list: WatchlistEntry[]) {
  const header = "reference,manufacturer,name,status,min_price,currency,date_added,snapshot_date";
  const rows = list.map((e) =>
    [
      `"${e.reference}"`,
      `"${e.manufacturer}"`,
      `"${e.name.replace(/"/g, '""')}"`,
      e.status,
      e.minPrice ?? "",
      e.currency ?? "EUR",
      e.dateAdded,
      e.snapshotDate,
    ].join(","),
  );
  const csv = [header, ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `ma-liste-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function parseCSV(text: string): Array<{
  reference: string;
  manufacturer: string;
  status: string;
  minPrice?: number;
  snapshotDate: string;
}> {
  const [headerLine, ...lines] = text.trim().split("\n");
  const headers = headerLine.split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
  return lines
    .filter((l) => l.trim())
    .map((line) => {
      const cols = line.match(/("(?:[^"]|"")*"|[^,]*)/g)?.map((c) =>
        c.replace(/^"|"$/g, "").replace(/""/g, '"'),
      ) ?? [];
      const row: Record<string, string> = {};
      headers.forEach((h, i) => (row[h] = cols[i] ?? ""));
      return {
        reference: row.reference ?? "",
        manufacturer: row.manufacturer ?? "",
        status: row.status ?? "unknown",
        minPrice: row.min_price ? parseFloat(row.min_price) : undefined,
        snapshotDate: row.snapshot_date ?? row.date_added ?? new Date().toISOString(),
      };
    });
}

function statusLabel(s: string) {
  if (s === "active") return "Fabriquée";
  if (s === "obsolete") return "Obsolète";
  return "Inconnu";
}

type ChangeCategory = "unchanged" | "modified" | "degraded" | "notfound";

function categorize(r: CompareResult): ChangeCategory {
  if (!r.found) return "notfound";
  if (r.changes.some((c) => c.includes("obsolète") || c.includes("→ obsolete") || c.includes("→ eol"))) return "degraded";
  if (r.changes.length > 0) return "modified";
  return "unchanged";
}

const CATEGORY_STYLES: Record<ChangeCategory, string> = {
  unchanged: "border-green-200 bg-green-50",
  modified: "border-amber-200 bg-amber-50",
  degraded: "border-red-200 bg-red-50",
  notfound: "border-zinc-200 bg-zinc-50",
};

const CATEGORY_BADGE: Record<ChangeCategory, { label: string; className: string }> = {
  unchanged: { label: "Inchangé", className: "bg-green-100 text-green-700" },
  modified: { label: "Modifié", className: "bg-amber-100 text-amber-700" },
  degraded: { label: "Dégradé", className: "bg-red-100 text-red-700" },
  notfound: { label: "Introuvable", className: "bg-zinc-200 text-zinc-500" },
};

export default function ListePage() {
  const [list, setList] = useState<WatchlistEntry[]>([]);
  const [comparing, setComparing] = useState(false);
  const [compareResults, setCompareResults] = useState<CompareResult[] | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setList(readWatchlist());
    const refresh = () => setList(readWatchlist());
    window.addEventListener("watchlist-change", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("watchlist-change", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  function removeFromList(entry: WatchlistEntry) {
    toggleWatchlist(entry);
    setList(readWatchlist());
    window.dispatchEvent(new Event("watchlist-change"));
  }

  async function runCompare(csvText: string) {
    const parsed = parseCSV(csvText);
    if (parsed.length === 0) return;
    setComparing(true);
    setCompareResults(null);
    try {
      const res = await fetch("/api/parts/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          parsed.map((p) => ({
            reference: p.reference,
            manufacturer: p.manufacturer,
            status: p.status,
            minPrice: p.minPrice,
            snapshotDate: p.snapshotDate,
          })),
        ),
      });
      if (!res.ok) throw new Error("Erreur serveur");
      const results: CompareResult[] = await res.json();
      setCompareResults(results);
    } catch {
      alert("Erreur lors de la comparaison. Vérifiez le format du fichier.");
    } finally {
      setComparing(false);
    }
  }

  const handleFile = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      runCompare(text);
    };
    reader.readAsText(file);
  }, []);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function updateListFromResults() {
    if (!compareResults) return;
    const current = readWatchlist();
    const updated = current.map((entry) => {
      const result = compareResults.find(
        (r) =>
          r.found &&
          r.current &&
          r.current.manufacturerSlug === entry.manufacturerSlug &&
          r.current.partSlug === entry.partSlug,
      );
      if (!result?.current) return entry;
      return {
        ...entry,
        status: result.current.status,
        minPrice: result.current.minPrice,
        currency: result.current.currency,
        snapshotDate: new Date().toISOString(),
      };
    });
    writeWatchlist(updated);
    setList(updated);
    window.dispatchEvent(new Event("watchlist-change"));
    setCompareResults(null);
  }

  const unchanged = compareResults?.filter((r) => categorize(r) === "unchanged").length ?? 0;
  const modified = compareResults?.filter((r) => categorize(r) === "modified").length ?? 0;
  const degraded = compareResults?.filter((r) => categorize(r) === "degraded").length ?? 0;
  const notfound = compareResults?.filter((r) => categorize(r) === "notfound").length ?? 0;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight">Ma liste</h1>
        {list.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <ShareButton />
            <button
              type="button"
              onClick={() => exportCSV(list)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:border-zinc-500 hover:text-zinc-900"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-4 w-4">
                <path d="M8 1a.75.75 0 0 1 .75.75v6.19l1.97-1.97a.75.75 0 0 1 1.06 1.06l-3.25 3.25a.75.75 0 0 1-1.06 0L4.22 7.03a.75.75 0 0 1 1.06-1.06L7.25 7.94V1.75A.75.75 0 0 1 8 1zM2.5 13.75A.75.75 0 0 1 3.25 13h9.5a.75.75 0 0 1 0 1.5h-9.5a.75.75 0 0 1-.75-.75z" />
              </svg>
              Télécharger ma liste
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 rounded-lg border border-blue-300 px-4 py-2 text-sm font-medium text-blue-700 transition hover:border-blue-500 hover:bg-blue-50"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-4 w-4">
                <path d="M1 9.5A.5.5 0 0 1 1.5 9h2.293L1.146 6.354a.5.5 0 1 1 .708-.708l3 3a.5.5 0 0 1 0 .708l-3 3a.5.5 0 0 1-.708-.708L3.793 9.5H1.5A.5.5 0 0 1 1 9zM8.5 1a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1H9v3a.5.5 0 0 1-1 0V5.5H5a.5.5 0 0 1 0-1h3V1.5a.5.5 0 0 1 .5-.5z" />
              </svg>
              Comparer avec une liste
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
                e.target.value = "";
              }}
            />
          </div>
        )}
      </div>

      {list.length === 0 && !compareResults && (
        <div className="mt-12 rounded-2xl border border-dashed border-zinc-300 p-10 text-center">
          <p className="text-lg font-medium text-zinc-700">Votre liste est vide</p>
          <p className="mt-2 text-sm text-zinc-500">
            Cliquez sur &ldquo;Ma liste&rdquo; depuis une carte produit ou une fiche pièce pour ajouter des références.
          </p>
          <Link
            href="/recherche?q="
            className="mt-4 inline-block rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700"
          >
            Rechercher des pièces
          </Link>
        </div>
      )}

      {list.length > 0 && !compareResults && (
        <>
          <div className="mt-6 overflow-x-auto rounded-xl border border-zinc-200">
            <table className="min-w-full divide-y divide-zinc-100 text-sm">
              <thead className="bg-zinc-50 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                <tr>
                  <th className="px-4 py-3 text-left">Référence</th>
                  <th className="px-4 py-3 text-left">Fabricant</th>
                  <th className="px-4 py-3 text-left">Désignation</th>
                  <th className="px-4 py-3 text-left">Statut</th>
                  <th className="px-4 py-3 text-right">Prix min</th>
                  <th className="px-4 py-3 text-left">Ajouté le</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 bg-white">
                {list.map((entry) => (
                  <tr key={`${entry.manufacturerSlug}/${entry.partSlug}`} className="hover:bg-zinc-50">
                    <td className="px-4 py-3">
                      <Link
                        href={`/piece/${entry.manufacturerSlug}/${entry.partSlug}`}
                        className="font-mono text-blue-700 hover:underline"
                      >
                        {entry.reference}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-zinc-700">{entry.manufacturer}</td>
                    <td className="px-4 py-3 text-zinc-700">{entry.name}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={entry.status} />
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-zinc-700">
                      {formatPrice(entry.minPrice, entry.currency)}
                    </td>
                    <td className="px-4 py-3 text-zinc-400">
                      {new Date(entry.dateAdded).toLocaleDateString("fr-FR")}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => removeFromList(entry)}
                        title="Retirer de la liste"
                        className="text-zinc-300 transition hover:text-red-500"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-4 w-4">
                          <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5.5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z" />
                          <path fillRule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <WatchlistSubscribeForm references={list.map((e) => e.reference)} />

          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`mt-6 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-8 text-center transition ${
              dragOver
                ? "border-blue-400 bg-blue-50"
                : "border-zinc-200 hover:border-zinc-400"
            }`}
          >
            {comparing ? (
              <div className="flex items-center gap-2 text-zinc-500">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-600" />
                Comparaison en cours…
              </div>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-8 w-8 text-zinc-300">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
                </svg>
                <p className="mt-2 text-sm font-medium text-zinc-600">
                  Déposez ou cliquez pour importer une liste CSV
                </p>
                <p className="mt-1 text-xs text-zinc-400">
                  Comparez vos anciennes données avec l&apos;état actuel de la base
                </p>
              </>
            )}
          </div>
        </>
      )}

      {compareResults && (
        <div className="mt-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-3 text-sm">
              <span className="font-medium text-green-700">{unchanged} inchangée{unchanged > 1 ? "s" : ""}</span>
              <span className="text-zinc-300">·</span>
              <span className="font-medium text-amber-700">{modified + degraded} modifiée{modified + degraded > 1 ? "s" : ""}</span>
              <span className="text-zinc-300">·</span>
              <span className="font-medium text-zinc-500">{notfound} introuvable{notfound > 1 ? "s" : ""}</span>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={updateListFromResults}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
              >
                Mettre à jour ma liste locale
              </button>
              <button
                type="button"
                onClick={() => setCompareResults(null)}
                className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-600 transition hover:border-zinc-400"
              >
                Retour à la liste
              </button>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-zinc-200">
            <table className="min-w-full divide-y divide-zinc-100 text-sm">
              <thead className="bg-zinc-50 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                <tr>
                  <th className="px-4 py-3 text-left">Référence</th>
                  <th className="px-4 py-3 text-left">Statut actuel</th>
                  <th className="px-4 py-3 text-left">Changements</th>
                  <th className="px-4 py-3 text-left">Fiche</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 bg-white">
                {compareResults.map((r) => {
                  const cat = categorize(r);
                  const badge = CATEGORY_BADGE[cat];
                  return (
                    <tr key={r.reference} className={`${CATEGORY_STYLES[cat]}`}>
                      <td className="px-4 py-3 font-mono text-zinc-900">{r.reference}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${badge.className}`}>
                          {badge.label}
                        </span>
                        {r.current && (
                          <span className="ml-2 text-xs text-zinc-500">
                            {statusLabel(r.current.status)}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-zinc-600">
                        {r.changes.length > 0 ? (
                          <ul className="space-y-0.5">
                            {r.changes.map((c) => (
                              <li key={c} className="text-xs">{c}</li>
                            ))}
                          </ul>
                        ) : (
                          <span className="text-xs text-zinc-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {r.current && (
                          <Link
                            href={`/piece/${r.current.manufacturerSlug}/${r.current.partSlug}`}
                            className="text-xs text-blue-600 hover:underline"
                          >
                            Voir la fiche →
                          </Link>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
