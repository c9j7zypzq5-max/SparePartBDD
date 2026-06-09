# SparePartSearch — moteur de recherche de pièces détachées

Squelette MVP d'un moteur de recherche mondial de pièces détachées
multi-industries (automobile, électroménager, industrie, HVAC, électronique).

L'utilisateur entre une **référence OEM** (ex : `Bosch 00754870`,
`BMW 11427953129`, `Siemens 6ES7214-1AG40-0XB0`) ou un nom de pièce, et
obtient :

1. la pièce exacte correspondante ;
2. son **statut** : encore fabriquée / obsolète ;
3. les **références de remplacement** officielles (chaîne de supersession) ;
4. les **pièces compatibles** alternatives ;
5. les **vendeurs** (constructeur, distributeur officiel, aftermarket,
   reconditionné, occasion) avec prix et disponibilité.

## Stack

- **Next.js 15** (App Router, TypeScript, Tailwind CSS 4) — SSR pour le SEO
  programmatique
- **PostgreSQL 16** + **Drizzle ORM**
- **Recherche** : full-text Postgres (`websearch_to_tsquery`) + similarité
  trigram (`pg_trgm`) sur les références normalisées, derrière une interface
  `SearchService` (`src/lib/search/search-service.ts`) — remplaçable par
  Meilisearch/Typesense sans toucher aux pages.

## Démarrage local

```bash
# 1. Dépendances
npm install

# 2. Base de données
createdb sparepart
cp .env.example .env   # ajuster DATABASE_URL si besoin

# 3. Schéma + données de démonstration (~20 pièces, 5 industries)
npm run db:push
npm run seed

# 4. Lancer
npm run dev
```

Puis tester : `http://localhost:3000`, recherche `00754870` (pompe Bosch),
`11427511161` (filtre BMW obsolète → remplacement affiché), ou
`filtre à huile`.

## Structure

```
src/
├── app/
│   ├── page.tsx                      # home : barre de recherche
│   ├── recherche/                    # résultats (noindex)
│   ├── piece/[marque]/[ref]/         # page pièce = page SEO clé (JSON-LD Product)
│   ├── marque/[marque]/              # hub marque (maillage interne)
│   ├── categorie/[slug]/             # hub catégorie
│   ├── sitemap.ts                    # sitemap dynamique
│   └── robots.ts
├── db/schema.ts                      # modèle de données (voir ci-dessous)
├── lib/
│   ├── normalize.ts                  # normalisation des références
│   ├── queries.ts                    # requêtes des pages
│   └── search/                       # SearchService + implémentation Postgres
└── components/
scripts/
├── seed.ts                           # données de démo
└── ingest/adapter.ts                 # interface SourceAdapter (pipeline d'ingestion)
```

## Modèle de données

| Table | Rôle |
|---|---|
| `manufacturers` | Marques, rattachées à une industrie |
| `categories` | Arbre de catégories par industrie |
| `parts` | Pièce = fabricant + référence normalisée ; statut `active/obsolete/unknown` |
| `part_references` | Cross-références (OEM alternatives, aftermarket, EAN, MPN) |
| `supersessions` | Chaîne de remplacement officielle (ancienne réf → nouvelle réf) |
| `compatibilities` | Compatibles non officiels, avec score de confiance |
| `sellers` | Vendeurs typés (constructeur → occasion) |
| `offers` | Offre vendeur × pièce : prix, devise, dispo, URL, date de relevé |

Clé de voûte : la **référence normalisée** (`normalizeReference` :
majuscules, alphanumérique seul) sert de clé de matching entre sources —
`11 42 7 953 129`, `11-42-7953129` et `11427953129` désignent la même pièce.

## Ingestion de données

Chaque source (catalogue fabricant, API marketplace, flux d'affiliation)
implémente l'interface `SourceAdapter` (`scripts/ingest/adapter.ts`) qui
produit des `RawPart` / `RawOffer` normalisés. Le pipeline d'upsert et de
dédoublonnage sera ajouté avec la première vraie source.

## Roadmap (extrait)

- [ ] Première vraie source de données (flux affilié + API eBay Browse)
- [ ] Sitemaps shardés (> 50 000 URLs) générés hors ligne
- [ ] Meilisearch en remplacement de la recherche Postgres
- [ ] Pages multilingues (`/en/part/...`) avec hreflang
- [ ] Recherche par photo (post-MVP)

⚠️ Les données du seed sont des **données de démonstration** : réalistes
dans leur forme, mais non garanties exactes.
