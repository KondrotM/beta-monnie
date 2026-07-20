// Initialise the database on first boot: node scripts/init-db.ts
//
// The production container's entrypoint runs this before starting the server.
// On a fresh /data volume it applies schema.sql (rendered from schema.ts at
// Docker build time by generate-schema-sql.ts); an already-initialised
// database is left untouched. Only needs better-sqlite3, which is a runtime
// dependency — no drizzle-kit in the production image.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import Database from 'better-sqlite3';

/** Returns true if the schema was applied, false if the DB was already initialised. */
export function initDb(dbPath: string, schemaSqlPath: string): boolean {
	const db = new Database(dbPath);
	try {
		const initialised = db
			.prepare(`SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'products'`)
			.get();
		if (initialised) return false;
		db.exec(readFileSync(schemaSqlPath, 'utf8'));
		return true;
	} finally {
		db.close();
	}
}

if (process.argv[1]?.endsWith('init-db.ts')) {
	const dbPath = process.env.DATABASE_URL ?? 'local.db';
	const created = initDb(dbPath, fileURLToPath(new URL('../schema.sql', import.meta.url)));
	console.log(created ? `Initialised ${dbPath} from schema.sql` : `${dbPath} already initialised`);
}
