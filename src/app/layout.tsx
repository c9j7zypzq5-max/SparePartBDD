import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "SparePart — moteur de recherche de pièces détachées",
    template: "%s | SparePart",
  },
  description:
    "Entrez une référence OEM et trouvez la pièce exacte, son statut de fabrication, ses remplacements officiels, ses compatibles et les vendeurs qui la proposent.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className="min-h-screen bg-white text-zinc-900 antialiased">
        <header className="border-b border-zinc-200">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
            <Link href="/" className="text-lg font-bold tracking-tight">
              SparePart<span className="text-blue-600">Search</span>
            </Link>
            <nav className="text-sm text-zinc-500">
              <Link href="/recherche?q=" className="hover:text-zinc-900">
                Recherche
              </Link>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
        <footer className="border-t border-zinc-200 py-6 text-center text-xs text-zinc-400">
          SparePartSearch — données de démonstration (MVP)
        </footer>
      </body>
    </html>
  );
}
