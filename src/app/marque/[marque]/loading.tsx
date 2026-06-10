// Squelette de chargement d'une page marque.
export default function Loading() {
  return (
    <div className="animate-pulse">
      <div className="h-9 w-2/3 rounded bg-zinc-100" />
      <div className="mt-3 h-5 w-1/2 rounded bg-zinc-100" />
      <div className="mt-6 grid gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-20 rounded-lg bg-zinc-100" />
        ))}
      </div>
    </div>
  );
}
