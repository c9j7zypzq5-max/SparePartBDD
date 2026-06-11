"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { readCompareList, clearCompareList, type CompareEntry } from "@/lib/compare-list";
import { StatusBadge } from "@/components/status-badge";

type PartDetail = {
  referenceRaw: string;
  name: string;
  manufacturerName: string;
  manufacturerSlug: string;
  slug: string;
  categoryName: string | null;
  status: string;
  minPrice: number | null;
  offerCount: number;
  currency: string;
  offerUrls: { url: string; price: number | null; currency: string }[];
} | null;

function formatPrice(price: number | null, currency = "EUR") {
  if (price === null) return "—";
  return `${price.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} ${currency}`;
}

function diffClass(values: (string | number | null)[], current: string | number | null) {
  const unique = [...new Set(values.filter((v) => v !== null))];
  if (unique.length <= 1) return "";
  return "bg-amber-50 font-semibold";
}

export default function ComparerPage() {
  const [compareList, setCompareList] = useState<CompareEntry[]>([]);
  const [details, setDetails] = useState<PartDetail[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const list = readCompareList();
    setCompareList(list);
    if (list.length === 0) return;
    setLoading(true);
    fetch("/api/parts/compare-view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(list.map((e) => ({ manufacturerSlug: e.manufacturerSlug, slug: e.slug }))),
    })
      .then((r) => r.json())
      .then((data) => setDetails(data))
      .finally(() => setLoading(false));
  }, []);

  if (compareList.length === 0) {
    return (
      <div className="mt-12 text-center">
        <p className="text-lg font-medium text-zinc-700">Aucune pièce à comparer</p>
        <p className="mt-2 text-sm text-zinc-500">
          Ajoutez des pièces via le bouton &ldquo;Comparer&rdquo; sur les fiches produit ou les listes.
        </p>
        <Link
          href="/recherche?q="
          className="mt-4 inline-block rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700"
        >
          Rechercher des pièces
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mt-16 flex justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-200 border-t-zinc-600" />
      </div>
    );
  }

  const found = details.filter(Boolean) as NonNullable<PartDetail>[];
  const statuses = found.map((d) => d.status);
  const categories = found.map((d) => d.categoryName);

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
      render: (d) => <StatusBadge status={d.status} />,
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
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Comparaison</h1>
        <button
          type="button"
          onClick={() => { clearCompareList(); setCompareList([]); setDetails([]); }}
          className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm text-zinc-500 transition hover:border-zinc-400 hover:text-zinc-700"
        >
          Vider la comparaison
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-zinc-200">
        <table className="min-w-full text-sm">
          <thead className="bg-zinc-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500 w-32">
                Critère
              </th>
              {found.map((d) => (
                <th key={`${d.manufacturerSlug}/${d.slug}`} className="px-4 py-3 text-left">
                  <Link
                    href={`/piece/${d.manufacturerSlug}/${d.slug}`}
                    className="font-semibold text-zinc-900 hover:text-blue-600 hover:underline"
                  >
                    {d.manufacturerName} {d.referenceRaw}
                  </Link>
                  <div className="mt-0.5 text-xs font-normal text-zinc-500">{d.name}</div>
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
