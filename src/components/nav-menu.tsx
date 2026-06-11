"use client";

import { useState } from "react";
import Link from "next/link";
import { WatchlistCount } from "@/components/watchlist-count";

export function NavMenu() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Desktop nav */}
      <nav className="hidden md:flex items-center gap-5 text-sm font-medium text-zinc-600">
        <Link href="/marques" className="hover:text-zinc-900">
          Marques
        </Link>
        <Link href="/categories" className="hover:text-zinc-900">
          Catégories
        </Link>
        <Link href="/recherche-lot" className="hover:text-zinc-900">
          Lot
        </Link>
        <WatchlistCount />
        <Link
          href="/recherche?q="
          className="rounded-lg bg-zinc-900 px-3 py-1.5 text-white transition hover:bg-zinc-700"
        >
          Rechercher
        </Link>
      </nav>

      {/* Mobile: watchlist always visible + hamburger */}
      <div className="flex md:hidden items-center gap-3 text-sm font-medium text-zinc-600">
        <WatchlistCount />
        <button
          onClick={() => setOpen((o) => !o)}
          className="p-1.5 text-zinc-600 hover:text-zinc-900"
          aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
          aria-expanded={open}
        >
          {open ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile dropdown */}
      {open && (
        <div className="absolute left-0 right-0 top-full border-b border-zinc-200 bg-white shadow-sm md:hidden">
          <nav className="flex flex-col px-4 py-1 text-sm font-medium text-zinc-600">
            <Link
              href="/marques"
              className="border-b border-zinc-100 py-3 hover:text-zinc-900"
              onClick={() => setOpen(false)}
            >
              Marques
            </Link>
            <Link
              href="/categories"
              className="border-b border-zinc-100 py-3 hover:text-zinc-900"
              onClick={() => setOpen(false)}
            >
              Catégories
            </Link>
            <Link
              href="/recherche-lot"
              className="border-b border-zinc-100 py-3 hover:text-zinc-900"
              onClick={() => setOpen(false)}
            >
              Recherche par lot
            </Link>
            <Link
              href="/recherche?q="
              className="py-3 hover:text-zinc-900"
              onClick={() => setOpen(false)}
            >
              Rechercher
            </Link>
          </nav>
        </div>
      )}
    </>
  );
}
