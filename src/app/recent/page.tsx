import type { Metadata } from "next";
import Link from "next/link";
import { getRecentlyUpdatedParts, getRecentlyUpdatedCount } from "@/lib/queries";
import { PartCard } from "@/components/part-card";

export const metadata: Metadata = {
  title: "Récemment mis à jour",
  description: "Pièces industrielles et informatiques mises à jour ces 30 derniers jours.",
  alternates: { canonical: "/recent" },
};

export const revalidate = 600;

const PAGE_SIZE = 48;

type Search = Promise<{ page?: string; industrie?: string }>;

export default async function RecentPage({ searchParams }: { searchParams: Search }) {
  const { page: pageParam, industrie } = await searchParams;
  const page = Math.max(1, Number.parseInt(pageParam ?? "1", 10) || 1);
  const offset = (page - 1) * PAGE_SIZE;

  const [rows, total] = await Promise.all([
    getRecentlyUpdatedParts(PAGE_SIZE, offset),
    getRecentlyUpdatedCount(),
  ]);

  const hasNext = total > page * PAGE_SIZE;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Récemment mis à jour</h1>
        <p className="mt-1 text-sm text-zinc-500">
          {total.toLocaleString("fr-FR")} référence{total > 1 ? "s" : ""} mises à jour ces 30 derniers jours.
        </p>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 p-10 text-center">
          <p className="font-medium text-zinc-700">Aucune mise à jour récente</p>
          <p className="mt-1 text-sm text-zinc-500">
            La base de données n&apos;a pas été modifiée dans les 30 derniers jours.
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {rows.map(({ part, manufacturer }) => (
            <PartCard
              key={part.id}
              href={`/piece/${manufacturer.slug}/${part.slug}`}
              name={part.name}
              referenceRaw={part.referenceRaw}
              manufacturerName={manufacturer.name}
              manufacturerSlug={manufacturer.slug}
              status={part.status}
              updatedAt={part.updatedAt}
            />
          ))}
        </div>
      )}

      {(page > 1 || hasNext) && (
        <nav className="mt-8 flex items-center justify-center gap-4 text-sm font-medium">
          {page > 1 && (
            <Link
              href={`/recent?page=${page - 1}`}
              className="rounded-full border border-zinc-200 px-4 py-2 text-zinc-600 transition hover:border-zinc-400"
            >
              ← Page précédente
            </Link>
          )}
          <span className="text-zinc-500">Page {page}</span>
          {hasNext && (
            <Link
              href={`/recent?page=${page + 1}`}
              className="rounded-full border border-zinc-200 px-4 py-2 text-zinc-600 transition hover:border-zinc-400"
            >
              Page suivante →
            </Link>
          )}
        </nav>
      )}
    </div>
  );
}
