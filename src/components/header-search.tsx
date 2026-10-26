"use client";

import { usePathname } from "next/navigation";
import { SearchBar } from "./search-bar";

/**
 * Recherche compacte de l'en-tête (écrans larges) : chercher une autre
 * référence depuis n'importe quelle page. Masquée là où la page a déjà sa
 * propre barre (accueil, résultats).
 */
export function HeaderSearch() {
  const pathname = usePathname();
  if (pathname === "/" || pathname.startsWith("/recherche")) return null;
  return (
    <div className="hidden min-w-0 flex-1 md:block md:max-w-xs lg:max-w-sm">
      <SearchBar variant="header" shortcut />
    </div>
  );
}
