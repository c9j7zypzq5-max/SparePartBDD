export default function Loading() {
  return (
    <div className="animate-pulse">
      <div className="mb-6 h-9 w-48 rounded bg-zinc-100" />
      <div className="overflow-hidden rounded-xl border border-zinc-200">
        <div className="h-10 bg-zinc-50" />
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="flex gap-4 border-t border-zinc-100 px-4 py-3">
            <div className="h-5 w-32 rounded bg-zinc-100" />
            <div className="h-5 w-48 rounded bg-zinc-100" />
            <div className="h-5 w-20 rounded bg-zinc-100" />
            <div className="ml-auto h-5 w-24 rounded bg-zinc-100" />
          </div>
        ))}
      </div>
    </div>
  );
}
