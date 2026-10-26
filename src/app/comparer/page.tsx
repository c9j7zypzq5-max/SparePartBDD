"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { readCompareList, clearCompareList, toggleCompare, type CompareEntry } from "@/lib/compare-list";
import { StatusBadge } from "@/components/status-badge";
import { formatPrice } from "@/lib/format";
import { downloadTextFile, toCsv } from "@/lib/csv";
import { CloseIcon, DownloadIcon } from "@/components/icons";

type PartDetail = {
  referenceRaw: string;
  name: string;
  manufacturerName: string;
  manufacturerSlug: string;
  slug: string;
  categoryName: string | null;
  status: string;
  attributes: Record<string, string> | null;
  minPrice: number | null;
  offerCount: number;
  currency: string;
  offerUrls: { url: string; price: number | null; currency: string }[];
} | null;

function diffClass(values: (string | number | null)[], current: string | number | null) {
  const unique = [...new Set(values.filter((v) => v !== null))];
  if (unique.length <= 1) return "";
  return "bg-amber-50 font-semibold";
}

function exportToCSV(found: NonNullable<PartDetail>[], allAttrKeys: string[]) {
  const csv = toCsv([
    ["Critère", ...found.map((d) => `${d.manufacturerName} ${d.referenceRaw}`)],
    ["Référence", ...found.map((d) => d.referenceRaw)],
    ["Fabricant", ...found.map((d) => d.manufacturerName)],
    ["Catégorie", ...found.map((d) => d.categoryName ?? "")],
    ["Statut", ...found.map((d) => d.status)],
    ["Prix min", ...found.map((d) => d.minPrice)],
    ["Offres", ...found.map((d) => d.offerCount)],
    ...allAttrKeys.map((key) => [key, ...found.map((d) => d.attributes?.[key] ?? "")]),
  ]);
  downloadTextFile(csv, "comparaison.csv");
}

export default function ComparerPage() {
  const [compareList, setCompareList] = useState<CompareEntry[]>([]);
  const [details, setDetails] = useState<PartDetail[]>([]);
  // Liste lue dans localStorage après le montage : avant, ni « vide » ni tableau.
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    function load() {
      const list = readCompareList();
      setCompareList(list);
      setReady(true);
      setError(false);
      if (list.length === 0) {
        setDetails([]);
        return;
      }
      setLoading(true);
      fetch("/api/parts/compare-view", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(list.map((e) => ({ manufacturerSlug: e.manufacturerSlug, slug: e.slug }))),
      })
        .then((r) => {
          if (!r.ok) throw new Error(`HTTP ${r.status}`);
          return r.json();
        })
        .then((data: PartDetail[]) => {
          if (!cancelled) setDetails(data);
        })
        .catch(() => {
          if (!cancelled) setError(true);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }
    load();
    // Retrait d'une pièce (ici, depuis une fiche ou un autre onglet) : on recharge.
    window.addEventListener("compare-change", load);
    window.addEventListener("storage", load);
    return () => {
      cancelled = true;
      window.removeEventListener("compare-change", load);
      window.removeEventListener("storage", load);
    };
  }, []);

  if (!ready) return null;

  if (compareList.length === 0) {
    return (
      <div className="mt-12 text-center">
        <p className="text-lg font-medium text-zinc-700">Aucune pièce à comparer</p>
        <p className="mt-2 text-sm text-zinc-500">
          Ajoutez des pièces via le bouton &ldquo;Comparer&rdquo; sur les fiches produit ou les listes.
        </p>
        <Link
          href="/recherche"
          className="mt-4 inline-block rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700"
        >
          Rechercher des pièces
        </Link>
      </div>
    );
  }

  if (error) {
    return (
      <div role="alert" className="mt-12 rounded-xl border border-red-200 bg-red-50 p-6 text-center text-sm text-red-700">
        La comparaison n&apos;a pas pu être chargée.{" "}
        <button type="button" onClick={() => window.dispatchEvent(new Event("compare-change"))} className="font-medium underline">
          Réessayer
        </button>
      </div>
    );
  }

  if (loading && details.length === 0) {
    return (
      <div className="mt-16 flex justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-200 border-t-zinc-600" />
      </div>
    );
  }

  const found = details.filter(Boolean) as NonNullable<PartDetail>[];

  // Collect all attribute keys from all parts
  const allAttrKeys = [...new Set(found.flatMap((d) => Object.keys(d.attributes ?? {})))];

  const ROWS: { label: string; render: (d: NonNullable<PartDetail>) => React.ReactNode; values: (d: NonNullable<PartDetail>) => string | number | null }[] = [
    {
      label: "Référence",
      render: (d) => <span className="font-mono">{d.referenceRaw}</span>,
      values: (d) => d.referenceRaw,
    },
    {
      label: "Fabricant",
      render: (d) => d.manufacturerName,
      values: (d) => d.manufacturerName,
    },
    {
      label: "Catégorie",
      render: (d) => d.categoryName ?? "—",
      values: (d) => d.categoryName,
    },
    {
      label: "Statut",
      render: (d) => <StatusBadge status={d.status} size="sm" />,
      values: (d) => d.status,
    },
    {
      label: "Prix min",
      render: (d) => formatPrice(d.minPrice, d.currency),
      values: (d) => d.minPrice,
    },
    {
      label: "Offres",
      render: (d) => d.offerCount > 0 ? `${d.offerCount} vendeur${d.offerCount > 1 ? "s" : ""}` : "Aucune",
      values: (d) => d.offerCount,
    },
    {
      label: "Revendeurs",
      render: (d) =>
        d.offerUrls.length > 0 ? (
          <ul className="space-y-1">
            {d.offerUrls.map((o, i) => (
              <li key={i}>
                <a href={o.url} target="_blank" rel="noopener" className="text-blue-600 hover:underline text-xs">
                  {o.price !== null ? formatPrice(o.price, o.currency) : "Voir"} ↗
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <span className="text-zinc-400 text-xs">—</span>
        ),
      values: (d) => d.offerUrls.length,
    },
  ];

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Comparaison</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Les valeurs qui diffèrent entre les pièces sont surlignées.
            {compareList.length < 3 && " Vous pouvez ajouter jusqu'à 3 pièces."}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => exportToCSV(found, allAttrKeys)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 transition hover:border-zinc-500 hover:text-zinc-900"
          >
            <DownloadIcon />
            Exporter CSV
          </button>
          <button
            type="button"
            onClick={clearCompareList}
            className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm text-zinc-500 transition hover:border-zinc-400 hover:text-zinc-700"
          >
            Vider
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-zinc-200">
        <table className="min-w-full text-sm">
          <thead className="bg-zinc-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500 w-32">
                Critère
              </th>
              {found.map((d) => (
                <th key={`${d.manufacturerSlug}/${d.slug}`} scope="col" className="px-4 py-3 text-left align-top">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <Link
                        href={`/piece/${d.manufacturerSlug}/${d.slug}`}
                        className="font-semibold text-zinc-900 hover:text-blue-600 hover:underline"
                      >
                        {d.manufacturerName} {d.referenceRaw}
                      </Link>
                      <div className="mt-0.5 text-xs font-normal text-zinc-500">{d.name}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const entry = compareList.find((e) => e.manufacturerSlug === d.manufacturerSlug && e.slug === d.slug);
                        if (entry) toggleCompare(entry);
                      }}
                      aria-label={`Retirer ${d.referenceRaw} de la comparaison`}
                      className="shrink-0 rounded p-1 text-zinc-400 transition hover:bg-zinc-200 hover:text-zinc-700"
                    >
                      <CloseIcon className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {ROWS.map((row) => {
              const vals = found.map(row.values);
              return (
                <tr key={row.label}>
                  <td className="px-4 py-3 text-xs font-semibold text-zinc-500 bg-zinc-50">
                    {row.label}
                  </td>
                  {found.map((d) => (
                    <td
                      key={`${d.manufacturerSlug}/${d.slug}`}
                      className={`px-4 py-3 ${diffClass(vals, row.values(d))}`}
                    >
                      {row.render(d)}
                    </td>
                  ))}
                </tr>
              );
            })}
            {allAttrKeys.length > 0 && (
              <tr>
                <td colSpan={found.length + 1} className="bg-zinc-100 px-4 py-2 text-xs font-bold uppercase tracking-wider text-zinc-500">
                  Caractéristiques techniques
                </td>
              </tr>
            )}
            {allAttrKeys.map((key) => {
              const vals = found.map((d) => d.attributes?.[key] ?? null);
              return (
                <tr key={key}>
                  <td className="bg-zinc-50 px-4 py-3 text-xs font-semibold text-zinc-500">{key}</td>
                  {found.map((d) => {
                    const val = d.attributes?.[key] ?? null;
                    return (
                      <td
                        key={`${d.manufacturerSlug}/${d.slug}`}
                        className={`px-4 py-3 text-sm ${diffClass(vals, val)}`}
                      >
                        {val ?? <span className="text-zinc-300">—</span>}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        {found.map((d) => (
          <Link
            key={`${d.manufacturerSlug}/${d.slug}`}
            href={`/piece/${d.manufacturerSlug}/${d.slug}`}
            className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:border-blue-400 hover:text-blue-700"
          >
            Voir fiche {d.referenceRaw} →
          </Link>
        ))}
      </div>
    </div>
  );
}
