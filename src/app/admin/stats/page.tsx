import type { Metadata } from "next";
import Link from "next/link";
import { getAdminStats } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Stats admin",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

function StatCard({
  label,
  value,
  sub,
  color = "zinc",
}: {
  label: string;
  value: number;
  sub?: string;
  color?: "zinc" | "green" | "red" | "amber" | "blue" | "purple";
}) {
  const bg: Record<string, string> = {
    zinc: "bg-zinc-50 border-zinc-200",
    green: "bg-green-50 border-green-200",
    red: "bg-red-50 border-red-200",
    amber: "bg-amber-50 border-amber-200",
    blue: "bg-blue-50 border-blue-200",
    purple: "bg-purple-50 border-purple-200",
  };
  return (
    <div className={`rounded-xl border p-4 ${bg[color]}`}>
      <div className="text-2xl font-bold tabular-nums text-zinc-900">
        {value.toLocaleString("fr-FR")}
      </div>
      <div className="mt-1 text-sm font-medium text-zinc-600">{label}</div>
      {sub && <div className="mt-0.5 text-xs text-zinc-400">{sub}</div>}
    </div>
  );
}

export default async function AdminStatsPage() {
  const stats = await getAdminStats();
  if (!stats) {
    return <p className="text-zinc-500">Statistiques indisponibles.</p>;
  }

  const pct = (n: number) =>
    stats.totalParts > 0 ? Math.round((n / stats.totalParts) * 100) : 0;
  const activeRate = pct(stats.activeParts);
  const obsoleteRate = pct(stats.obsoleteParts);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Statistiques</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Métriques de la base de données en temps réel.
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/admin/review"
            className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm text-zinc-600 transition hover:border-zinc-400"
          >
            Fiches à réviser
          </Link>
        </div>
      </div>

      <section className="mb-8">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">
          Pièces
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Total pièces" value={stats.totalParts} />
          <StatCard
            label="Fabriquées"
            value={stats.activeParts}
            sub={`${activeRate} % du catalogue`}
            color="green"
          />
          <StatCard
            label="Obsolètes"
            value={stats.obsoleteParts}
            sub={`${obsoleteRate} % du catalogue`}
            color="red"
          />
          <StatCard label="Statut inconnu" value={stats.unknownParts} />
        </div>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">
          Qualité & activité
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <StatCard
            label="À réviser"
            value={stats.needsReviewCount}
            color="amber"
          />
          <StatCard
            label="Mises à jour (30 j)"
            value={stats.recentParts}
            color="blue"
          />
          <StatCard label="Remplacements" value={stats.totalSupersessions} />
        </div>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">
          Catalogue
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Fabricants" value={stats.totalManufacturers} />
          <StatCard label="Catégories" value={stats.totalCategories} />
          <StatCard label="Vendeurs" value={stats.totalSellers} />
          <StatCard label="Offres" value={stats.totalOffers} />
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">
          Relations
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <StatCard label="Compatibilités" value={stats.totalCompatibilities} />
        </div>
      </section>
    </div>
  );
}
