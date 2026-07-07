import { db } from '$lib/server/db';
import { products } from '$lib/server/db/schema';
import { desc } from 'drizzle-orm';

export function load() {
	const rows = db
		.select({
			id: products.id,
			name: products.name,
			price: products.price,
			quantity: products.quantity,
			hero: products.hero,
			createdAt: products.createdAt
		})
		.from(products)
		.orderBy(desc(products.createdAt))
		.all();

	return { products: rows };
}
