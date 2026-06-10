import Link from "next/link";
import { SearchBar } from "@/components/search-bar";

const INDUSTRIES = [
  { slug: "industrie", label: "Industrie", example: "Siemens 6ES7214-1AG40-0XB0" },
  { slug: "informatique", label: "Informatique", example: "Cisco PWR-C1-715WAC" },
  { slug: "automobile", label: "Automobile", example: "BMW 11427953129" },
  { slug: "electromenager", label: "Électroménager", example: "Bosch 00754870" },
  { slug: "hvac", label: "HVAC", example: "Daikin 5021205" },
  { slug: "electronique", label: "Électronique", example: "Samsung BN44-00932B" },
];

export default function HomePage() {
  return (
    <div className="mx-auto max-w-3xl py-12 text-center">
      <h1 className="text-4xl font-bold tracking-tight">
        Le moteur de recherche des pièces détachées
      </h1>
      <p className="mt-4 text-lg text-zinc-600">
        Entrez une référence OEM ou un nom de pièce. Obtenez la pièce exacte,
        son statut de fabrication, ses remplacements officiels, ses
        compatibles et les vendeurs qui la proposent.
      </p>
      <div className="mt-8">
        <SearchBar autoFocus />
      </div>
      <div className="mt-12 grid grid-cols-1 gap-3 text-left sm:grid-cols-2 lg:grid-cols-3">
        {INDUSTRIES.map((industry) => (
          <Link
            key={industry.slug}
            href={`/recherche?q=${encodeURIComponent(industry.example)}`}
            className="rounded-lg border border-zinc-200 p-4 hover:border-blue-400"
          >
            <div className="font-medium">{industry.label}</div>
            <div className="mt-1 font-mono text-xs text-zinc-500">
              ex : {industry.example}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
