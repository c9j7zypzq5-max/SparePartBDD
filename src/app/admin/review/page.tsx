import type { Metadata } from "next";
import Link from "next/link";
import { getPartsForReview } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Révision des fiches",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminReviewPage() {
  const rows = await getPartsForReview(200);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Fiches à réviser</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Pièces avec signal ambigu (<code>needsReview = true</code>) ou score de confiance
            inférieur à 60.
          </p>
        </div>
        <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-700">
          {rows.length} fiche{rows.length > 1 ? "s" : ""}
        </span>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 p-10 text-center">
          <p className="font-medium text-zinc-700">Aucune fiche à réviser</p>
          <p className="mt-1 text-sm text-zinc-500">
            Toutes les pièces ont un score de confiance satisfaisant.
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
                <th className="px-4 py-3 text-left">Mis à jour</th>
                <th className="px-4 py-3 text-left">Note lifecycle</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 bg-white">
              {rows.map(({ part, manufacturer }) => (
                <tr
                  key={part.id}
                  className={`hover:bg-zinc-50 ${part.needsReview ? "bg-amber-50/50" : ""}`}
                >
                  <td className="px-4 py-3 font-mono text-zinc-900">
                    {part.referenceRaw}
                  </td>
                  <td className="px-4 py-3 text-zinc-700">{manufacturer.name}</td>
                  <td className="px-4 py-3">
                    {part.status === "active" && (
                      <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                        Fabriquée
                      </span>
                    )}
                    {part.status === "obsolete" && (
                      <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                        Obsolète
                      </span>
                    )}
                    {part.status === "unknown" && (
                      <span className="rounded-full bg-zinc-200 px-2 py-0.5 text-xs font-medium text-zinc-500">
                        Inconnu
                      </span>
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
                  <td className="px-4 py-3 text-xs text-zinc-400">
                    {part.updatedAt.toLocaleDateString("fr-FR")}
                  </td>
                  <td className="max-w-xs px-4 py-3 text-xs text-zinc-500">
                    {part.lifecycleNote ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/piece/${manufacturer.slug}/${part.slug}`}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      Voir la fiche →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
