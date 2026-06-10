-- ============================================================
-- SparePartSearch — setup complet pour Neon
-- À coller dans le SQL Editor de Neon et exécuter en une fois.
-- Crée l'extension, les types, les 8 tables, les index,
-- puis insère les ~30 pièces de démonstration.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TYPE "public"."industry" AS ENUM('industrie', 'informatique', 'automobile', 'electromenager', 'hvac', 'electronique');
CREATE TYPE "public"."part_status" AS ENUM('active', 'obsolete', 'unknown');
CREATE TYPE "public"."reference_type" AS ENUM('oem', 'aftermarket', 'ean', 'mpn');
CREATE TYPE "public"."seller_type" AS ENUM('constructeur', 'distributeur_officiel', 'aftermarket', 'reconditionne', 'occasion');
CREATE TABLE "categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"industry" "industry" NOT NULL,
	"parent_id" integer
);

CREATE TABLE "compatibilities" (
	"id" serial PRIMARY KEY NOT NULL,
	"part_id" integer NOT NULL,
	"compatible_part_id" integer NOT NULL,
	"confidence" real DEFAULT 0.5 NOT NULL,
	"source" text
);

CREATE TABLE "manufacturers" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"industry" "industry" NOT NULL,
	"website" text
);

CREATE TABLE "offers" (
	"id" serial PRIMARY KEY NOT NULL,
	"part_id" integer NOT NULL,
	"seller_id" integer NOT NULL,
	"price" numeric(12, 2),
	"currency" text DEFAULT 'EUR',
	"availability" text,
	"url" text NOT NULL,
	"scraped_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "part_references" (
	"id" serial PRIMARY KEY NOT NULL,
	"part_id" integer NOT NULL,
	"reference" text NOT NULL,
	"reference_normalized" text NOT NULL,
	"type" "reference_type" NOT NULL,
	"brand" text,
	"source" text
);

CREATE TABLE "parts" (
	"id" serial PRIMARY KEY NOT NULL,
	"manufacturer_id" integer NOT NULL,
	"category_id" integer,
	"reference_raw" text NOT NULL,
	"reference_normalized" text NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"status" "part_status" DEFAULT 'unknown' NOT NULL,
	"image_url" text,
	"attributes" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "sellers" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"type" "seller_type" NOT NULL,
	"website" text,
	"country" text
);

CREATE TABLE "supersessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"old_part_id" integer NOT NULL,
	"new_part_id" integer NOT NULL,
	"source" text,
	"note" text
);

ALTER TABLE "compatibilities" ADD CONSTRAINT "compatibilities_part_id_parts_id_fk" FOREIGN KEY ("part_id") REFERENCES "public"."parts"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "compatibilities" ADD CONSTRAINT "compatibilities_compatible_part_id_parts_id_fk" FOREIGN KEY ("compatible_part_id") REFERENCES "public"."parts"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "offers" ADD CONSTRAINT "offers_part_id_parts_id_fk" FOREIGN KEY ("part_id") REFERENCES "public"."parts"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "offers" ADD CONSTRAINT "offers_seller_id_sellers_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."sellers"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "part_references" ADD CONSTRAINT "part_references_part_id_parts_id_fk" FOREIGN KEY ("part_id") REFERENCES "public"."parts"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "parts" ADD CONSTRAINT "parts_manufacturer_id_manufacturers_id_fk" FOREIGN KEY ("manufacturer_id") REFERENCES "public"."manufacturers"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "parts" ADD CONSTRAINT "parts_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "supersessions" ADD CONSTRAINT "supersessions_old_part_id_parts_id_fk" FOREIGN KEY ("old_part_id") REFERENCES "public"."parts"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "supersessions" ADD CONSTRAINT "supersessions_new_part_id_parts_id_fk" FOREIGN KEY ("new_part_id") REFERENCES "public"."parts"("id") ON DELETE no action ON UPDATE no action;
CREATE UNIQUE INDEX "categories_slug_idx" ON "categories" USING btree ("slug");
CREATE UNIQUE INDEX "compatibilities_part_compat_idx" ON "compatibilities" USING btree ("part_id","compatible_part_id");
CREATE UNIQUE INDEX "manufacturers_slug_idx" ON "manufacturers" USING btree ("slug");
CREATE INDEX "offers_part_idx" ON "offers" USING btree ("part_id");
CREATE INDEX "part_references_normalized_idx" ON "part_references" USING btree ("reference_normalized");
CREATE UNIQUE INDEX "part_references_part_ref_idx" ON "part_references" USING btree ("part_id","reference_normalized");
CREATE UNIQUE INDEX "parts_manufacturer_ref_idx" ON "parts" USING btree ("manufacturer_id","reference_normalized");
CREATE INDEX "parts_ref_normalized_idx" ON "parts" USING btree ("reference_normalized");
CREATE UNIQUE INDEX "sellers_slug_idx" ON "sellers" USING btree ("slug");
CREATE UNIQUE INDEX "supersessions_old_new_idx" ON "supersessions" USING btree ("old_part_id","new_part_id");
-- ─── Données de démonstration ───

INSERT INTO public.categories VALUES (19, 'Pompes de vidange', 'pompes-de-vidange', 'electromenager', NULL);
INSERT INTO public.categories VALUES (20, 'Roulements et paliers', 'roulements-et-paliers', 'electromenager', NULL);
INSERT INTO public.categories VALUES (21, 'Filtres à eau', 'filtres-a-eau', 'electromenager', NULL);
INSERT INTO public.categories VALUES (22, 'Joints de hublot', 'joints-de-hublot', 'electromenager', NULL);
INSERT INTO public.categories VALUES (23, 'Filtres à huile', 'filtres-a-huile', 'automobile', NULL);
INSERT INTO public.categories VALUES (24, 'Embrayages', 'embrayages', 'automobile', NULL);
INSERT INTO public.categories VALUES (25, 'Automates programmables', 'automates-programmables', 'industrie', NULL);
INSERT INTO public.categories VALUES (26, 'Contacteurs', 'contacteurs', 'industrie', NULL);
INSERT INTO public.categories VALUES (27, 'Variateurs de vitesse', 'variateurs-de-vitesse', 'industrie', NULL);
INSERT INTO public.categories VALUES (28, 'Alimentations serveur et réseau', 'alimentations-serveur-et-reseau', 'informatique', NULL);
INSERT INTO public.categories VALUES (29, 'Modules optiques SFP', 'modules-optiques-sfp', 'informatique', NULL);
INSERT INTO public.categories VALUES (30, 'Batteries d''ordinateur portable', 'batteries-d-ordinateur-portable', 'informatique', NULL);
INSERT INTO public.categories VALUES (31, 'Contrôleurs RAID', 'controleurs-raid', 'informatique', NULL);
INSERT INTO public.categories VALUES (32, 'Cartes électroniques', 'cartes-electroniques', 'hvac', NULL);
INSERT INTO public.categories VALUES (33, 'Résistances de chauffe', 'resistances-de-chauffe', 'hvac', NULL);
INSERT INTO public.categories VALUES (34, 'Alimentations TV', 'alimentations-tv', 'electronique', NULL);
INSERT INTO public.categories VALUES (35, 'Cartes mères TV', 'cartes-meres-tv', 'electronique', NULL);
INSERT INTO public.manufacturers VALUES (19, 'Bosch', 'bosch', 'electromenager', 'https://www.bosch-home.fr');
INSERT INTO public.manufacturers VALUES (20, 'Samsung', 'samsung', 'electronique', 'https://www.samsung.com');
INSERT INTO public.manufacturers VALUES (21, 'Whirlpool', 'whirlpool', 'electromenager', 'https://www.whirlpool.fr');
INSERT INTO public.manufacturers VALUES (22, 'BMW', 'bmw', 'automobile', 'https://www.bmw.fr');
INSERT INTO public.manufacturers VALUES (23, 'Bosch Automotive', 'bosch-automotive', 'automobile', 'https://www.bosch.fr');
INSERT INTO public.manufacturers VALUES (24, 'Valeo', 'valeo', 'automobile', 'https://www.valeo.com');
INSERT INTO public.manufacturers VALUES (25, 'Siemens', 'siemens', 'industrie', 'https://www.siemens.com');
INSERT INTO public.manufacturers VALUES (26, 'Schneider Electric', 'schneider-electric', 'industrie', 'https://www.se.com');
INSERT INTO public.manufacturers VALUES (27, 'ABB', 'abb', 'industrie', 'https://www.abb.com');
INSERT INTO public.manufacturers VALUES (28, 'Rockwell Automation', 'rockwell-automation', 'industrie', 'https://www.rockwellautomation.com');
INSERT INTO public.manufacturers VALUES (29, 'Cisco', 'cisco', 'informatique', 'https://www.cisco.com');
INSERT INTO public.manufacturers VALUES (30, 'Dell', 'dell', 'informatique', 'https://www.dell.com');
INSERT INTO public.manufacturers VALUES (31, 'HPE', 'hpe', 'informatique', 'https://www.hpe.com');
INSERT INTO public.manufacturers VALUES (32, 'Lenovo', 'lenovo', 'informatique', 'https://www.lenovo.com');
INSERT INTO public.manufacturers VALUES (33, 'Daikin', 'daikin', 'hvac', 'https://www.daikin.fr');
INSERT INTO public.manufacturers VALUES (34, 'Atlantic', 'atlantic', 'hvac', 'https://www.groupe-atlantic.fr');
INSERT INTO public.manufacturers VALUES (35, 'LG', 'lg', 'electronique', 'https://www.lg.com');
INSERT INTO public.parts VALUES (31, 19, 19, '00144978', '00144978', '00144978', 'Pompe de vidange lave-linge (ancienne génération)', 'Pompe de vidange pour lave-linge Bosch / Siemens séries WAE, WAQ. Référence remplacée par la pompe 00754870.', 'obsolete', NULL, NULL, '2026-06-10 11:24:03.720204', '2026-06-10 11:24:03.720204');
INSERT INTO public.parts VALUES (32, 19, 19, '00754870', '00754870', '00754870', 'Pompe de vidange lave-linge', 'Pompe de vidange Copreci 30 W pour lave-linge Bosch, Siemens et Neff. Remplace plusieurs anciennes références.', 'active', NULL, '{"Tension": "220-240 V", "Puissance": "30 W", "Marque_moteur": "Copreci"}', '2026-06-10 11:24:03.786072', '2026-06-10 11:24:03.786072');
INSERT INTO public.parts VALUES (33, 20, 20, 'DC97-16350C', 'DC9716350C', 'dc9716350c', 'Kit roulements tambour lave-linge', 'Kit complet roulements + joint spi pour tambour de lave-linge Samsung EcoBubble.', 'active', NULL, NULL, '2026-06-10 11:24:03.788208', '2026-06-10 11:24:03.788208');
INSERT INTO public.parts VALUES (34, 20, 21, 'DA29-00020B', 'DA2900020B', 'da2900020b', 'Filtre à eau réfrigérateur américain', 'Filtre à eau interne HAF-CIN pour réfrigérateurs américains Samsung. Durée de vie 6 mois.', 'active', NULL, NULL, '2026-06-10 11:24:03.79105', '2026-06-10 11:24:03.79105');
INSERT INTO public.parts VALUES (35, 21, 19, '481236018558', '481236018558', '481236018558', 'Pompe de vidange lave-linge', 'Pompe de vidange Askoll M50 pour lave-linge Whirlpool et Laden.', 'active', NULL, NULL, '2026-06-10 11:24:03.79311', '2026-06-10 11:24:03.79311');
INSERT INTO public.parts VALUES (36, 21, 22, '481246668784', '481246668784', '481246668784', 'Joint de hublot lave-linge', 'Manchette de hublot pour lave-linge Whirlpool 6ème sens.', 'obsolete', NULL, NULL, '2026-06-10 11:24:03.794825', '2026-06-10 11:24:03.794825');
INSERT INTO public.parts VALUES (37, 21, 22, '481010632436', '481010632436', '481010632436', 'Joint de hublot lave-linge (nouvelle référence)', 'Manchette de hublot, remplace la référence 481246668784.', 'active', NULL, NULL, '2026-06-10 11:24:03.796428', '2026-06-10 11:24:03.796428');
INSERT INTO public.parts VALUES (38, 22, 23, '11 42 7 511 161', '11427511161', '11427511161', 'Filtre à huile (ancienne référence)', 'Élément filtrant à huile pour moteurs BMW N42/N46. Référence remplacée au catalogue par 11 42 7 953 129.', 'obsolete', NULL, NULL, '2026-06-10 11:24:03.798234', '2026-06-10 11:24:03.798234');
INSERT INTO public.parts VALUES (39, 22, 23, '11 42 7 953 129', '11427953129', '11427953129', 'Filtre à huile moteur', 'Élément filtrant à huile d''origine BMW pour moteurs 4 cylindres essence. Livré avec joints.', 'active', NULL, '{"Hauteur": "79 mm", "Diamètre": "72 mm"}', '2026-06-10 11:24:03.799744', '2026-06-10 11:24:03.799744');
INSERT INTO public.parts VALUES (40, 23, 23, 'F 026 407 228', 'F026407228', 'f026407228', 'Filtre à huile', 'Filtre à huile aftermarket Bosch, équivalent constructeur pour moteurs BMW 4 cylindres.', 'active', NULL, NULL, '2026-06-10 11:24:03.801287', '2026-06-10 11:24:03.801287');
INSERT INTO public.parts VALUES (41, 24, 24, '826704', '826704', '826704', 'Kit d''embrayage 3 pièces', 'Kit embrayage complet (mécanisme, disque, butée) pour moteurs 1.6 HDi / TDCi.', 'active', NULL, '{"Dents": "19", "Diamètre": "235 mm"}', '2026-06-10 11:24:03.80268', '2026-06-10 11:24:03.80268');
INSERT INTO public.parts VALUES (42, 25, 25, '6ES7214-1AG31-0XB0', '6ES72141AG310XB0', '6es72141ag310xb0', 'CPU S7-1200 1214C DC/DC/DC (gén. 3)', 'Automate SIMATIC S7-1200, CPU 1214C. Phase-out annoncé : remplacé par 6ES7214-1AG40-0XB0.', 'obsolete', NULL, NULL, '2026-06-10 11:24:03.804282', '2026-06-10 11:24:03.804282');
INSERT INTO public.parts VALUES (43, 25, 25, '6ES7214-1AG40-0XB0', '6ES72141AG400XB0', '6es72141ag400xb0', 'CPU S7-1200 1214C DC/DC/DC', 'Automate SIMATIC S7-1200, CPU 1214C, 14 entrées / 10 sorties TOR, 2 entrées analogiques.', 'active', NULL, '{"Mémoire": "100 KB", "Alimentation": "24 V DC"}', '2026-06-10 11:24:03.805774', '2026-06-10 11:24:03.805774');
INSERT INTO public.parts VALUES (44, 26, 26, 'LC1D18M7', 'LC1D18M7', 'lc1d18m7', 'Contacteur TeSys D 18 A, bobine 220 V AC', 'Contacteur tripolaire TeSys Deca 18 A AC-3, bobine 220-230 V 50/60 Hz.', 'active', NULL, NULL, '2026-06-10 11:24:03.807213', '2026-06-10 11:24:03.807213');
INSERT INTO public.parts VALUES (45, 27, 26, '1SBL177001R8010', '1SBL177001R8010', '1sbl177001r8010', 'Contacteur AF16-30-10-80, 18 A', 'Contacteur tripolaire AF16, bobine large plage 100-250 V AC/DC, contact auxiliaire 1 NO.', 'active', NULL, NULL, '2026-06-10 11:24:03.808691', '2026-06-10 11:24:03.808691');
INSERT INTO public.parts VALUES (46, 28, 25, '2711P-T7C4D8', '2711PT7C4D8', '2711pt7c4d8', 'Terminal opérateur PanelView Plus 7', 'IHM tactile PanelView Plus 7 Standard 6,5" Allen-Bradley, Ethernet, 24 V DC.', 'active', NULL, NULL, '2026-06-10 11:24:03.810223', '2026-06-10 11:24:03.810223');
INSERT INTO public.parts VALUES (47, 25, 27, '6SE6440-2UD21-5AA1', '6SE64402UD215AA1', '6se64402ud215aa1', 'Variateur MICROMASTER 440, 1,5 kW', 'Variateur de fréquence MICROMASTER 440. Gamme arrêtée par Siemens, successeur conseillé : SINAMICS G120 (6SL3210-1KE21-3UF1).', 'obsolete', NULL, NULL, '2026-06-10 11:24:03.812641', '2026-06-10 11:24:03.812641');
INSERT INTO public.parts VALUES (48, 25, 27, '6SL3210-1KE21-3UF1', '6SL32101KE213UF1', '6sl32101ke213uf1', 'Variateur SINAMICS G120C, 5,5 kW', 'Variateur de fréquence compact SINAMICS G120C, successeur de la gamme MICROMASTER.', 'active', NULL, NULL, '2026-06-10 11:24:03.814043', '2026-06-10 11:24:03.814043');
INSERT INTO public.parts VALUES (49, 29, 28, 'PWR-C1-715WAC', 'PWRC1715WAC', 'pwrc1715wac', 'Alimentation 715 W AC Catalyst 3850/9300', 'Bloc d''alimentation 715 W AC pour commutateurs Cisco Catalyst 3850 et 9300. Annoncé en fin de vie (EoS), successeur : PWR-C1-715WAC-P.', 'obsolete', NULL, NULL, '2026-06-10 11:24:03.815626', '2026-06-10 11:24:03.815626');
INSERT INTO public.parts VALUES (50, 29, 28, 'PWR-C1-715WAC-P', 'PWRC1715WACP', 'pwrc1715wacp', 'Alimentation 715 W AC platine Catalyst 9300', 'Bloc d''alimentation 715 W AC haut rendement (platinum) pour Catalyst 9300, remplace PWR-C1-715WAC.', 'active', NULL, NULL, '2026-06-10 11:24:03.81724', '2026-06-10 11:24:03.81724');
INSERT INTO public.parts VALUES (51, 29, 29, 'GLC-SX-MMD', 'GLCSXMMD', 'glcsxmmd', 'Module SFP 1000BASE-SX multimode', 'Émetteur-récepteur optique SFP 1 Gb/s multimode 850 nm avec DOM. De nombreux modules tiers compatibles existent.', 'active', NULL, NULL, '2026-06-10 11:24:03.818936', '2026-06-10 11:24:03.818936');
INSERT INTO public.parts VALUES (52, 30, 31, '0X8DXD', '0X8DXD', '0x8dxd', 'Contrôleur RAID PERC H730P 2 Go', 'Carte contrôleur RAID PERC H730P mini mono 2 Go cache pour serveurs Dell PowerEdge R630/R730.', 'obsolete', NULL, NULL, '2026-06-10 11:24:03.820447', '2026-06-10 11:24:03.820447');
INSERT INTO public.parts VALUES (53, 31, 28, '511778-001', '511778001', '511778001', 'Alimentation 460 W ProLiant G6/G7', 'Bloc d''alimentation 460 W common slot pour serveurs HPE ProLiant DL360/DL380 G6 et G7. Spare HPE, plus produit.', 'obsolete', NULL, NULL, '2026-06-10 11:24:03.832239', '2026-06-10 11:24:03.832239');
INSERT INTO public.parts VALUES (54, 32, 30, '01AV430', '01AV430', '01av430', 'Batterie interne ThinkPad X1 Carbon Gen 5/6', 'Batterie Li-Po 57 Wh (FRU) pour ThinkPad X1 Carbon 5e et 6e génération.', 'active', NULL, NULL, '2026-06-10 11:24:03.833838', '2026-06-10 11:24:03.833838');
INSERT INTO public.parts VALUES (55, 33, 32, '5021205', '5021205', '5021205', 'Carte électronique unité extérieure', 'Carte de puissance pour groupes extérieurs Daikin multisplit. Pièce SAV.', 'active', NULL, NULL, '2026-06-10 11:24:03.835403', '2026-06-10 11:24:03.835403');
INSERT INTO public.parts VALUES (56, 34, 33, '099110', '099110', '099110', 'Résistance stéatite 2400 W chauffe-eau', 'Résistance stéatite triphasée 2400 W pour chauffe-eau Atlantic / Sauter / Thermor Ø52.', 'active', NULL, '{"Diamètre": "52 mm", "Puissance": "2400 W"}', '2026-06-10 11:24:03.836818', '2026-06-10 11:24:03.836818');
INSERT INTO public.parts VALUES (57, 20, 34, 'BN44-00932B', 'BN4400932B', 'bn4400932b', 'Alimentation TV QLED', 'Carte d''alimentation L55E7N_RDY pour téléviseurs Samsung QLED 55" série Q7/Q8.', 'active', NULL, NULL, '2026-06-10 11:24:03.838216', '2026-06-10 11:24:03.838216');
INSERT INTO public.parts VALUES (58, 20, 35, 'BN94-12876A', 'BN9412876A', 'bn9412876a', 'Carte mère TV UE49MU6105', 'Carte principale pour téléviseur Samsung UE49MU6105. Production arrêtée, disponible en occasion uniquement.', 'obsolete', NULL, NULL, '2026-06-10 11:24:03.839923', '2026-06-10 11:24:03.839923');
INSERT INTO public.parts VALUES (59, 35, 34, 'EAY64388801', 'EAY64388801', 'eay64388801', 'Alimentation TV OLED', 'Carte d''alimentation EAX67264001 pour téléviseurs LG OLED55B7.', 'active', NULL, NULL, '2026-06-10 11:24:03.841732', '2026-06-10 11:24:03.841732');
INSERT INTO public.compatibilities VALUES (7, 32, 35, 0.8, 'seed-demo');
INSERT INTO public.compatibilities VALUES (8, 35, 32, 0.8, 'seed-demo');
INSERT INTO public.compatibilities VALUES (9, 39, 40, 0.8, 'seed-demo');
INSERT INTO public.compatibilities VALUES (10, 40, 39, 0.8, 'seed-demo');
INSERT INTO public.compatibilities VALUES (11, 44, 45, 0.8, 'seed-demo');
INSERT INTO public.compatibilities VALUES (12, 45, 44, 0.8, 'seed-demo');
INSERT INTO public.sellers VALUES (13, 'Bosch Home Pièces', 'bosch-home-pieces', 'constructeur', 'https://www.bosch-home.fr', 'FR');
INSERT INTO public.sellers VALUES (14, 'Concession BMW', 'concession-bmw', 'constructeur', 'https://www.bmw.fr', 'FR');
INSERT INTO public.sellers VALUES (15, 'Siemens Industry Mall', 'siemens-industry-mall', 'constructeur', 'https://mall.industry.siemens.com', 'DE');
INSERT INTO public.sellers VALUES (16, 'Adepem', 'adepem', 'distributeur_officiel', 'https://www.adepem.com', 'FR');
INSERT INTO public.sellers VALUES (17, 'Sogedis', 'sogedis', 'distributeur_officiel', 'https://www.sogedis.fr', 'FR');
INSERT INTO public.sellers VALUES (18, 'AutoDoc', 'autodoc', 'aftermarket', 'https://www.autodoc.fr', 'DE');
INSERT INTO public.sellers VALUES (19, 'eSpares', 'espares', 'aftermarket', 'https://www.espares.co.uk', 'GB');
INSERT INTO public.sellers VALUES (20, 'Radwell', 'radwell', 'reconditionne', 'https://www.radwell.com', 'US');
INSERT INTO public.sellers VALUES (21, 'ServerSupply', 'serversupply', 'aftermarket', 'https://www.serversupply.com', 'US');
INSERT INTO public.sellers VALUES (22, 'ETB Technologies', 'etb-technologies', 'reconditionne', 'https://www.etb-tech.com', 'GB');
INSERT INTO public.sellers VALUES (23, 'eBay', 'ebay', 'occasion', 'https://www.ebay.fr', 'FR');
INSERT INTO public.offers VALUES (50, 32, 13, 42.90, 'EUR', 'En stock', 'https://www.bosch-home.fr', '2026-06-10 11:24:03.851648');
INSERT INTO public.offers VALUES (51, 32, 16, 29.90, 'EUR', 'En stock', 'https://www.adepem.com', '2026-06-10 11:24:03.853967');
INSERT INTO public.offers VALUES (52, 32, 19, 24.99, 'EUR', 'En stock', 'https://www.espares.co.uk', '2026-06-10 11:24:03.855286');
INSERT INTO public.offers VALUES (53, 32, 23, 15.00, 'EUR', 'Occasion', 'https://www.ebay.fr', '2026-06-10 11:24:03.856595');
INSERT INTO public.offers VALUES (54, 33, 16, 54.50, 'EUR', 'En stock', 'https://www.adepem.com', '2026-06-10 11:24:03.857896');
INSERT INTO public.offers VALUES (55, 33, 19, 49.99, 'EUR', 'Sous 5 jours', 'https://www.espares.co.uk', '2026-06-10 11:24:03.860095');
INSERT INTO public.offers VALUES (56, 34, 16, 39.90, 'EUR', 'En stock', 'https://www.adepem.com', '2026-06-10 11:24:03.863573');
INSERT INTO public.offers VALUES (57, 34, 23, 22.00, 'EUR', 'Neuf compatible', 'https://www.ebay.fr', '2026-06-10 11:24:03.864926');
INSERT INTO public.offers VALUES (58, 35, 17, 27.40, 'EUR', 'En stock', 'https://www.sogedis.fr', '2026-06-10 11:24:03.867569');
INSERT INTO public.offers VALUES (59, 37, 17, 34.90, 'EUR', 'En stock', 'https://www.sogedis.fr', '2026-06-10 11:24:03.870043');
INSERT INTO public.offers VALUES (60, 37, 16, 36.50, 'EUR', 'En stock', 'https://www.adepem.com', '2026-06-10 11:24:03.871235');
INSERT INTO public.offers VALUES (61, 39, 14, 19.80, 'EUR', 'En stock', 'https://www.bmw.fr', '2026-06-10 11:24:03.877899');
INSERT INTO public.offers VALUES (62, 39, 18, 8.45, 'EUR', 'En stock', 'https://www.autodoc.fr', '2026-06-10 11:24:03.879355');
INSERT INTO public.offers VALUES (63, 39, 23, 6.90, 'EUR', 'Neuf', 'https://www.ebay.fr', '2026-06-10 11:24:03.880749');
INSERT INTO public.offers VALUES (64, 40, 18, 7.20, 'EUR', 'En stock', 'https://www.autodoc.fr', '2026-06-10 11:24:03.883405');
INSERT INTO public.offers VALUES (65, 41, 18, 129.90, 'EUR', 'En stock', 'https://www.autodoc.fr', '2026-06-10 11:24:03.884639');
INSERT INTO public.offers VALUES (66, 41, 23, 95.00, 'EUR', 'Neuf', 'https://www.ebay.fr', '2026-06-10 11:24:03.885816');
INSERT INTO public.offers VALUES (67, 42, 20, 420.00, 'EUR', 'Reconditionné, garanti 2 ans', 'https://www.radwell.com', '2026-06-10 11:24:03.889104');
INSERT INTO public.offers VALUES (68, 43, 15, 545.00, 'EUR', 'En stock', 'https://mall.industry.siemens.com', '2026-06-10 11:24:03.890287');
INSERT INTO public.offers VALUES (69, 43, 20, 389.00, 'EUR', 'Surplus neuf', 'https://www.radwell.com', '2026-06-10 11:24:03.891432');
INSERT INTO public.offers VALUES (70, 43, 23, 310.00, 'EUR', 'Occasion', 'https://www.ebay.fr', '2026-06-10 11:24:03.892692');
INSERT INTO public.offers VALUES (71, 44, 20, 48.00, 'EUR', 'Surplus neuf', 'https://www.radwell.com', '2026-06-10 11:24:03.895398');
INSERT INTO public.offers VALUES (72, 44, 23, 32.00, 'EUR', 'Neuf', 'https://www.ebay.fr', '2026-06-10 11:24:03.896597');
INSERT INTO public.offers VALUES (73, 45, 20, 52.50, 'EUR', 'Surplus neuf', 'https://www.radwell.com', '2026-06-10 11:24:03.898923');
INSERT INTO public.offers VALUES (74, 46, 20, 1450.00, 'EUR', 'Surplus neuf', 'https://www.radwell.com', '2026-06-10 11:24:03.900371');
INSERT INTO public.offers VALUES (75, 46, 23, 980.00, 'EUR', 'Occasion', 'https://www.ebay.fr', '2026-06-10 11:24:03.901602');
INSERT INTO public.offers VALUES (76, 47, 20, 520.00, 'EUR', 'Reconditionné, garanti 2 ans', 'https://www.radwell.com', '2026-06-10 11:24:03.904363');
INSERT INTO public.offers VALUES (77, 47, 23, 350.00, 'EUR', 'Occasion', 'https://www.ebay.fr', '2026-06-10 11:24:03.905874');
INSERT INTO public.offers VALUES (78, 48, 15, 890.00, 'EUR', 'En stock', 'https://mall.industry.siemens.com', '2026-06-10 11:24:03.907192');
INSERT INTO public.offers VALUES (79, 49, 21, 145.00, 'EUR', 'Refurbished', 'https://www.serversupply.com', '2026-06-10 11:24:03.911241');
INSERT INTO public.offers VALUES (80, 49, 23, 89.00, 'EUR', 'Occasion testée', 'https://www.ebay.fr', '2026-06-10 11:24:03.912592');
INSERT INTO public.offers VALUES (81, 50, 21, 320.00, 'EUR', 'Neuf', 'https://www.serversupply.com', '2026-06-10 11:24:03.914113');
INSERT INTO public.offers VALUES (82, 51, 21, 24.00, 'EUR', 'Neuf', 'https://www.serversupply.com', '2026-06-10 11:24:03.917674');
INSERT INTO public.offers VALUES (83, 51, 23, 9.90, 'EUR', 'Occasion', 'https://www.ebay.fr', '2026-06-10 11:24:03.919081');
INSERT INTO public.offers VALUES (84, 52, 21, 189.00, 'EUR', 'Refurbished', 'https://www.serversupply.com', '2026-06-10 11:24:03.920458');
INSERT INTO public.offers VALUES (85, 52, 22, 165.00, 'EUR', 'Reconditionné, garanti 3 ans', 'https://www.etb-tech.com', '2026-06-10 11:24:03.921634');
INSERT INTO public.offers VALUES (86, 52, 23, 120.00, 'EUR', 'Occasion', 'https://www.ebay.fr', '2026-06-10 11:24:03.923137');
INSERT INTO public.offers VALUES (87, 53, 21, 49.00, 'EUR', 'Refurbished', 'https://www.serversupply.com', '2026-06-10 11:24:03.925964');
INSERT INTO public.offers VALUES (88, 53, 23, 25.00, 'EUR', 'Occasion', 'https://www.ebay.fr', '2026-06-10 11:24:03.927226');
INSERT INTO public.offers VALUES (89, 54, 21, 95.00, 'EUR', 'Neuf', 'https://www.serversupply.com', '2026-06-10 11:24:03.930244');
INSERT INTO public.offers VALUES (90, 54, 23, 45.00, 'EUR', 'Compatible neuf', 'https://www.ebay.fr', '2026-06-10 11:24:03.931784');
INSERT INTO public.offers VALUES (91, 55, 23, 280.00, 'EUR', 'Occasion testée', 'https://www.ebay.fr', '2026-06-10 11:24:03.933208');
INSERT INTO public.offers VALUES (92, 56, 16, 45.90, 'EUR', 'En stock', 'https://www.adepem.com', '2026-06-10 11:24:03.934711');
INSERT INTO public.offers VALUES (93, 56, 17, 43.00, 'EUR', 'En stock', 'https://www.sogedis.fr', '2026-06-10 11:24:03.936206');
INSERT INTO public.offers VALUES (94, 57, 23, 65.00, 'EUR', 'Occasion testée', 'https://www.ebay.fr', '2026-06-10 11:24:03.939546');
INSERT INTO public.offers VALUES (95, 57, 17, 98.00, 'EUR', 'Sous 10 jours', 'https://www.sogedis.fr', '2026-06-10 11:24:03.941199');
INSERT INTO public.offers VALUES (96, 58, 23, 89.00, 'EUR', 'Occasion', 'https://www.ebay.fr', '2026-06-10 11:24:03.942852');
INSERT INTO public.offers VALUES (97, 59, 23, 75.00, 'EUR', 'Occasion testée', 'https://www.ebay.fr', '2026-06-10 11:24:03.946922');
INSERT INTO public.part_references VALUES (12, 32, '00145787', '00145787', 'oem', 'Bosch', 'seed-demo');
INSERT INTO public.part_references VALUES (13, 32, '4055250551', '4055250551', 'aftermarket', 'Universel', 'seed-demo');
INSERT INTO public.part_references VALUES (14, 34, 'HAF-CIN/EXP', 'HAFCINEXP', 'mpn', 'Samsung', 'seed-demo');
INSERT INTO public.part_references VALUES (15, 39, 'HU 816 x', 'HU816X', 'aftermarket', 'Mann-Filter', 'seed-demo');
INSERT INTO public.part_references VALUES (16, 39, 'OX 813/2D', 'OX8132D', 'aftermarket', 'Mahle', 'seed-demo');
INSERT INTO public.part_references VALUES (17, 49, '341-0612-02', '341061202', 'mpn', 'Cisco', 'seed-demo');
INSERT INTO public.part_references VALUES (18, 51, 'SFP1G-SX-85', 'SFP1GSX85', 'aftermarket', 'FS', 'seed-demo');
INSERT INTO public.part_references VALUES (19, 53, '503296-B21', '503296B21', 'oem', 'HPE', 'seed-demo');
INSERT INTO public.part_references VALUES (20, 54, 'SB10K97566', 'SB10K97566', 'oem', 'Lenovo', 'seed-demo');
INSERT INTO public.part_references VALUES (21, 57, 'L55E7N_RDY', 'L55E7NRDY', 'mpn', 'Samsung', 'seed-demo');
INSERT INTO public.part_references VALUES (22, 59, 'EAX67264001', 'EAX67264001', 'mpn', 'LG', 'seed-demo');
INSERT INTO public.supersessions VALUES (7, 31, 32, 'seed-demo', 'Remplacement officiel catalogue');
INSERT INTO public.supersessions VALUES (8, 36, 37, 'seed-demo', 'Remplacement officiel catalogue');
INSERT INTO public.supersessions VALUES (9, 38, 39, 'seed-demo', 'Remplacement officiel catalogue');
INSERT INTO public.supersessions VALUES (10, 42, 43, 'seed-demo', 'Remplacement officiel catalogue');
INSERT INTO public.supersessions VALUES (11, 47, 48, 'seed-demo', 'Remplacement officiel catalogue');
INSERT INTO public.supersessions VALUES (12, 49, 50, 'seed-demo', 'Remplacement officiel catalogue');
SELECT pg_catalog.setval('public.categories_id_seq', 35, true);
SELECT pg_catalog.setval('public.compatibilities_id_seq', 12, true);
SELECT pg_catalog.setval('public.manufacturers_id_seq', 35, true);
SELECT pg_catalog.setval('public.offers_id_seq', 97, true);
SELECT pg_catalog.setval('public.part_references_id_seq', 22, true);
SELECT pg_catalog.setval('public.parts_id_seq', 59, true);
SELECT pg_catalog.setval('public.sellers_id_seq', 23, true);
SELECT pg_catalog.setval('public.supersessions_id_seq', 12, true);
