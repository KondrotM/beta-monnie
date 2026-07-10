import { db } from '$lib/server/db';
import { products, productImages } from '$lib/server/db/schema';
import { desc, eq } from 'drizzle-orm';

export async function load() {
	const rows = db
		.select({
			id: products.id,
			name: products.name,
			price: products.price,
			description: products.description,
			quantity: products.quantity,
			hero: products.hero
		})
		.from(products)
		.orderBy(desc(products.createdAt))
		.all();

	return { products: rows };
}
