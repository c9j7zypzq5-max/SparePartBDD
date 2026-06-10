/**
 * URL publique du site, résolue dans cet ordre :
 * 1. NEXT_PUBLIC_SITE_URL si renseignée (domaine custom)
 * 2. URL de production Vercel (spare-part-bdd.vercel.app)
 * 3. URL du déploiement Vercel courant (previews)
 * 4. localhost en dev
 */
export const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000");
