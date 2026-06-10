"use client";

// Garde-fou global : affiché si une page plante (base indisponible, bug…).
export default function Error({
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="mx-auto mt-12 max-w-xl text-center">
      <div className="rounded-2xl border border-dashed border-zinc-300 p-10">
        <p className="text-5xl">⚠️</p>
        <h1 className="mt-4 text-2xl font-bold tracking-tight">
          Une erreur est survenue
        </h1>
        <p className="mt-2 text-zinc-500">
          Le service a rencontré un problème temporaire. Réessayez dans un
          instant.
        </p>
        <button
          onClick={() => reset()}
          className="mt-6 rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700"
        >
          Réessayer
        </button>
      </div>
    </div>
  );
}
