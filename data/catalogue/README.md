# Catalogue étendu

Références réelles saisies à la main, gamme par gamme, dans `scripts/catalog/data/*.ts`,
puis contrôlées et exportées par `npm run catalog:build` dans `data/catalogue/<édition>/`.
Les fichiers de ce dossier sont générés : on modifie les données sources, pas les sorties.

## Édition 2026-10

1 716 pièces qui s'ajoutent aux 265 du catalogue de démonstration (`neon-catalog.sql`),
sans en modifier aucune :

| | |
|---|---|
| Fabricants | 25 (dont 12 nouveaux : Mitsubishi Electric, Beckhoff, WAGO, Eaton, APC, Fortinet, Synology, Seagate, Western Digital, Samsung, Kingston, Crucial) |
| Industrie | Siemens 190, Schneider Electric 221, Rockwell Automation 168, Mitsubishi Electric 143, ABB 112, Omron 83, Eaton 54, WAGO 50, Beckhoff 40, Phoenix Contact 38, Keysight 36, Fluke 30, Festo 24, SMC 17 |
| Informatique | Cisco 143, APC 73, Samsung 47, Juniper Networks 45, HPE 40, Western Digital 36, Kingston 33, Synology 28, Fortinet 26, Seagate 20, Crucial 19 |
| Statuts | 1 151 fabriquées, 457 obsolètes, 108 inconnus |
| Relations | 319 remplacements officiels, 68 cross-références (désignations constructeur) |
| Catégories | 9 nouvelles : disjoncteurs et protection moteur, boutons et signalisation, bornes et connectique, servovariateurs et servomoteurs, onduleurs, batteries d'onduleur, points d'accès Wi-Fi, NAS et stockage réseau, SSD et disques durs |

Règles de saisie (voir `scripts/catalog/lib.ts`) :

- uniquement des références dont l'existence est connue avec certitude ;
- statut `unknown` quand le cycle de vie n'est pas établi, plutôt qu'une affirmation ;
- aucun prix ni offre : rien n'a été relevé chez un vendeur ;
- aucune URL produit : la veille hebdomadaire classe une pièce obsolète si son URL répond 404,
  une URL approximative fausserait le statut ;
- confiance sous 60 (22 pièces : Omron 3G3JX, Mitsubishi FX3U et Q de première génération,
  Eaton easy500/700) pour les fins de vie à confirmer : elles apparaissent dans `/admin/review`.

Les remplacements pointent vers le successeur conseillé par le fabricant ; une chaîne peut
aboutir à une pièce de statut inconnu (`npm run catalog:build` liste ces cas).

## Charger le catalogue

Les trois voies produisent exactement le même contenu (vérifié sur une copie locale de la
production : 265 → 1 981 pièces, 64 → 383 remplacements, 46 → 114 cross-références).

### 1. Script SQL — utilisable dès maintenant sur la production actuelle

`2026-10/catalogue.sql` n'ajoute que ce qui manque (`ON CONFLICT DO NOTHING`), dans une
transaction, et ne supprime ni ne modifie aucune ligne : on peut le relancer sans risque.
Il fonctionne avec le schéma déjà en production, sans déploiement préalable.

- Console Neon : *SQL Editor*, coller le contenu du fichier, *Run* ;
- ou en ligne de commande :
  `psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f data/catalogue/2026-10/catalogue.sql`

Contrôle après chargement :

```sql
SELECT count(*) FROM parts;          -- 1981 si la base contenait les 265 pièces de démonstration
SELECT count(*) FROM supersessions;  -- 383
```

### 2. API d'ingestion — après déploiement du nouveau pipeline

Une fois la branche fusionnée et déployée, envoyer les lots dans l'ordre (un remplacement est
toujours dans le même lot que la pièce remplacée ou dans un lot précédent) :

```bash
export INGEST_URL=https://spare-part-bdd.vercel.app INGEST_API_KEY=…   # clé du projet Vercel
for f in data/catalogue/2026-10/lot-0*.json; do npm run push -- "$f"; done
```

Ne pas utiliser cette voie avant le déploiement : l'ancien pipeline ne relie que les pièces
d'un même lot, et ignorerait sans message les remplacements vers une pièce déjà en base ou
envoyée dans un autre lot.

### 3. Chargement direct

Depuis un poste qui a accès à la base : `DATABASE_URL=… npm run catalog:load`
(même pipeline que l'API, lot par lot, relançable).

## Faire évoluer le catalogue

1. Modifier ou compléter `scripts/catalog/data/<marque>.ts` (une gamme = un appel à `family()`).
2. `npm run catalog:build` : contrôles (doublons de référence normalisée, remplacements et
   compatibles introuvables, cycles, cross-références déjà prises, pièces déjà en base),
   puis régénération des lots et du script SQL. Rien n'est écrit s'il reste une erreur.
3. `npm test` rejoue ces contrôles sur tout le catalogue (`tests/unit/catalogue.test.ts`).

Limite connue : la normalisation retire la ponctuation, si bien que `MS116-1.6` et `MS116-16`
(ou `PKZM0-1,6` et `PKZM0-16`) deviennent la même référence. Les calibres concernés ont été
omis plutôt que de créer une fiche ambiguë.

## Points à vérifier dans le catalogue de démonstration

Repérés en croisant les deux catalogues ; non corrigés ici, à confirmer sur les fiches
constructeur :

- Phoenix Contact `2904621` est nommé « QUINT4-PS/1AC/24DC/20 » : ce numéro correspond
  normalement à la QUINT4-PS/3AC/24DC/10 ; la 1AC/24DC/20 est le `2904602` (ajouté ici).
- Phoenix Contact `2967060` est nommé « PLC-RSC-24DC/21 » (1 inverseur) : ce numéro correspond
  normalement au PLC-RSC- 24DC/21-21 (2 inverseurs) ; le 1 inverseur est le `2966171` (ajouté ici).
- Omron `MY2N-GS 24VDC` et `G2R-1-SND 24DC` ne suivent pas l'écriture constructeur
  (`MY2N-GS DC24`, `G2R-1-SND DC24`) : une recherche par l'écriture officielle ne les trouve
  pas en correspondance exacte.
