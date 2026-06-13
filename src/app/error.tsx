"use client";

import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto mt-12 max-w-xl text-center">
      <div className="rounded-2xl border border-dashed border-red-200 bg-red-50 p-10">
        <p className="text-5xl font-bold text-red-200">500</p>
        <h1 className="mt-4 text-2xl font-bold tracking-tight text-zinc-900">
          Une erreur est survenue
        </h1>
        <p className="mt-2 text-zinc-600">
          Le service a rencontré un problème temporaire. Cela peut être dû à une
          indisponibilité de la base de données.
        </p>
        {error.digest && (
          <p className="mt-2 font-mono text-xs text-zinc-400">
            Référence : {error.digest}
          </p>
        )}
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button
            onClick={() => reset()}
            className="rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700"
          >
            Réessayer
          </button>
          <Link
            href="/"
            className="rounded-xl border border-zinc-200 bg-white px-6 py-3 font-semibold text-zinc-700 transition hover:border-zinc-400"
          >
            ← Retour à l&apos;accueil
          </Link>
        </div>
      </div>
    </div>
  );
}
