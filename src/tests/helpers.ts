import type { Cookies } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { products, productImages, type NewProduct } from '$lib/server/db/schema';

/** In-memory Cookies implementation matching what auth.ts uses. */
export function mockCookies(initial: Record<string, string> = {}) {
	const store = new Map(Object.entries(initial));
	const setCalls: Array<{ name: string; value: string; opts: Record<string, unknown> }> = [];

	const cookies = {
		get: (name: string) => store.get(name),
		set: (name: string, value: string, opts: Record<string, unknown>) => {
			store.set(name, value);
			setCalls.push({ name, value, opts });
		},
		delete: (name: string) => {
			store.delete(name);
		},
		getAll: () => [...store.entries()].map(([name, value]) => ({ name, value })),
		serialize: () => ''
	} as unknown as Cookies;

	return { cookies, store, setCalls };
}

/** Insert a product directly, returning the row. */
export function seedProduct(overrides: Partial<NewProduct> = {}) {
	return db
		.insert(products)
		.values({ name: 'Test Crown', price: 45, quantity: 3, ...overrides })
		.returning()
		.get();
}

/** Insert image rows for a product. */
export function seedImages(productId: number, urls: string[]) {
	db.insert(productImages)
		.values(urls.map((url, i) => ({ productId, url, sortOrder: i })))
		.run();
}

/** Build a multipart-style Request from key/value pairs (repeat keys allowed via arrays). */
export function formRequest(fields: Record<string, string | string[] | File[]>) {
	const fd = new FormData();
	for (const [key, value] of Object.entries(fields)) {
		if (Array.isArray(value)) {
			for (const v of value) fd.append(key, v);
		} else {
			fd.append(key, value);
		}
	}
	return new Request('http://localhost/test', { method: 'POST', body: fd });
}
