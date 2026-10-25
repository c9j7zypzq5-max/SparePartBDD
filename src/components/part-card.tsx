import Link from "next/link";
import { StatusBadge } from "./status-badge";
import { BrandLogo } from "./brand-logo";
import { WatchlistButton, type WatchlistButtonEntry } from "./watchlist-button";
import { CompareButton } from "./compare-button";
import { formatDate } from "@/lib/format";

const SIX_MONTHS_MS = 6 * 30 * 24 * 60 * 60 * 1000;

/**
 * Carte de pièce. Composant serveur par défaut (les boutons sont des îlots
 * client) ; il reste utilisable depuis un composant client.
 *
 * Le lien couvre toute la carte via un pseudo-élément (« stretched link »)
 * plutôt que d'envelopper la carte dans un <a> : des boutons ne peuvent pas
 * être imbriqués dans un lien.
 */
export function PartCard({
  href,
  name,
  referenceRaw,
  manufacturerName,
  manufacturerSlug,
  status,
  industry,
  confidence,
  updatedAt,
  watchlistData,
}: {
  href: string;
  name: string;
  referenceRaw: string;
  manufacturerName: string;
  manufacturerSlug?: string;
  status: string;
  industry?: string;
  confidence?: number;
  updatedAt?: Date | string;
  watchlistData?: WatchlistButtonEntry;
}) {
  const updatedDate = updatedAt ? new Date(updatedAt) : null;
  const isStale = updatedDate && Date.now() - updatedDate.getTime() > SIX_MONTHS_MS;
  return (
    <div className="relative rounded-lg border border-zinc-200 p-4 transition focus-within:ring-2 focus-within:ring-blue-200 hover:border-blue-400 hover:shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 font-mono text-sm text-zinc-500">
            {manufacturerSlug && (
              <BrandLogo slug={manufacturerSlug} name={manufacturerName} size={20} />
            )}
            {manufacturerName} · {referenceRaw}
          </div>
          <Link
            href={href}
            className="mt-1 block font-medium text-zinc-900 after:absolute after:inset-0 after:rounded-lg focus:outline-none"
          >
            {name}
          </Link>
          {industry && (
            <div className="mt-1 text-xs text-zinc-400 capitalize">{industry}</div>
          )}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <StatusBadge status={status} />
          {isStale && (
            <span className="text-xs text-zinc-400">Données à vérifier</span>
          )}
          {updatedDate && !isStale && (
            <span className="text-xs text-zinc-400">
              Mis à jour le {formatDate(updatedDate)}
            </span>
          )}
          {typeof confidence === "number" && (
            <span
              className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                confidence >= 0.7
                  ? "bg-green-100 text-green-700"
                  : confidence >= 0.5
                    ? "bg-amber-100 text-amber-700"
                    : "bg-zinc-100 text-zinc-500"
              }`}
            >
              confiance {Math.round(confidence * 100)} %
            </span>
          )}
          {/* Au-dessus du lien étiré pour rester cliquables */}
          <div className="relative z-10 flex flex-col items-end gap-1.5">
            {watchlistData && <WatchlistButton entry={watchlistData} />}
            {manufacturerSlug && (
              <CompareButton
                entry={{
                  referenceRaw,
                  name,
                  manufacturerName,
                  manufacturerSlug,
                  slug: href.split("/").pop() ?? "",
                  status,
                }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
