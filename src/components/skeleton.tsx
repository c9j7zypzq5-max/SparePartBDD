export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-zinc-100 ${className}`} />;
}

export function PartCardSkeleton() {
  return (
    <div className="rounded-xl border border-zinc-100 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-3 w-1/3" />
          <Skeleton className="h-4 w-2/3" />
          <div className="flex items-center gap-2 pt-0.5">
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
        <Skeleton className="h-7 w-7 flex-shrink-0 rounded-lg" />
      </div>
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="rounded-xl border border-zinc-200 p-4 space-y-2">
      <Skeleton className="h-7 w-20" />
      <Skeleton className="h-4 w-28" />
    </div>
  );
}

export function TableRowSkeleton({ cols = 5 }: { cols?: number }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <Skeleton className="h-4 w-full" />
        </td>
      ))}
    </tr>
  );
}
