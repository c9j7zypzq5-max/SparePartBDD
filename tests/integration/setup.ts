/**
 * Chargé avant les tests d'intégration (node --import) : pointe le client
 * Drizzle sur la base de test. Les tests VIDENT les tables : on refuse toute
 * base dont le nom ne contient pas « test ».
 *
 * Préparer la base une fois : DATABASE_URL=$TEST_DATABASE_URL npm run db:push
 */
const url = process.env.TEST_DATABASE_URL;
if (!url) {
  console.error("TEST_DATABASE_URL requis pour les tests d'intégration.");
  process.exit(1);
}
if (!/test/i.test(new URL(url).pathname)) {
  console.error(`Refus : « ${new URL(url).pathname} » n'a pas l'air d'une base de test (les tables vont être vidées).`);
  process.exit(1);
}
process.env.DATABASE_URL = url;
