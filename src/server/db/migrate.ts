import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import { createClient } from "@libsql/client";
import * as schema from "./schema";

const client = createClient({ url: process.env.DATABASE_URL || "file:src/server/sqlite.db" });
const db = drizzle(client, { schema });

async function main() {
  console.log("Running migrations...");
  try {
    await migrate(db, { migrationsFolder: "drizzle" });
    console.log("Migrations complete!");
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    client.close();
  }
}

main();
