import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { siteUrl } from "@/lib/site-url";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "SparePartSearch — pièces industrielles et informatiques par référence",
    template: "%s | SparePartSearch",
  },
  description:
    "Entrez une référence Siemens, Schneider, ABB, Rockwell, Cisco, Dell, HPE ou Lenovo : statut de fabrication, remplacement officiel, compatibles, vendeurs et prix.",
  openGraph: {
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
    <html lang="fr">
      <body className="min-h-screen bg-white text-zinc-900 antialiased">
        <header className="sticky top-0 z-30 border-b border-zinc-200 bg-white/90 backdrop-blur">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
            <Link href="/" className="text-lg font-bold tracking-tight">
              SparePart<span className="text-blue-600">Search</span>
            </Link>
            <nav className="flex items-center gap-5 text-sm font-medium text-zinc-600">
              <Link href="/marques" className="hover:text-zinc-900">
                Marques
              </Link>
              <Link
                href="/recherche?q="
                className="rounded-lg bg-zinc-900 px-3 py-1.5 text-white transition hover:bg-zinc-700"
              >
                Rechercher
              </Link>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
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
                  <Link href="/recherche?q=" className="text-zinc-500 hover:text-zinc-900">
                    Recherche
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
