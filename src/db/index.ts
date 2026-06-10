import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString =
  process.env.DATABASE_URL ?? "postgres://localhost:5432/sparepart";

// Vercel (et autres environnements serverless) ne gère pas les connexions
// persistantes — une seule connexion par invocation suffit.
const client = postgres(connectionString, {
  max: process.env.VERCEL ? 1 : 10,
  idle_timeout: 20,
  max_lifetime: 1800,
});

export const db = drizzle(client, { schema });
export { schema };
