// Squelette de chargement de la page de recherche.
export default function Loading() {
  return (
    <div className="animate-pulse">
      <div className="h-14 rounded-xl bg-zinc-100" />
      <div className="mt-5 flex gap-2">
        <div className="h-8 w-20 rounded-full bg-zinc-100" />
        <div className="h-8 w-24 rounded-full bg-zinc-100" />
        <div className="h-8 w-28 rounded-full bg-zinc-100" />
      </div>
      <div className="mt-4 grid gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-20 rounded-lg bg-zinc-100" />
        ))}
      </div>
    </div>
  );
}
