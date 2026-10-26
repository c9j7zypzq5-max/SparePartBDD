import Link from "next/link";
import { StatusBadge } from "./status-badge";
import { BrandLogo } from "./brand-logo";
import { WatchlistButton, type WatchlistButtonEntry } from "./watchlist-button";
import { CompareButton } from "./compare-button";
import { formatDate, formatPrice, plural } from "@/lib/format";
import type { PartCardExtras } from "@/lib/queries";

const SIX_MONTHS_MS = 6 * 30 * 24 * 60 * 60 * 1000;

/**
 * Carte de pièce. Composant serveur par défaut (les boutons sont des îlots
 * client) ; il reste utilisable depuis un composant client.
 *
 * Le lien couvre toute la carte via un pseudo-élément (« stretched link »)
 * plutôt que d'envelopper la carte dans un <a> : des boutons ne peuvent pas
 * être imbriqués dans un lien. Les éléments interactifs internes passent
 * au-dessus (relative z-10).
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
  extras,
  showUpdatedDate = false,
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
  /** Prix, offres et remplacement (listes de résultats) ; absent = non affiché. */
  extras?: PartCardExtras;
  /** Affiche la date de mise à jour (sinon seulement l'alerte de données anciennes). */
  showUpdatedDate?: boolean;
}) {
  const updatedDate = updatedAt ? new Date(updatedAt) : null;
  const isStale = updatedDate && Date.now() - updatedDate.getTime() > SIX_MONTHS_MS;
  const replacement = status === "obsolete" ? extras?.replacement : null;
  const hasActions = Boolean(watchlistData || manufacturerSlug);
  const hasMeta = Boolean(industry || isStale || (showUpdatedDate && updatedDate) || typeof confidence === "number");

  return (
    <div className="@container relative rounded-xl border border-zinc-200 bg-white p-4 transition focus-within:ring-2 focus-within:ring-blue-200 hover:border-blue-400 hover:shadow-sm">
      <div className="flex items-start gap-3">
        {manufacturerSlug && (
          <span className="hidden pt-0.5 @md:block">
            <BrandLogo slug={manufacturerSlug} name={manufacturerName} size={28} />
          </span>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2">
            <Link
              href={href}
              className="font-mono text-sm font-semibold break-all text-zinc-900 after:absolute after:inset-0 after:rounded-xl focus:outline-none"
            >
              {referenceRaw}
            </Link>
            <span className="text-sm text-zinc-500">{manufacturerName}</span>
          </div>
          <p className="mt-0.5 text-sm text-zinc-700">{name}</p>
          {replacement && (
            <p className="relative z-10 mt-1.5 text-xs text-zinc-600">
              Remplacée par{" "}
              <Link
                href={`/piece/${replacement.manufacturerSlug}/${replacement.slug}`}
                className="font-mono font-semibold text-blue-700 hover:underline"
              >
                {replacement.referenceRaw}
              </Link>
              {replacement.status === "obsolete" && <span className="text-zinc-400"> (obsolète aussi)</span>}
            </p>
          )}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1 text-right">
          <StatusBadge status={status} size="sm" />
          {extras &&
            (extras.minPrice != null ? (
              <span className="text-sm font-semibold whitespace-nowrap text-zinc-900">
                dès {formatPrice(extras.minPrice, extras.currency)}
              </span>
            ) : (
              extras.offerCount === 0 && <span className="text-xs text-zinc-400">Aucune offre</span>
            ))}
          {extras && extras.offerCount > 0 && (
            <span className="text-xs text-zinc-500">{plural(extras.offerCount, "offre")}</span>
          )}
        </div>
      </div>

      {(hasMeta || hasActions) && (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-400">
            {industry && <span className="capitalize">{industry}</span>}
            {showUpdatedDate && updatedDate && <span>Mis à jour le {formatDate(updatedDate)}</span>}
            {isStale && <span className="text-amber-700">Données à vérifier</span>}
            {typeof confidence === "number" && (
              <span
                className={`inline-block rounded-full px-2 py-0.5 font-medium ${
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
          </div>
          {hasActions && (
            <div className="relative z-10 flex items-center gap-1.5">
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
          )}
        </div>
      )}
    </div>
  );
}
