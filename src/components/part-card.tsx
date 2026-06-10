import Link from "next/link";
import { StatusBadge } from "./status-badge";

export function PartCard({
  href,
  name,
  referenceRaw,
  manufacturerName,
  status,
  industry,
  confidence,
}: {
  href: string;
  name: string;
  referenceRaw: string;
  manufacturerName: string;
  status: string;
  industry?: string;
  /** Score 0..1 de confiance dans la compatibilité (affiché si fourni) */
  confidence?: number;
}) {
  return (
    <Link
      href={href}
      className="block rounded-lg border border-zinc-200 p-4 transition hover:border-blue-400 hover:shadow-sm"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="font-mono text-sm text-zinc-500">
            {manufacturerName} · {referenceRaw}
          </div>
          <div className="mt-1 font-medium text-zinc-900">{name}</div>
          {industry && (
            <div className="mt-1 text-xs text-zinc-400 capitalize">{industry}</div>
          )}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <StatusBadge status={status} />
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
        </div>
      </div>
    </Link>
  );
}
