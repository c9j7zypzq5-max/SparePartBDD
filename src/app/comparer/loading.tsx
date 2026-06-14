export default function Loading() {
  return (
    <div className="animate-pulse">
      <div className="mb-6 h-9 w-40 rounded bg-zinc-100" />
      <div className="overflow-x-auto rounded-xl border border-zinc-200">
        <div className="min-w-full">
          <div className="flex gap-4 bg-zinc-50 px-4 py-3">
            <div className="h-5 w-24 rounded bg-zinc-200" />
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-5 flex-1 rounded bg-zinc-200" />
            ))}
          </div>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex gap-4 border-t border-zinc-100 px-4 py-3">
              <div className="h-5 w-24 rounded bg-zinc-100" />
              {Array.from({ length: 3 }).map((_, j) => (
                <div key={j} className="h-5 flex-1 rounded bg-zinc-100" />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
