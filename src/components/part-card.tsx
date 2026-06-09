import Link from "next/link";
import { StatusBadge } from "./status-badge";

export function PartCard({
  href,
  name,
  referenceRaw,
  manufacturerName,
  status,
  industry,
}: {
  href: string;
  name: string;
  referenceRaw: string;
  manufacturerName: string;
  status: string;
  industry?: string;
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
        <StatusBadge status={status} />
      </div>
    </Link>
  );
}
