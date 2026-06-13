import Link from "next/link";
import { SearchBar } from "@/components/search-bar";

export default function NotFound() {
  return (
    <div className="mx-auto mt-12 max-w-xl text-center">
      <div className="rounded-2xl border border-dashed border-zinc-300 p-10">
        <p className="text-5xl font-bold text-zinc-200">404</p>
        <h1 className="mt-4 text-2xl font-bold tracking-tight">
          Page introuvable
        </h1>
        <p className="mt-2 text-zinc-500">
          Cette pièce ou cette page n&apos;existe pas dans notre catalogue.
          Essayez une recherche par référence — la pièce est peut-être
          enregistrée sous un autre identifiant.
        </p>
        <div className="mt-6 text-left">
          <SearchBar />
        </div>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            href="/"
            className="text-sm font-medium text-blue-600 hover:underline"
          >
            ← Accueil
          </Link>
          <span className="text-zinc-300">·</span>
          <Link
            href="/marques"
            className="text-sm font-medium text-zinc-600 hover:text-zinc-900 hover:underline"
          >
            Toutes les marques
          </Link>
          <span className="text-zinc-300">·</span>
          <Link
            href="/categories"
            className="text-sm font-medium text-zinc-600 hover:text-zinc-900 hover:underline"
          >
            Catégories
          </Link>
        </div>
      </div>
    </div>
  );
}
