"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { WatchlistCount } from "@/components/watchlist-count";
import { SearchIcon } from "@/components/icons";

const LINKS = [
  { href: "/marques", label: "Marques", match: ["/marques", "/marque/"] },
  { href: "/categories", label: "Catégories", match: ["/categories", "/categorie/"] },
  { href: "/technicien", label: "Technicien", mobileLabel: "Mode technicien (recherche par lot)", match: ["/technicien"] },
];

function isActive(pathname: string, match: string[]): boolean {
  return match.some((m) => pathname === m || (m.endsWith("/") && pathname.startsWith(m)));
}

export function NavMenu() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Le menu mobile se referme à chaque navigation et sur Échap.
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <>
      {/* Desktop nav */}
      <nav aria-label="Navigation principale" className="ml-auto hidden items-center gap-5 text-sm font-medium text-zinc-600 md:flex">
        {LINKS.map((link) => {
          const active = isActive(pathname, link.match);
          return (
            <Link
              key={link.href}
              href={link.href}
              aria-current={active ? "page" : undefined}
              className={active ? "text-zinc-900 underline decoration-blue-600 decoration-2 underline-offset-8" : "hover:text-zinc-900"}
            >
              {link.label}
            </Link>
          );
        })}
        <WatchlistCount />
      </nav>

      {/* Mobile : recherche et liste toujours visibles + menu */}
      <div className="ml-auto flex items-center gap-1 text-sm font-medium text-zinc-600 md:hidden">
        {!pathname.startsWith("/recherche") && (
          <Link href="/recherche" aria-label="Rechercher" className="p-2 text-zinc-600 hover:text-zinc-900">
            <SearchIcon className="h-5 w-5" />
          </Link>
        )}
        <WatchlistCount />
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="p-2 text-zinc-600 hover:text-zinc-900"
          aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
          aria-expanded={open}
          aria-controls="menu-mobile"
        >
          {open ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile dropdown */}
      {open && (
        <div id="menu-mobile" className="absolute left-0 right-0 top-full border-b border-zinc-200 bg-white shadow-sm md:hidden">
          <nav aria-label="Navigation principale" className="flex flex-col px-4 py-1 text-sm font-medium text-zinc-600">
            {[{ href: "/recherche", label: "Rechercher", match: ["/recherche"] }, ...LINKS, { href: "/liste", label: "Ma liste", match: ["/liste"] }].map(
              (link) => {
                const active = isActive(pathname, link.match);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    aria-current={active ? "page" : undefined}
                    onClick={() => setOpen(false)}
                    className={`border-b border-zinc-100 py-3 last:border-0 ${active ? "text-blue-700" : "hover:text-zinc-900"}`}
                  >
                    {"mobileLabel" in link && link.mobileLabel ? link.mobileLabel : link.label}
                  </Link>
                );
              },
            )}
          </nav>
        </div>
      )}
    </>
  );
}
