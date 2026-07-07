import { fail, redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { products, productImages } from '$lib/server/db/schema';
import { uploadImages } from '$lib/server/images';
import { mkdir } from 'fs/promises';
import { dev } from '$app/environment';

export const actions = {
	default: async ({ request }) => {
		const data = await request.formData();

		const name = data.get('name')?.toString().trim();
		const price = parseFloat(data.get('price')?.toString() ?? '');
		const quantity = parseInt(data.get('quantity')?.toString() ?? '0', 10);
		const description = data.get('description')?.toString().trim() ?? '';
		const files = data.getAll('files').filter((f): f is File => f instanceof File && f.size > 0);

		if (!name || isNaN(price)) return fail(400, { error: 'Name and price are required' });

		// Ensure uploads directory exists in dev
		if (dev) await mkdir('static/uploads', { recursive: true });

		const imageUrls = files.length > 0 ? await uploadImages(files) : [];

		const [product] = db
			.insert(products)
			.values({ name, price, quantity, description, hero: imageUrls[0] ?? null })
			.returning()
			.all();

		if (imageUrls.length > 0) {
			db.insert(productImages)
				.values(imageUrls.map((url, i) => ({ productId: product.id, url, sortOrder: i })))
				.run();
		}

		redirect(303, `/admin/products/${product.id}`);
	}
};
