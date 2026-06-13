import Link from "next/link";
import { unstable_cache } from "next/cache";
import { SearchBar } from "@/components/search-bar";
import { BrandLogo } from "@/components/brand-logo";
import { getHomepageData, getRecentSupersessions } from "@/lib/queries";

export const revalidate = 300;

const getCachedHomepageData = unstable_cache(getHomepageData, ["homepage-data"], { revalidate: 300 });
const getCachedRecentSupersessions = unstable_cache(
  () => getRecentSupersessions(4),
  ["recent-supersessions"],
  { revalidate: 300 },
);

export default async function HomePage() {
  let data: Awaited<ReturnType<typeof getHomepageData>> = {
    stats: { partsCount: 0, manufacturersCount: 0, categoriesCount: 0 },
    topManufacturers: [],
    topCategories: [],
  };
  let supersessionRows: Awaited<ReturnType<typeof getRecentSupersessions>> = [];
  try {
    [data, supersessionRows] = await Promise.all([
      getCachedHomepageData(),
      getCachedRecentSupersessions(),
    ]);
  } catch {
    // Base indisponible : la home reste utilisable sans les sections data.
  }

  const { stats, topManufacturers, topCategories } = data;

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
            Le catalogue de référence{" "}
            <span className="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
              pour les pièces industrielles et IT
            </span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-zinc-400">
            Trouvez, comparez et accédez aux revendeurs en quelques secondes.
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

      {/* Chiffres clés */}
      {stats.partsCount > 0 && (
        <section className="relative z-10 -mt-10 mb-12">
          <div className="mx-auto grid max-w-3xl grid-cols-3 gap-3">
            {[
              { value: stats.partsCount.toLocaleString("fr-FR"), label: "références" },
              { value: stats.manufacturersCount.toLocaleString("fr-FR"), label: "marques" },
              { value: stats.categoriesCount.toLocaleString("fr-FR"), label: "catégories" },
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

      {/* Marques populaires */}
      {topManufacturers.length > 0 && (
        <section className="mb-14">
          <h2 className="text-2xl font-bold tracking-tight">Marques populaires</h2>
          <div className="mt-5 grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
            {topManufacturers.map(({ manufacturer: m }) => (
              <Link
                key={m.id}
                href={`/marque/${m.slug}`}
                className="flex flex-col items-center gap-2 rounded-xl border border-zinc-200 p-4 text-center transition hover:border-blue-400 hover:shadow-sm"
              >
                <BrandLogo slug={m.slug} name={m.name} size={40} />
                <span className="text-xs font-medium text-zinc-700">{m.name}</span>
              </Link>
            ))}
          </div>
          <div className="mt-4 text-right">
            <Link href="/marques" className="text-sm text-zinc-500 hover:text-zinc-900">
              Toutes les marques →
            </Link>
          </div>
        </section>
      )}

      {/* Catégories principales */}
      {topCategories.length > 0 && (
        <section className="mb-14">
          <h2 className="text-2xl font-bold tracking-tight">Catégories principales</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {topCategories.map(({ category, partsCount }) => (
              <Link
                key={category.id}
                href={`/categorie/${category.slug}`}
                className="rounded-xl border border-zinc-200 p-4 transition hover:border-blue-400 hover:shadow-sm"
              >
                <div className="font-semibold text-zinc-900">{category.name}</div>
                <div className="mt-1 text-sm text-zinc-500">
                  {partsCount} référence{partsCount > 1 ? "s" : ""} →
                </div>
              </Link>
            ))}
          </div>
          <div className="mt-4 text-right">
            <Link href="/categories" className="text-sm text-zinc-500 hover:text-zinc-900">
              Toutes les catégories →
            </Link>
          </div>
        </section>
      )}

      {/* Remplacements récents */}
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

      {/* CTA Ma liste */}
      <section className="mb-14 rounded-2xl border border-blue-200 bg-blue-50 p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-bold text-zinc-900">Gérez vos références</h2>
            <p className="mt-1 max-w-md text-sm text-zinc-600">
              Constituez votre liste de pièces à surveiller, exportez-la en CSV et
              comparez vos références en un coup d&apos;œil.
            </p>
          </div>
          <Link
            href="/liste"
            className="shrink-0 rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            Voir ma liste →
          </Link>
        </div>
      </section>

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
