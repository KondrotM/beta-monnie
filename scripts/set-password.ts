// Set (or reset) the admin password: npm run set-password
// Prompts for the password, bcrypt-hashes it, and stores it in the
// settings table of the database (DATABASE_URL, default local.db).
import { createInterface } from 'node:readline/promises';
import Database from 'better-sqlite3';
import bcrypt from 'bcrypt';

const dbPath = process.env.DATABASE_URL ?? 'local.db';

const rl = createInterface({ input: process.stdin, output: process.stdout });
const password = process.argv[2] ?? (await rl.question('New admin password: '));
rl.close();

if (!password.trim()) {
	console.error('Password cannot be empty.');
	process.exit(1);
}

const hash = await bcrypt.hash(password, 10);

const db = new Database(dbPath);
// Same shape as settings in src/lib/server/db/schema.ts — created here too
// so this works on a brand-new database before the first db:push.
db.exec('CREATE TABLE IF NOT EXISTS settings (key text PRIMARY KEY, value text NOT NULL)');
db.prepare(
	`INSERT INTO settings (key, value) VALUES ('admin_password_hash', ?)
	 ON CONFLICT(key) DO UPDATE SET value = excluded.value`
).run(hash);
db.close();

console.log(`Admin password updated in ${dbPath}`);
