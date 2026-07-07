import { beforeEach } from 'vitest';
import { pushSQLiteSchema } from 'drizzle-kit/api';
import * as schema from '$lib/server/db/schema';
import { db } from '$lib/server/db';

// Apply the real schema.ts to this file's in-memory database —
// same mechanism as `npm run db:push`, so tests can't drift from it.
// (drizzle-kit's own apply() calls .all() on DDL, which better-sqlite3
// rejects — so execute the generated statements ourselves.)
// (cast: pushSQLiteSchema's types only mention libsql, but it works with better-sqlite3)
const { statementsToExecute } = await pushSQLiteSchema(schema, db as never);
for (const stmt of statementsToExecute) db.$client.exec(stmt);

// Every test starts from an empty database.
beforeEach(() => {
	db.delete(schema.productImages).run();
	db.delete(schema.products).run();
	db.delete(schema.adminSessions).run();
});
