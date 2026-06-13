import type { Metadata } from "next";
import Link from "next/link";
import { getPartsForReview, getPartsForReviewCount } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Révision des fiches",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

const REASON_FILTERS = [
  { value: "all", label: "Toutes" },
  { value: "needsReview", label: "Signal ambigu" },
  { value: "lowScore", label: "Confiance < 60" },
] as const;

type Reason = "needsReview" | "lowScore" | "all";
type Search = Promise<{ page?: string; reason?: string }>;

export default async function AdminReviewPage({ searchParams }: { searchParams: Search }) {
  const { page: pageParam, reason: reasonParam } = await searchParams;
  const page = Math.max(1, Number.parseInt(pageParam ?? "1", 10) || 1);
  const reason: Reason = REASON_FILTERS.some((f) => f.value === reasonParam)
    ? (reasonParam as Reason)
    : "all";
  const offset = (page - 1) * PAGE_SIZE;

  const [rows, total] = await Promise.all([
    getPartsForReview({ limit: PAGE_SIZE, offset, reason }),
    getPartsForReviewCount(reason),
  ]);

  const hasNext = total > page * PAGE_SIZE;

  function buildHref(p: number, r: string) {
    const sp = new URLSearchParams();
    if (r !== "all") sp.set("reason", r);
    if (p > 1) sp.set("page", String(p));
    const qs = sp.toString();
    return `/admin/review${qs ? `?${qs}` : ""}`;
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Fiches à réviser</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Pièces avec signal ambigu (<code>needsReview</code>) ou score de confiance inférieur à 60.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/stats"
            className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm text-zinc-600 transition hover:border-zinc-400"
          >
            Statistiques
          </Link>
          <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-700">
            {total.toLocaleString("fr-FR")} fiche{total > 1 ? "s" : ""}
          </span>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {REASON_FILTERS.map((f) => (
          <Link
            key={f.value}
            href={buildHref(1, f.value)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
              reason === f.value
                ? "bg-zinc-900 text-white"
                : "border border-zinc-200 text-zinc-600 hover:border-zinc-400"
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 p-10 text-center">
          <p className="font-medium text-zinc-700">Aucune fiche à réviser</p>
          <p className="mt-1 text-sm text-zinc-500">
            Toutes les pièces ont un score de confiance satisfaisant et aucun signal ambigu.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-zinc-200">
          <table className="min-w-full divide-y divide-zinc-100 text-sm">
            <thead className="bg-zinc-50 text-xs font-semibold uppercase tracking-wide text-zinc-500">
              <tr>
                <th className="px-4 py-3 text-left">Référence</th>
                <th className="px-4 py-3 text-left">Fabricant</th>
                <th className="px-4 py-3 text-left">Statut</th>
                <th className="px-4 py-3 text-left">Score</th>
                <th className="px-4 py-3 text-left">Signal</th>
                <th className="px-4 py-3 text-left">Mis à jour</th>
                <th className="px-4 py-3 text-left">Note lifecycle</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 bg-white">
              {rows.map(({ part, manufacturer }) => (
                <tr
                  key={part.id}
                  className={`hover:bg-zinc-50 ${part.needsReview ? "bg-amber-50/40" : ""}`}
                >
                  <td className="px-4 py-3 font-mono text-zinc-900">{part.referenceRaw}</td>
                  <td className="px-4 py-3 text-zinc-700">{manufacturer.name}</td>
                  <td className="px-4 py-3">
                    {part.status === "active" && (
                      <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">Fabriquée</span>
                    )}
                    {part.status === "obsolete" && (
                      <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">Obsolète</span>
                    )}
                    {part.status === "unknown" && (
                      <span className="rounded-full bg-zinc-200 px-2 py-0.5 text-xs font-medium text-zinc-500">Inconnu</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {part.confidenceScore != null ? (
                      <span
                        className={`font-mono text-xs font-semibold ${
                          part.confidenceScore < 40
                            ? "text-red-600"
                            : part.confidenceScore < 60
                              ? "text-amber-600"
                              : "text-green-600"
                        }`}
                      >
                        {part.confidenceScore}
                      </span>
                    ) : (
                      <span className="text-xs text-zinc-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {part.needsReview && (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                        ⚠ Signal ambigu
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-zinc-400">
                    {part.updatedAt.toLocaleDateString("fr-FR")}
                  </td>
                  <td className="max-w-xs truncate px-4 py-3 text-xs text-zinc-500">
                    {part.lifecycleNote ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/piece/${manufacturer.slug}/${part.slug}`}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      Voir →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {(page > 1 || hasNext) && (
        <nav className="mt-6 flex items-center justify-center gap-4 text-sm font-medium">
          {page > 1 && (
            <Link
              href={buildHref(page - 1, reason)}
              className="rounded-full border border-zinc-200 px-4 py-2 text-zinc-600 transition hover:border-zinc-400"
            >
              ← Précédente
            </Link>
          )}
          <span className="text-zinc-500">
            Page {page} — {offset + 1}–{Math.min(offset + rows.length, total)} / {total}
          </span>
          {hasNext && (
            <Link
              href={buildHref(page + 1, reason)}
              className="rounded-full border border-zinc-200 px-4 py-2 text-zinc-600 transition hover:border-zinc-400"
            >
              Suivante →
            </Link>
          )}
        </nav>
      )}
    </div>
  );
}
