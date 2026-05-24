import { drizzle } from 'drizzle-orm/bun-sqlite';
import { Database } from 'bun:sqlite';
import * as schema from './schema';

// Menyimpan berkas sqlite.db di dalam folder src/server/
const sqlite = new Database('src/server/sqlite.db');

export const db = drizzle(sqlite, { schema });
