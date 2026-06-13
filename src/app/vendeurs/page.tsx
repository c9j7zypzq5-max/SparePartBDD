import type { Metadata } from "next";
import { getSellerStats } from "@/lib/queries";
import { Breadcrumb } from "@/components/breadcrumb";

export const metadata: Metadata = {
  title: "Revendeurs",
  description: "Liste de tous les revendeurs référencés sur SparePartSearch avec le nombre d'offres et de références couvertes.",
  alternates: { canonical: "/vendeurs" },
};

export const dynamic = "force-dynamic";

const TYPE_LABELS: Record<string, string> = {
  constructeur: "Constructeur",
  distributeur_officiel: "Distributeur officiel",
  aftermarket: "Aftermarket",
  reconditionne: "Reconditionné",
  occasion: "Occasion",
};

const TYPE_COLORS: Record<string, string> = {
  constructeur: "bg-blue-100 text-blue-700",
  distributeur_officiel: "bg-green-100 text-green-700",
  aftermarket: "bg-amber-100 text-amber-700",
  reconditionne: "bg-purple-100 text-purple-700",
  occasion: "bg-zinc-100 text-zinc-600",
};

export default async function VendeursPage() {
  const rows = await getSellerStats();

  return (
    <div>
      <Breadcrumb items={[{ label: "Revendeurs", href: "/vendeurs" }]} />
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Revendeurs</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {rows.length} revendeur{rows.length > 1 ? "s" : ""} référencé{rows.length > 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 p-10 text-center">
          <p className="font-medium text-zinc-700">Aucun revendeur référencé</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-zinc-200">
          <table className="min-w-full divide-y divide-zinc-100 text-sm">
            <thead className="bg-zinc-50 text-xs font-semibold uppercase tracking-wide text-zinc-500">
              <tr>
                <th className="px-4 py-3 text-left">Revendeur</th>
                <th className="px-4 py-3 text-left">Type</th>
                <th className="px-4 py-3 text-left">Pays</th>
                <th className="px-4 py-3 text-right">Offres</th>
                <th className="px-4 py-3 text-right">Références</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 bg-white">
              {rows.map(({ seller, offerCount, partCount }) => (
                <tr key={seller.id} className="hover:bg-zinc-50">
                  <td className="px-4 py-3 font-medium text-zinc-900">
                    {seller.website ? (
                      <a
                        href={seller.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-blue-600 hover:underline"
                      >
                        {seller.name}
                      </a>
                    ) : (
                      seller.name
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                        TYPE_COLORS[seller.type] ?? "bg-zinc-100 text-zinc-600"
                      }`}
                    >
                      {TYPE_LABELS[seller.type] ?? seller.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-zinc-500">{seller.country ?? "—"}</td>
                  <td className="px-4 py-3 text-right font-mono text-zinc-700">
                    {offerCount.toLocaleString("fr-FR")}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-zinc-700">
                    {partCount.toLocaleString("fr-FR")}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {seller.website && (
                      <a
                        href={seller.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:underline"
                      >
                        Visiter ↗
                      </a>
                    )}
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
