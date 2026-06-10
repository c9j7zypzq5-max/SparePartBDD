import Link from "next/link";
import { SearchBar } from "@/components/search-bar";

export default function NotFound() {
  return (
    <div className="mx-auto mt-12 max-w-xl text-center">
      <div className="rounded-2xl border border-dashed border-zinc-300 p-10">
        <p className="text-5xl font-bold text-zinc-300">404</p>
        <h1 className="mt-4 text-2xl font-bold tracking-tight">
          Page introuvable
        </h1>
        <p className="mt-2 text-zinc-500">
          Cette pièce ou cette page n&apos;existe pas — essayez une recherche
          par référence.
        </p>
        <div className="mt-6 text-left">
          <SearchBar />
        </div>
        <Link
          href="/"
          className="mt-6 inline-block text-sm font-medium text-blue-600 hover:underline"
        >
          ← Retour à l&apos;accueil
        </Link>
      </div>
    </div>
  );
}
