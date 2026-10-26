import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { siteUrl } from "@/lib/site-url";
import { NavMenu } from "@/components/nav-menu";
import { HeaderSearch } from "@/components/header-search";
import { CompareBar } from "@/components/compare-bar";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "SparePartSearch — pièces industrielles et informatiques par référence",
    template: "%s | SparePartSearch",
  },
  description:
    "Entrez une référence Siemens, Schneider, ABB, Rockwell, Cisco, Dell, HPE ou Lenovo : statut de fabrication, remplacement officiel, compatibles, vendeurs et prix.",
  openGraph: {
    url: siteUrl,
    type: "website",
    locale: "fr_FR",
    siteName: "SparePartSearch",
    title: "SparePartSearch — pièces industrielles et informatiques par référence",
    description:
      "Entrez une référence Siemens, Schneider, ABB, Rockwell, Cisco, Dell, HPE ou Lenovo : statut de fabrication, remplacement officiel, compatibles, vendeurs et prix.",
  },
  twitter: { card: "summary_large_image" },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className="overflow-x-hidden">
      <body className="flex min-h-screen flex-col overflow-x-hidden bg-white text-zinc-900 antialiased">
        <a
          href="#contenu"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:shadow-lg"
        >
          Aller au contenu
        </a>
        <header className="sticky top-0 z-30 border-b border-zinc-200 bg-white/90 backdrop-blur">
          <div className="relative mx-auto flex max-w-5xl items-center gap-4 px-4 py-2.5">
            <Link href="/" className="shrink-0 text-lg font-bold tracking-tight">
              SparePart<span className="text-blue-600">Search</span>
            </Link>
            <HeaderSearch />
            <NavMenu />
          </div>
        </header>
        <main id="contenu" tabIndex={-1} className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 pb-24 focus:outline-none">
          {children}
        </main>
        <CompareBar />
        <footer className="mt-12 border-t border-zinc-200 bg-zinc-50">
          <div className="mx-auto grid max-w-5xl gap-8 px-4 py-10 sm:grid-cols-3">
            <div>
              <div className="text-base font-bold">
                SparePart<span className="text-blue-600">Search</span>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-zinc-500">
                Le moteur de recherche des pièces détachées industrielles et
                informatiques : statut de fabrication, remplacements officiels
                et comparaison des vendeurs.
              </p>
            </div>
            <div>
              <div className="text-sm font-semibold text-zinc-900">Verticales</div>
              <ul className="mt-2 space-y-1 text-sm text-zinc-500">
                <li>Industrie — automatisme & MRO</li>
                <li>Informatique — serveurs & réseau</li>
              </ul>
            </div>
            <div>
              <div className="text-sm font-semibold text-zinc-900">Navigation</div>
              <ul className="mt-2 space-y-1 text-sm">
                <li>
                  <Link href="/marques" className="text-zinc-500 hover:text-zinc-900">
                    Toutes les marques
                  </Link>
                </li>
                <li>
                  <Link href="/categories" className="text-zinc-500 hover:text-zinc-900">
                    Toutes les catégories
                  </Link>
                </li>
                <li>
                  <Link href="/recherche" className="text-zinc-500 hover:text-zinc-900">
                    Recherche
                  </Link>
                </li>
                <li>
                  <Link href="/liste" className="text-zinc-500 hover:text-zinc-900">
                    Ma liste
                  </Link>
                </li>
                <li>
                  <Link href="/technicien" className="text-zinc-500 hover:text-zinc-900">
                    Mode technicien
                  </Link>
                </li>
                <li>
                  <Link href="/recent" className="text-zinc-500 hover:text-zinc-900">
                    Récemment mis à jour
                  </Link>
                </li>
                <li>
                  <Link href="/vendeurs" className="text-zinc-500 hover:text-zinc-900">
                    Revendeurs
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-zinc-200 py-4 text-center text-xs text-zinc-400">
            SparePartSearch — données de démonstration (MVP)
          </div>
        </footer>
      </body>
    </html>
  );
}
