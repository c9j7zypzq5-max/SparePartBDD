import Link from "next/link";
import { SearchBar } from "@/components/search-bar";
import { PartCard } from "@/components/part-card";
import {
  getAllManufacturers,
  getHomeStats,
  getRecentSupersessions,
} from "@/lib/queries";

export const dynamic = "force-dynamic";

const VERTICALES = [
  {
    label: "Industrie",
    description: "Automates, variateurs, contacteurs, IHM, pneumatique — Siemens, Schneider, ABB, Rockwell…",
    example: "6ES7315-2AH14-0AB0",
    icon: "⚙️",
  },
  {
    label: "Informatique",
    description: "Alimentations serveur, modules réseau, SFP, RAID, batteries — Cisco, Dell, HPE, Lenovo…",
    example: "PWR-C1-715WAC",
    icon: "🖥️",
  },
];

export default async function HomePage() {
  let stats = { partsCount: 0, manufacturersCount: 0, offersCount: 0, obsoleteCount: 0 };
  let manufacturers: Awaited<ReturnType<typeof getAllManufacturers>> = [];
  let supersessionRows: Awaited<ReturnType<typeof getRecentSupersessions>> = [];
  try {
    [stats, manufacturers, supersessionRows] = await Promise.all([
      getHomeStats(),
      getAllManufacturers(),
      getRecentSupersessions(4),
    ]);
  } catch {
    // Base indisponible : la home reste utilisable sans les sections data.
  }

  return (
    <div>
      {/* Hero */}
      <section className="relative -mx-4 -mt-8 bg-zinc-950 px-4 pb-20 pt-16 text-center">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            background:
              "radial-gradient(60% 50% at 50% 0%, rgba(37,99,235,0.35), transparent)",
          }}
        />
        <div className="relative mx-auto max-w-3xl">
          <p className="mb-4 inline-block rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1 text-sm font-medium text-blue-300">
            Industrie & Informatique
          </p>
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Une référence.{" "}
            <span className="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
              Toutes les réponses.
            </span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-zinc-400">
            Statut de fabrication, remplacement officiel, pièces compatibles et
            vendeurs — du neuf constructeur à l&apos;occasion.
          </p>
          <div className="mt-8">
            <SearchBar autoFocus large />
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-sm text-zinc-500">
            <span>Essayez :</span>
            {["6SE6440-2UD21-5AA1", "PWR-C1-715WAC", "1756-L61"].map((ref) => (
              <Link
                key={ref}
                href={`/recherche?q=${encodeURIComponent(ref)}`}
                className="rounded-full border border-zinc-700 px-3 py-1 font-mono text-xs text-zinc-300 transition hover:border-blue-500 hover:text-blue-300"
              >
                {ref}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      {stats.partsCount > 0 && (
        <section className="relative z-10 -mt-10 mb-12">
          <div className="mx-auto grid max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { value: stats.partsCount, label: "pièces référencées" },
              { value: stats.manufacturersCount, label: "fabricants" },
              { value: stats.offersCount, label: "offres vendeurs" },
              { value: stats.obsoleteCount, label: "obsolètes tracées" },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-xl border border-zinc-200 bg-white p-4 text-center shadow-sm"
              >
                <div className="text-2xl font-bold text-zinc-900">{s.value}</div>
                <div className="mt-1 text-xs text-zinc-500">{s.label}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Verticales */}
      <section className="mb-14">
        <div className="grid gap-4 sm:grid-cols-2">
          {VERTICALES.map((v) => (
            <Link
              key={v.label}
              href={`/recherche?q=${encodeURIComponent(v.example)}`}
              className="group rounded-2xl border border-zinc-200 p-6 transition hover:border-blue-400 hover:shadow-md"
            >
              <div className="text-3xl">{v.icon}</div>
              <h2 className="mt-3 text-xl font-semibold text-zinc-900 group-hover:text-blue-700">
                {v.label}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-zinc-500">
                {v.description}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* Remplacements */}
      {supersessionRows.length > 0 && (
        <section className="mb-14">
          <h2 className="text-2xl font-bold tracking-tight">
            Pièce obsolète&nbsp;? Voici son remplacement
          </h2>
          <p className="mt-1 text-zinc-500">
            Chaînes de remplacement officielles annoncées par les fabricants.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {supersessionRows.map(({ oldPart, oldManufacturer, newPart }) => (
              <Link
                key={oldPart.id}
                href={`/piece/${oldManufacturer.slug}/${oldPart.slug}`}
                className="rounded-xl border border-zinc-200 p-4 transition hover:border-blue-400 hover:shadow-sm"
              >
                <div className="flex items-center gap-2 text-sm">
                  <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                    Obsolète
                  </span>
                  <span className="truncate font-mono text-zinc-600">
                    {oldManufacturer.name} {oldPart.referenceRaw}
                  </span>
                </div>
                <div className="my-2 text-zinc-400">↓ remplacée par</div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                    Fabriquée
                  </span>
                  <span className="truncate font-mono font-medium text-zinc-900">
                    {newPart.referenceRaw}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Marques */}
      {manufacturers.length > 0 && (
        <section className="mb-10">
          <h2 className="text-2xl font-bold tracking-tight">Parcourir par marque</h2>
          <div className="mt-5 flex flex-wrap gap-2">
            {manufacturers.map((m) => (
              <Link
                key={m.id}
                href={`/marque/${m.slug}`}
                className="rounded-full border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:border-blue-400 hover:text-blue-700"
              >
                {m.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Comment ça marche */}
      <section className="mb-8 rounded-2xl bg-zinc-50 p-8">
        <h2 className="text-2xl font-bold tracking-tight">Comment ça marche</h2>
        <div className="mt-6 grid gap-6 sm:grid-cols-3">
          {[
            {
              step: "1",
              title: "Entrez une référence",
              text: "Avec ou sans tirets et espaces — la recherche tolère les variantes d'écriture et les fautes de frappe.",
            },
            {
              step: "2",
              title: "Vérifiez le statut",
              text: "Encore fabriquée ou obsolète ? Si elle est remplacée, la référence officielle du successeur est affichée.",
            },
            {
              step: "3",
              title: "Comparez les vendeurs",
              text: "Constructeur, distributeur, reconditionné ou occasion : les offres triées par prix, avec disponibilité.",
            },
          ].map((item) => (
            <div key={item.step}>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 font-bold text-white">
                {item.step}
              </div>
              <h3 className="mt-3 font-semibold text-zinc-900">{item.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-zinc-500">{item.text}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
