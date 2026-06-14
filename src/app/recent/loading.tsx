export default function Loading() {
  return (
    <div className="animate-pulse">
      <div className="mb-6 h-9 w-56 rounded bg-zinc-100" />
      <div className="grid gap-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-20 rounded-lg bg-zinc-100" />
        ))}
      </div>
    </div>
  );
}
