import { rmSync } from 'fs';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { pushSQLiteSchema } from 'drizzle-kit/api';
import * as schema from '../src/lib/server/db/schema';

// Runs once before the e2e suite: build a fresh .e2e.db from the real
// schema.ts and seed it with known products the tests can rely on.
export default async function globalSetup() {
	rmSync('.e2e.db', { force: true });

	const client = new Database('.e2e.db');
	const db = drizzle(client, { schema });

	// (cast: pushSQLiteSchema's types only mention libsql, but it works with better-sqlite3)
	const { statementsToExecute } = await pushSQLiteSchema(schema, db as never);
	for (const stmt of statementsToExecute) client.exec(stmt);

	db.insert(schema.products)
		.values([
			{ name: 'Pearl Crown', price: 45, quantity: 3, description: 'Seeded for e2e.' },
			{ name: 'Seafoam Tiara', price: 30, quantity: 0, description: 'Seeded, sold out.' }
		])
		.run();

	// Admin password for the suite — plaintext 'test-password'
	db.insert(schema.settings)
		.values({
			key: 'admin_password_hash',
			value: '$2b$10$us7v.pYfkcnZ8tW8NLsPJex8k4uKmvcohHT9yf9/KpqByHYTJky8G'
		})
		.run();

	client.close();
}
