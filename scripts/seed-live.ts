// Import products from the live site into the local dev database:
//   npm run db:seed
//
// Scrapes the Remix loader data embedded in the live /products page,
// downloads every image into static/uploads/ (gitignored), and inserts
// products + images into DATABASE_URL (default local.db).
// Idempotent: products whose name already exists are skipped, and
// already-downloaded images are not re-fetched.
import { writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, basename } from 'node:path';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { eq } from 'drizzle-orm';
import * as schema from '../src/lib/server/db/schema.ts';

const SOURCE = 'https://mermaidmonnieofficial.com/products';
const UPLOADS_DIR = join('static', 'uploads');

type LiveProduct = {
	id: number;
	name: string;
	price: string;
	description: string;
	hero: string;
	images: string[];
};

async function fetchLiveProducts(): Promise<LiveProduct[]> {
	const res = await fetch(SOURCE);
	if (!res.ok) throw new Error(`GET ${SOURCE} → ${res.status}`);
	const html = await res.text();

	// Remix embeds loader data as: window.__remixContext = {...};
	const match =
		html.match(/__remixContext = (.*?);__remixContext\.p/s) ??
		html.match(/__remixContext = (.*?);<\/script>/s);
	if (!match) throw new Error('Could not find __remixContext in the live page — did the site change?');

	const products = JSON.parse(match[1]).state?.loaderData?.['routes/products'];
	if (!Array.isArray(products)) throw new Error('Unexpected loader data shape');
	return products;
}

/** Download a CDN image into static/uploads/, return its local /uploads/ URL. */
async function downloadImage(url: string): Promise<string> {
	const filename = basename(new URL(url).pathname);
	const dest = join(UPLOADS_DIR, filename);

	if (!existsSync(dest)) {
		const res = await fetch(url);
		if (!res.ok) throw new Error(`GET ${url} → ${res.status}`);
		writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
		console.log(`  downloaded ${filename}`);
	}
	return `/uploads/${filename}`;
}

mkdirSync(UPLOADS_DIR, { recursive: true });

const dbPath = process.env.DATABASE_URL ?? 'local.db';
const client = new Database(dbPath);
const db = drizzle(client, { schema });

const live = await fetchLiveProducts();
console.log(`Found ${live.length} products on ${SOURCE}`);

for (const p of live) {
	const exists = db.select().from(schema.products).where(eq(schema.products.name, p.name)).get();
	if (exists) {
		console.log(`- ${p.name}: already in DB, skipping`);
		continue;
	}

	console.log(`- ${p.name}: importing`);
	const hero = await downloadImage(p.hero);
	const imageUrls: string[] = [];
	for (const url of p.images) imageUrls.push(await downloadImage(url));

	const row = db
		.insert(schema.products)
		.values({
			name: p.name,
			price: parseFloat(p.price),
			description: p.description,
			quantity: 1, // live site doesn't expose stock — adjust in the admin panel
			hero
		})
		.returning()
		.get();

	if (imageUrls.length > 0) {
		db.insert(schema.productImages)
			.values(imageUrls.map((url, i) => ({ productId: row.id, url, sortOrder: i })))
			.run();
	}
}

const total = db.select().from(schema.products).all().length;
client.close();
console.log(`Done — ${total} products now in ${dbPath}`);
