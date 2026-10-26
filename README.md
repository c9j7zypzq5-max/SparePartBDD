# SparePartSearch — moteur de recherche de pièces détachées

Squelette MVP d'un moteur de recherche mondial de pièces détachées
multi-industries. **Verticales prioritaires du lancement : industrie
(automatisme, MRO) et informatique (serveurs, réseau, PC)** — automobile,
électroménager, HVAC et électronique suivront.

L'utilisateur entre une **référence OEM** (ex : `Siemens 6ES7214-1AG40-0XB0`,
`Cisco PWR-C1-715WAC`, `Bosch 00754870`) ou un nom de pièce, et obtient :

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
- **Recherche** : full-text Postgres (`websearch_to_tsquery` sur une
  expression indexée en GIN) + correspondance exacte / préfixe /
  similarité trigramme (`pg_trgm`, index GIN) sur les références normalisées,
  derrière une interface `SearchService` (`src/lib/search/search-service.ts`)
  — remplaçable par Meilisearch/Typesense sans toucher aux pages.

## Démarrage local

```bash
# 1. Dépendances
npm install

# 2. Base de données (l'extension pg_trgm doit exister AVANT db:push : les
#    index de recherche en dépendent)
createdb sparepart
psql sparepart -c "CREATE EXTENSION IF NOT EXISTS pg_trgm;"
cp .env.example .env   # ajuster DATABASE_URL si besoin

# 3. Schéma + données de démonstration (~30 pièces, 6 industries)
npm run db:push
npm run seed

# 4. Lancer
npm run dev
```

### Vérifications

```bash
npm run typecheck          # TypeScript
npm test                   # tests unitaires (sans base)

# Tests d'intégration : base dédiée, VIDÉE par les tests (nom contenant « test »)
createdb sparepart_test
psql sparepart_test -c "CREATE EXTENSION IF NOT EXISTS pg_trgm;"
DATABASE_URL=postgres://localhost:5432/sparepart_test npm run db:push
TEST_DATABASE_URL=postgres://localhost:5432/sparepart_test npm run test:integration
```

La CI GitHub Actions (`.github/workflows/ci.yml`) exécute typecheck, tests
unitaires, tests d'intégration sur Postgres 16 et build à chaque push sur
`main` et sur chaque pull request.

Puis tester : `http://localhost:3000`, recherche `PWR-C1-715WAC`
(alimentation Cisco en fin de vie → successeur affiché),
`6SE6440-2UD21-5AA1` (variateur Siemens obsolète → SINAMICS G120C), ou
`filtre à huile`.

## Déploiement Vercel + Neon (PostgreSQL managé)

### 1. Base de données (Neon — tier gratuit suffisant pour le démarrage)

1. Créer un compte sur [neon.tech](https://neon.tech) (ou via Vercel Marketplace)
2. Créer un projet, copier la connection string (format
   `postgres://user:pass@host.neon.tech/dbname?sslmode=require`)
3. Activer l'extension pg_trgm dans la console Neon :
   ```sql
   CREATE EXTENSION IF NOT EXISTS pg_trgm;
   ```

### 2. Déploiement Vercel

```bash
# Dans le tableau de bord Vercel → New Project → importer le dépôt GitHub
# Puis dans Settings → Environment Variables, ajouter :
#   DATABASE_URL     = <connection string Neon>
#   NEXT_PUBLIC_SITE_URL = https://ton-domaine.vercel.app
#   INGEST_API_KEY   = <clé secrète aléatoire — voir ci-dessous>
#   ADMIN_PASSWORD   = <mot de passe des pages /admin (HTTP Basic, utilisateur
#                       ADMIN_USER, « admin » par défaut)>
```

Sans `ADMIN_PASSWORD`, les pages `/admin/*` répondent 404 en production.

Générer une clé API pour l'ingestion :
```bash
openssl rand -hex 32
```

### 3. Initialiser (ou mettre à jour) le schéma sur Neon

```bash
DATABASE_URL="postgres://..." npm run db:push
```

`db:push` crée aussi les index de recherche (GIN trigramme et plein texte) :
sur un gros catalogue, la première exécution peut prendre quelques secondes.
Le schéma n'ajoute aucune colonne : le code fonctionne aussi avant la
migration (les index ne font qu'accélérer la recherche).

### 4. Pousser tes données depuis le Mac mini

```bash
INGEST_API_KEY=ta_cle \
INGEST_URL=https://ton-domaine.vercel.app \
npx tsx scripts/ingest/push.ts mon-batch.json
```

---

## Pipeline d'ingestion Ollama (Mac mini → Vercel)

Le endpoint `POST /api/ingest` (protégé par `INGEST_API_KEY`) accepte un JSON
au format `IngestPayload` et upserte les pièces en base.

### Workflow

1. Copier `scripts/ingest/prompt-template.md` et remplir la liste de références
2. Lancer les sessions Ollama sur le Mac mini (en parallèle si besoin)
3. Sauvegarder la réponse JSON dans un fichier
4. Envoyer le fichier à l'API :

```bash
# Variables d'environnement à définir une fois
export INGEST_API_KEY=ta_cle_secrete
export INGEST_URL=https://ton-domaine.vercel.app   # ou http://localhost:3000

# Envoyer un batch
npm run push -- scripts/ingest/mon-batch.json
# ou directement :
npx tsx scripts/ingest/push.ts scripts/ingest/mon-batch.json
```

### Format JSON attendu (IngestPayload)

```json
{
  "source": "ollama-batch-001",
  "parts": [
    {
      "manufacturer": "Siemens",
      "industry": "industrie",
      "reference": "6ES7214-1AG31-0XB0",
      "name": "CPU S7-1200 1214C DC/DC/DC (gen. 1)",
      "status": "obsolete",
      "supersededBy": "6ES7214-1AG40-0XB0",
      "offers": [
        {
          "sellerName": "Radwell",
          "sellerType": "reconditionne",
          "price": 420,
          "currency": "USD",
          "availability": "Garanti 2 ans",
          "url": "https://www.radwell.com/..."
        }
      ]
    }
  ]
}
```

Voir `scripts/ingest/prompt-template.md` pour le prompt complet à donner à
Ollama et les instructions de parallélisation.

### Mise à jour d'une pièce existante

Une pièce est identifiée par fabricant + référence normalisée. Ré-ingérer une
pièce **complète sans jamais effacer** :

- un champ absent ou vide (`description`, `category`, `attributes`, `specs`,
  URLs, score) conserve la valeur en base ;
- `status` n'est appliqué que s'il vaut `active` ou `obsolete`, et jamais si
  la veille hebdomadaire a tranché sur preuve (page 404, mention
  « discontinued »…) ;
- une offre sans prix met à jour le lien mais garde le dernier prix relevé ;
- fabricants, catégories et vendeurs gardent le nom de leur première création.

La réponse contient `errors` (pièces rejetées → HTTP 207) et `warnings`
(relations ignorées, ex. remplacement absent du catalogue). Les
`supersededBy` / `compatibleWith` sont résolus dans le lot **ou** parmi les
pièces déjà en base. 500 pièces maximum par appel.

---

## Surveillance hebdomadaire du cycle de vie (Mac mini)

Principe économique : la fiche complète d'une pièce n'est générée **qu'une
fois** (pipeline d'ingestion ci-dessus, avec le champ `productUrl` = page
produit officielle du fabricant). Ensuite, un job hebdomadaire léger
re-vérifie seulement « est-ce toujours fabriqué/commercialisé ? » en
visitant cette URL — sans LLM, sauf pour trancher les cas ambigus.

### Endpoints (auth `Authorization: Bearer $INGEST_API_KEY`)

- `GET /api/lifecycle/pending?limit=200` — pièces dues pour un contrôle
  (`productUrl` renseignée, non obsolètes, jamais contrôlées ou contrôlées
  il y a plus de 7 jours).
- `POST /api/lifecycle/report` — applique le rapport selon la politique :

| Verdict du script | Statut | À vérifier | Re-tenté au prochain run |
|---|---|---|---|
| `active` (page vivante, prix, panier…) | → fabriquée | non | dans 7 j |
| `obsolete` (HTTP 404/410 ou mention « discontinued / phase-out »…) | → obsolète | non | non (état terminal) |
| `ambiguous` (aucun signal fiable) | inchangé | **oui** | dans 7 j |
| `error` (timeout, 5xx, anti-bot) | inchangé | non | **dès le prochain run** |

### Lancer le contrôle depuis le Mac mini

```bash
INGEST_URL=https://ton-domaine.vercel.app \
INGEST_API_KEY=ta_cle \
OLLAMA_MODEL=qwen2.5:14b \
npm run lifecycle
```

`OLLAMA_MODEL` est optionnel : sans lui, les pages sans signal clair sont
simplement marquées « à vérifier ». Planification cron (tous les lundis 7 h) :

```cron
0 7 * * 1 cd $HOME/SparePartBDD && INGEST_URL=https://ton-domaine.vercel.app INGEST_API_KEY=ta_cle OLLAMA_MODEL=qwen2.5:14b npm run lifecycle >> $HOME/lifecycle.log 2>&1
```

> Si le Mac mini est en veille à cette heure-là, préférer un agent `launchd`
> (clé `StartCalendarInterval`), qui rattrape les exécutions manquées au réveil.

---

## Structure

```
src/
├── app/
│   ├── page.tsx                      # home : barre de recherche
│   ├── recherche/                    # résultats (noindex)
│   ├── piece/[marque]/[ref]/         # page pièce = page SEO clé (JSON-LD Product)
│   ├── marque/[marque]/              # hub marque (maillage interne)
│   ├── categorie/[slug]/             # hub catégorie
│   ├── api/ingest/route.ts           # POST /api/ingest — pipeline Ollama
│   ├── sitemap.ts                    # sitemap dynamique
│   └── robots.ts
├── db/schema.ts                      # modèle de données (voir ci-dessous)
├── lib/
│   ├── normalize.ts                  # normalisation des références
│   ├── ingest-types.ts               # contrat IngestPayload / IngestPart + enums
│   ├── ingest-validation.ts          # validation des lots reçus
│   ├── ingest-pipeline.ts            # logique d'upsert (2 passes, non destructive)
│   ├── queries.ts                    # requêtes des pages
│   ├── api-auth.ts / rate-limit.ts   # clé API, limitation de débit
│   └── search/                       # SearchService, analyse de requête, Postgres
└── components/
scripts/
├── seed.ts                           # données de démo
├── generate-catalog-sql.py           # génère neon-catalog.sql (265 pièces)
├── lifecycle/check.ts                # veille hebdomadaire (Mac mini)
└── ingest/
    ├── accumulate.ts                 # enrichissement continu (Ollama / Gemini)
    ├── adapter.ts                    # interface SourceAdapter (sources futures)
    ├── push.ts                       # CLI : envoie un fichier JSON à /api/ingest
    └── prompt-template.md            # prompt Ollama à copier-coller
tests/
├── unit/                             # fonctions pures (npm test)
└── integration/                      # Postgres réel (npm run test:integration)
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

Toutes les sources passent par `POST /api/ingest` (`src/lib/ingest-pipeline.ts`,
validation dans `src/lib/ingest-validation.ts`). L'interface `SourceAdapter`
(`scripts/ingest/adapter.ts`) décrit le contrat d'une future source
automatisée (catalogue fabricant, API marketplace, flux d'affiliation).

Un audit complet du projet et la feuille de route technique sont dans
[`docs/audit-2026-10.md`](docs/audit-2026-10.md).

## Roadmap (extrait)

- [ ] Industrie : ingestion des statuts de cycle de vie fabricants
      (phase-out/successeurs Siemens, Schneider, ABB)
- [ ] Informatique : adapter Cisco EoX (End-of-Life API) pour les statuts
      EOL/EOS et références de remplacement
- [ ] Première source d'offres (API eBay Browse + flux affiliés)
- [ ] Sitemaps shardés (> 50 000 URLs) générés hors ligne
- [ ] Meilisearch en remplacement de la recherche Postgres
- [ ] Pages multilingues (`/en/part/...`) avec hreflang
- [ ] Recherche par photo (post-MVP)

⚠️ Les données du seed sont des **données de démonstration** : réalistes
dans leur forme, mais non garanties exactes.
