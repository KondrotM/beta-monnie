import { describe, it, expect, vi, beforeEach } from 'vitest';

// The cart runs in the browser: force browser=true and stub localStorage.
vi.mock('$app/environment', () => ({ browser: true, dev: true, building: false, version: 'test' }));

function stubLocalStorage(initial: Record<string, string> = {}) {
	const store = new Map(Object.entries(initial));
	vi.stubGlobal('localStorage', {
		getItem: (k: string) => store.get(k) ?? null,
		setItem: (k: string, v: string) => store.set(k, v),
		removeItem: (k: string) => store.delete(k),
		clear: () => store.clear()
	});
	return store;
}

// cart is a module-level singleton, so re-import it fresh for each test.
async function freshCart() {
	vi.resetModules();
	const mod = await import('$lib/cart.svelte');
	return mod.cart;
}

const crown = { id: 1, name: 'Pearl Crown', price: 45, hero: '/uploads/pearl.jpg' };
const tiara = { id: 2, name: 'Shell Tiara', price: 30.5, hero: null };

beforeEach(() => {
	vi.unstubAllGlobals();
});

describe('cart', () => {
	it('starts empty', async () => {
		stubLocalStorage();
		const cart = await freshCart();
		expect(cart.items).toEqual([]);
		expect(cart.count).toBe(0);
		expect(cart.total).toBe(0);
	});

	it('add() appends a new item with quantity 1', async () => {
		stubLocalStorage();
		const cart = await freshCart();
		cart.add(crown);
		expect(cart.items).toEqual([{ ...crown, quantity: 1 }]);
	});

	it('add() increments quantity for an item already in the cart', async () => {
		stubLocalStorage();
		const cart = await freshCart();
		cart.add(crown);
		cart.add(crown);
		expect(cart.items).toHaveLength(1);
		expect(cart.items[0].quantity).toBe(2);
	});

	it('count sums quantities, total sums price × quantity', async () => {
		stubLocalStorage();
		const cart = await freshCart();
		cart.add(crown);
		cart.add(crown);
		cart.add(tiara);
		expect(cart.count).toBe(3);
		expect(cart.total).toBeCloseTo(45 * 2 + 30.5);
	});

	it('remove() drops the item entirely regardless of quantity', async () => {
		stubLocalStorage();
		const cart = await freshCart();
		cart.add(crown);
		cart.add(crown);
		cart.add(tiara);
		cart.remove(crown.id);
		expect(cart.items).toEqual([{ ...tiara, quantity: 1 }]);
	});

	it('clear() empties the cart', async () => {
		stubLocalStorage();
		const cart = await freshCart();
		cart.add(crown);
		cart.clear();
		expect(cart.items).toEqual([]);
	});

	it('persists to localStorage under mm_cart', async () => {
		const store = stubLocalStorage();
		const cart = await freshCart();
		cart.add(crown);
		expect(JSON.parse(store.get('mm_cart')!)).toEqual([{ ...crown, quantity: 1 }]);
	});

	it('restores from localStorage on startup', async () => {
		stubLocalStorage({ mm_cart: JSON.stringify([{ ...tiara, quantity: 4 }]) });
		const cart = await freshCart();
		expect(cart.count).toBe(4);
		expect(cart.total).toBeCloseTo(122);
	});

	it('starts fresh when localStorage is corrupted', async () => {
		stubLocalStorage({ mm_cart: '{not json' });
		const cart = await freshCart();
		expect(cart.items).toEqual([]);
	});
});
