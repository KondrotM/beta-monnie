import { db } from '$lib/server/db';
import { products, productImages } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { error } from '@sveltejs/kit';

export async function load({ params }) {
	const id = parseInt(params.id, 10);
	if (isNaN(id)) error(404, 'Product not found');

	const product = db.select().from(products).where(eq(products.id, id)).get();
	if (!product) error(404, 'Product not found');

	const images = db
		.select({ url: productImages.url })
		.from(productImages)
		.where(eq(productImages.productId, id))
		.orderBy(productImages.sortOrder)
		.all();

	return {
		product,
		images: images.map((i) => i.url)
	};
}
