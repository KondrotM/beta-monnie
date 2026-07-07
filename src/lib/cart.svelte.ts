import { browser } from '$app/environment';

export type CartItem = {
	id: number;
	name: string;
	price: number;
	hero: string | null;
	quantity: number; // how many the customer added
};

class Cart {
	items = $state<CartItem[]>([]);

	constructor() {
		if (browser) {
			try {
				const stored = localStorage.getItem('mm_cart');
				if (stored) this.items = JSON.parse(stored);
			} catch {
				// corrupted storage — start fresh
			}
		}
	}

	get total(): number {
		return this.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
	}

	get count(): number {
		return this.items.reduce((sum, i) => sum + i.quantity, 0);
	}

	add(item: Omit<CartItem, 'quantity'>): void {
		const existing = this.items.find((i) => i.id === item.id);
		if (existing) {
			existing.quantity++;
		} else {
			this.items.push({ ...item, quantity: 1 });
		}
		this.#save();
	}

	remove(id: number): void {
		this.items = this.items.filter((i) => i.id !== id);
		this.#save();
	}

	clear(): void {
		this.items = [];
		this.#save();
	}

	#save(): void {
		if (browser) localStorage.setItem('mm_cart', JSON.stringify(this.items));
	}
}

export const cart = new Cart();
