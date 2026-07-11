// Render schema.ts to plain SQL DDL: node scripts/generate-schema-sql.ts [outfile]
//
// Runs in the Docker build stage (where drizzle-kit is installed) and writes
// schema.sql, which ships in the production image so scripts/init-db.ts can
// initialise a fresh database at container start without drizzle-kit.
// Same mechanism as `npm run db:push`, so the output can't drift from schema.ts.
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { pushSQLiteSchema } from 'drizzle-kit/api';
import * as schema from '../src/lib/server/db/schema.ts';

export async function generateSchemaSql(): Promise<string> {
	const db = drizzle(new Database(':memory:'), { schema });
	// (cast: pushSQLiteSchema's types only mention libsql, but it works with better-sqlite3)
	const { statementsToExecute } = await pushSQLiteSchema(schema, db as never);
	return statementsToExecute.map((s) => (s.trimEnd().endsWith(';') ? s : `${s};`)).join('\n') + '\n';
}

if (process.argv[1]?.endsWith('generate-schema-sql.ts')) {
	const out = process.argv[2] ?? fileURLToPath(new URL('../schema.sql', import.meta.url));
	writeFileSync(out, await generateSchemaSql());
	console.log(`Wrote ${out}`);
}
