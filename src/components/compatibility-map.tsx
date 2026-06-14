import Link from "next/link";
import { StatusBadge } from "@/components/status-badge";

type CompatibleItem = {
  confidence: number;
  part: { id: number; name: string; referenceRaw: string; slug: string; status: string };
  manufacturer: { name: string; slug: string };
};

export function CompatibilityMap({
  mainRef,
  mainName,
  mainManufacturer,
  items,
}: {
  mainRef: string;
  mainName: string;
  mainManufacturer: string;
  items: CompatibleItem[];
}) {
  return (
    <div className="mt-3">
      {/* Hub */}
      <div className="flex items-center gap-3 rounded-lg border-2 border-blue-300 bg-blue-50 px-4 py-3">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-500 text-white text-xs font-bold">
          ★
        </div>
        <div className="min-w-0">
          <div className="font-mono text-sm font-semibold text-blue-800">
            {mainManufacturer} · {mainRef}
          </div>
          <div className="truncate text-xs text-blue-600">{mainName}</div>
        </div>
      </div>

      {/* Spokes */}
      <div className="ml-3 mt-1 space-y-1.5 border-l-2 border-dashed border-zinc-200 pl-5">
        {items.map(({ confidence, part: p, manufacturer: m }) => {
          const pct = Math.round(confidence * 100);
          const barColor =
            confidence >= 0.7
              ? "bg-green-500"
              : confidence >= 0.5
                ? "bg-amber-400"
                : "bg-zinc-400";
          const labelColor =
            confidence >= 0.7
              ? "text-green-700 bg-green-100"
              : confidence >= 0.5
                ? "text-amber-700 bg-amber-100"
                : "text-zinc-600 bg-zinc-100";

          return (
            <div key={p.id} className="flex items-center gap-3">
              {/* Confidence indicator */}
              <div className={`flex shrink-0 items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-semibold ${labelColor}`}>
                <div className="flex h-1.5 w-10 overflow-hidden rounded-full bg-white/60">
                  <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
                </div>
                {pct}%
              </div>

              {/* Part card */}
              <Link
                href={`/piece/${m.slug}/${p.slug}`}
                className="min-w-0 flex-1 rounded-lg border border-zinc-200 px-3 py-2 text-sm transition hover:border-blue-400 hover:shadow-sm"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <span className="font-mono text-xs text-zinc-500">
                      {m.name} · {p.referenceRaw}
                    </span>
                    <div className="truncate font-medium text-zinc-900">{p.name}</div>
                  </div>
                  <StatusBadge status={p.status} />
                </div>
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
