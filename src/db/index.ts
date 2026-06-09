import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString =
  process.env.DATABASE_URL ?? "postgres://localhost:5432/sparepart";

// postgres-js se connecte paresseusement : aucun accès réseau avant la
// première requête, ce qui permet de builder sans base disponible.
const client = postgres(connectionString, { max: 10 });

export const db = drizzle(client, { schema });
export { schema };
