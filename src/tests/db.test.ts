import { describe, it, expect } from 'vitest';
import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { products, productImages } from '$lib/server/db/schema';
import { seedProduct, seedImages } from './helpers';

describe('products table', () => {
	it('applies defaults: quantity 0, createdAt set', () => {
		const row = db.insert(products).values({ name: 'Shell Tiara', price: 30 }).returning().get();
		expect(row.quantity).toBe(0);
		expect(row.createdAt).toBeInstanceOf(Date);
		expect(row.hero).toBeNull();
	});

	it('rejects a product without a name', () => {
		expect(() =>
			db.insert(products).values({ price: 10 } as never).run()
		).toThrow();
	});
});

describe('product_images table', () => {
	it('rejects an image pointing at a missing product', () => {
		expect(() =>
			db.insert(productImages).values({ productId: 9999, url: '/uploads/x.jpg' }).run()
		).toThrow();
	});

	it('cascade-deletes images when the product is deleted', () => {
		const product = seedProduct();
		seedImages(product.id, ['/uploads/a.jpg', '/uploads/b.jpg']);

		db.delete(products).where(eq(products.id, product.id)).run();

		const orphans = db
			.select()
			.from(productImages)
			.where(eq(productImages.productId, product.id))
			.all();
		expect(orphans).toHaveLength(0);
	});
});
