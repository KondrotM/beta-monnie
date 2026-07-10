import { describe, it, expect } from 'vitest';
import { isHttpError } from '@sveltejs/kit';
import { load as listLoad } from '../routes/(store)/products/+page.server';
import { load as detailLoad } from '../routes/(store)/products/[id]/+page.server';
import { seedProduct, seedImages } from './helpers';

describe('products listing', () => {
	it('returns an empty list when there are no products', async () => {
		const { products } = await listLoad();
		expect(products).toEqual([]);
	});

	it('returns products newest first', async () => {
		seedProduct({ name: 'Older', createdAt: new Date('2026-01-01') });
		seedProduct({ name: 'Newer', createdAt: new Date('2026-06-01') });

		const { products } = await listLoad();
		expect(products.map((p) => p.name)).toEqual(['Newer', 'Older']);
	});
});

describe('product detail', () => {
	it('returns the product with image urls in sort order', async () => {
		const product = seedProduct({ name: 'Pearl Crown' });
		seedImages(product.id, ['/uploads/1.jpg', '/uploads/2.jpg', '/uploads/3.jpg']);

		const result = await detailLoad({ params: { id: String(product.id) } } as never);
		expect(result.product.name).toBe('Pearl Crown');
		expect(result.images).toEqual(['/uploads/1.jpg', '/uploads/2.jpg', '/uploads/3.jpg']);
	});

	it('404s for an unknown product', async () => {
		try {
			await detailLoad({ params: { id: '999' } } as never);
			expect.unreachable('should have thrown');
		} catch (e) {
			expect(isHttpError(e)).toBe(true);
			expect((e as { status: number }).status).toBe(404);
		}
	});

	it('404s for a non-numeric id', async () => {
		try {
			await detailLoad({ params: { id: 'not-a-number' } } as never);
			expect.unreachable('should have thrown');
		} catch (e) {
			expect(isHttpError(e)).toBe(true);
			expect((e as { status: number }).status).toBe(404);
		}
	});
});
