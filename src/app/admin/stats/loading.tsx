export default function Loading() {
  return (
    <div className="animate-pulse">
      <div className="mb-6 h-9 w-48 rounded bg-zinc-100" />
      {[1, 2, 3].map((section) => (
        <section key={section} className="mb-8">
          <div className="mb-3 h-4 w-32 rounded bg-zinc-100" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-zinc-200 p-4">
                <div className="h-8 w-20 rounded bg-zinc-100" />
                <div className="mt-2 h-4 w-28 rounded bg-zinc-100" />
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
