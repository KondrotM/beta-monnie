import { fail, redirect, error } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { products, productImages } from '$lib/server/db/schema';
import { uploadImages } from '$lib/server/images';
import { mkdir } from 'fs/promises';
import { dev } from '$app/environment';

export function load({ params }) {
	const id = parseInt(params.id, 10);
	if (isNaN(id)) error(404, 'Product not found');

	const product = db.select().from(products).where(eq(products.id, id)).get();
	if (!product) error(404, 'Product not found');

	const images = db
		.select()
		.from(productImages)
		.where(eq(productImages.productId, id))
		.orderBy(productImages.sortOrder)
		.all();

	return { product, images };
}

export const actions = {
	update: async ({ request, params }) => {
		const id = parseInt(params.id, 10);
		const data = await request.formData();

		const name = data.get('name')?.toString().trim();
		const price = parseFloat(data.get('price')?.toString() ?? '');
		const quantity = parseInt(data.get('quantity')?.toString() ?? '0', 10);
		const description = data.get('description')?.toString().trim() ?? '';
		const heroUrl = data.get('hero')?.toString() ?? '';
		const keepUrls = data.getAll('keep').map(String);
		const files = data.getAll('files').filter((f): f is File => f instanceof File && f.size > 0);

		if (!name || isNaN(price)) return fail(400, { error: 'Name and price are required' });

		if (dev) await mkdir('static/uploads', { recursive: true });
		const newUrls = files.length > 0 ? await uploadImages(files) : [];
		const allUrls = [...keepUrls, ...newUrls];

		// Rebuild images in DB
		db.delete(productImages).where(eq(productImages.productId, id)).run();
		if (allUrls.length > 0) {
			db.insert(productImages)
				.values(allUrls.map((url, i) => ({ productId: id, url, sortOrder: i })))
				.run();
		}

		const hero = heroUrl || allUrls[0] || null;
		db.update(products).set({ name, price, quantity, description, hero }).where(eq(products.id, id)).run();

		redirect(303, `/admin/products/${id}`);
	},

	delete: async ({ params }) => {
		const id = parseInt(params.id, 10);
		// product_images are cascade-deleted by FK
		db.delete(products).where(eq(products.id, id)).run();
		redirect(303, '/admin');
	}
};
