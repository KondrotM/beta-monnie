import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import Database from 'better-sqlite3';
import { generateSchemaSql } from '../../scripts/generate-schema-sql.ts';
import { initDb } from '../../scripts/init-db.ts';

// The production container has no drizzle-kit: the Docker build renders
// schema.ts to plain SQL (generate-schema-sql.ts) and the entrypoint applies
// it to a fresh /data volume on first boot (init-db.ts). These tests exercise
// that exact pair, so the container bootstrap can't drift from schema.ts.
describe('docker db bootstrap (generate-schema-sql + init-db)', () => {
	let dir: string;
	let schemaSqlPath: string;

	beforeAll(async () => {
		dir = mkdtempSync(join(tmpdir(), 'mm-init-db-'));
		schemaSqlPath = join(dir, 'schema.sql');
		writeFileSync(schemaSqlPath, await generateSchemaSql());
	});

	afterAll(() => {
		rmSync(dir, { recursive: true, force: true });
	});

	const tableNames = (dbPath: string) => {
		const db = new Database(dbPath, { readonly: true });
		const rows = db
			.prepare(`SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'`)
			.all() as { name: string }[];
		db.close();
		return rows.map((r) => r.name).sort();
	};

	it('creates all four tables on a brand-new database', () => {
		const dbPath = join(dir, 'fresh.db');

		const created = initDb(dbPath, schemaSqlPath);

		expect(created).toBe(true);
		expect(tableNames(dbPath)).toEqual(['admin_sessions', 'product_images', 'products', 'settings']);
	});

	it('is idempotent: a second run leaves existing data untouched', () => {
		const dbPath = join(dir, 'existing.db');
		initDb(dbPath, schemaSqlPath);

		const db = new Database(dbPath);
		db.prepare(`INSERT INTO products (name, price, quantity) VALUES ('Pearl Crown', 45, 3)`).run();
		db.prepare(`INSERT INTO settings (key, value) VALUES ('admin_password_hash', 'hash')`).run();
		db.close();

		const created = initDb(dbPath, schemaSqlPath);

		expect(created).toBe(false);
		const check = new Database(dbPath, { readonly: true });
		expect(check.prepare('SELECT name FROM products').all()).toEqual([{ name: 'Pearl Crown' }]);
		expect(check.prepare(`SELECT value FROM settings WHERE key = 'admin_password_hash'`).get()).toEqual(
			{ value: 'hash' }
		);
		check.close();
	});

	it('generated SQL keeps the cascade delete from product_images to products', () => {
		const dbPath = join(dir, 'cascade.db');
		initDb(dbPath, schemaSqlPath);

		const db = new Database(dbPath);
		db.pragma('foreign_keys = ON');
		const { lastInsertRowid } = db
			.prepare(`INSERT INTO products (name, price, quantity) VALUES ('Seafoam Tiara', 30, 1)`)
			.run();
		db.prepare(`INSERT INTO product_images (product_id, url) VALUES (?, '/uploads/x.jpg')`).run(
			lastInsertRowid
		);

		db.prepare('DELETE FROM products WHERE id = ?').run(lastInsertRowid);

		expect(db.prepare('SELECT * FROM product_images').all()).toEqual([]);
		db.close();
	});
});
