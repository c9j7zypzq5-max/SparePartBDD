// Squelette de chargement d'une page pièce.
export default function Loading() {
  return (
    <div className="animate-pulse">
      <div className="h-4 w-48 rounded bg-zinc-100" />
      <div className="mt-4 h-9 w-2/3 rounded bg-zinc-100" />
      <div className="mt-3 h-5 w-1/2 rounded bg-zinc-100" />
      <div className="mt-6 space-y-2">
        <div className="h-4 w-full max-w-3xl rounded bg-zinc-100" />
        <div className="h-4 w-5/6 max-w-3xl rounded bg-zinc-100" />
      </div>
      <div className="mt-8 h-40 rounded-2xl bg-zinc-100" />
      <div className="mt-8 h-40 rounded-2xl bg-zinc-100" />
    </div>
  );
}
