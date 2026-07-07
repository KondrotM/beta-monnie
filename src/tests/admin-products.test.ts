import { describe, it, expect } from 'vitest';
import { isRedirect, isActionFailure, type Redirect, type ActionFailure } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { products, productImages } from '$lib/server/db/schema';
import { actions as newActions } from '../routes/admin/products/new/+page.server';
import { actions as editActions, load as editLoad } from '../routes/admin/products/[id]/+page.server';
import { seedProduct, seedImages, formRequest } from './helpers';

async function run(fn: (event: never) => unknown, event: Record<string, unknown>) {
	try {
		return await fn(event as never);
	} catch (e) {
		if (isRedirect(e)) return e;
		throw e;
	}
}

describe('create product action', () => {
	it('creates a product and redirects to its edit page', async () => {
		const result = (await run(newActions.default, {
			request: formRequest({ name: 'Kelp Crown', price: '55.50', quantity: '2', description: 'Green.' })
		})) as Redirect;

		expect(isRedirect(result)).toBe(true);
		const row = db.select().from(products).all()[0];
		expect(result.location).toBe(`/admin/products/${row.id}`);
		expect(row).toMatchObject({ name: 'Kelp Crown', price: 55.5, quantity: 2, description: 'Green.' });
		expect(row.hero).toBeNull(); // no images uploaded
	});

	it('rejects a missing name', async () => {
		const result = (await run(newActions.default, {
			request: formRequest({ name: '   ', price: '10' })
		})) as ActionFailure<{ error: string }>;
		expect(isActionFailure(result)).toBe(true);
		expect(result.status).toBe(400);
		expect(db.select().from(products).all()).toHaveLength(0);
	});

	it('rejects a non-numeric price', async () => {
		const result = (await run(newActions.default, {
			request: formRequest({ name: 'X', price: 'free??' })
		})) as ActionFailure<{ error: string }>;
		expect(isActionFailure(result)).toBe(true);
		expect(db.select().from(products).all()).toHaveLength(0);
	});
});

describe('edit page load', () => {
	it('returns the product and its images in sort order', () => {
		const product = seedProduct({ name: 'Coral Crown' });
		seedImages(product.id, ['/uploads/first.jpg', '/uploads/second.jpg']);

		const result = editLoad({ params: { id: String(product.id) } } as never);
		expect(result.product.name).toBe('Coral Crown');
		expect(result.images.map((i) => i.url)).toEqual(['/uploads/first.jpg', '/uploads/second.jpg']);
	});

	it('404s for an unknown id', () => {
		expect(() => editLoad({ params: { id: '999' } } as never)).toThrow();
	});

	it('404s for a non-numeric id', () => {
		expect(() => editLoad({ params: { id: 'abc' } } as never)).toThrow();
	});
});

describe('update product action', () => {
	it('updates fields and keeps only the listed images', async () => {
		const product = seedProduct({ name: 'Old Name', price: 10 });
		seedImages(product.id, ['/uploads/keep.jpg', '/uploads/drop.jpg']);

		const result = (await run(editActions.update, {
			params: { id: String(product.id) },
			request: formRequest({
				name: 'New Name',
				price: '99.99',
				quantity: '7',
				description: 'Updated.',
				hero: '/uploads/keep.jpg',
				keep: ['/uploads/keep.jpg']
			})
		})) as Redirect;

		expect(isRedirect(result)).toBe(true);
		const row = db.select().from(products).where(eq(products.id, product.id)).get()!;
		expect(row).toMatchObject({ name: 'New Name', price: 99.99, quantity: 7, hero: '/uploads/keep.jpg' });

		const imgs = db.select().from(productImages).where(eq(productImages.productId, product.id)).all();
		expect(imgs.map((i) => i.url)).toEqual(['/uploads/keep.jpg']);
	});

	it('falls back to the first remaining image when the hero was removed', async () => {
		const product = seedProduct({ hero: '/uploads/gone.jpg' });
		seedImages(product.id, ['/uploads/gone.jpg', '/uploads/stays.jpg']);

		await run(editActions.update, {
			params: { id: String(product.id) },
			request: formRequest({
				name: 'Crown',
				price: '20',
				hero: '',
				keep: ['/uploads/stays.jpg']
			})
		});

		const row = db.select().from(products).where(eq(products.id, product.id)).get()!;
		expect(row.hero).toBe('/uploads/stays.jpg');
	});

	it('sets hero to null when every image is removed', async () => {
		const product = seedProduct({ hero: '/uploads/a.jpg' });
		seedImages(product.id, ['/uploads/a.jpg']);

		await run(editActions.update, {
			params: { id: String(product.id) },
			request: formRequest({ name: 'Crown', price: '20', hero: '' })
		});

		const row = db.select().from(products).where(eq(products.id, product.id)).get()!;
		expect(row.hero).toBeNull();
		expect(db.select().from(productImages).all()).toHaveLength(0);
	});

	it('rejects invalid input without touching the images', async () => {
		const product = seedProduct();
		seedImages(product.id, ['/uploads/a.jpg']);

		const result = (await run(editActions.update, {
			params: { id: String(product.id) },
			request: formRequest({ name: '', price: '20', keep: [] })
		})) as ActionFailure<{ error: string }>;

		expect(isActionFailure(result)).toBe(true);
		expect(db.select().from(productImages).all()).toHaveLength(1);
	});
});

describe('delete product action', () => {
	it('deletes the product and its images, then redirects to the dashboard', async () => {
		const product = seedProduct();
		seedImages(product.id, ['/uploads/a.jpg', '/uploads/b.jpg']);

		const result = (await run(editActions.delete, {
			params: { id: String(product.id) }
		})) as Redirect;

		expect(isRedirect(result)).toBe(true);
		expect(result.location).toBe('/admin');
		expect(db.select().from(products).all()).toHaveLength(0);
		expect(db.select().from(productImages).all()).toHaveLength(0);
	});
});
