import { describe, it, expect } from 'vitest';
import { formatPrice } from '$lib/format';

describe('formatPrice', () => {
	it('pads whole pounds to two decimals', () => {
		expect(formatPrice(45)).toBe('£45.00');
	});

	it('pads a single decimal place', () => {
		expect(formatPrice(12.5)).toBe('£12.50');
	});

	it('keeps two decimal places as-is', () => {
		expect(formatPrice(30.55)).toBe('£30.55');
	});

	it('handles zero', () => {
		expect(formatPrice(0)).toBe('£0.00');
	});
});
