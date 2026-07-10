import { test, expect, type Page } from '@playwright/test';

// The header menu and cart buttons are Svelte-driven: they do nothing until
// hydration finishes. Wait for it before clicking, or the click is lost.
async function gotoHydrated(page: Page, path: string) {
	await page.goto(path);
	await page.waitForLoadState('networkidle');
}

test('home page renders the shell (header, footer)', async ({ page }) => {
	await page.goto('/');
	await expect(page.getByRole('link', { name: 'Monnie Mermaid' })).toBeVisible();
	await expect(page.getByText('Made with ♡')).toBeVisible();
});

test('hamburger menu opens and navigates', async ({ page }) => {
	await gotoHydrated(page, '/');
	await page.getByRole('button', { name: 'Open menu' }).click();
	await page.getByRole('link', { name: 'Products' }).click();
	await expect(page).toHaveURL('/products');
});

test('products page shows cards with availability instead of price', async ({ page }) => {
	await page.goto('/products');
	const pearl = page.getByRole('link', { name: /Pearl Crown/ });
	await expect(pearl).toContainText('Available');
	await expect(pearl).not.toContainText('£');
	const seafoam = page.getByRole('link', { name: /Seafoam Tiara/ });
	await expect(seafoam).toContainText('Sold out');
	await expect(seafoam).not.toContainText('Available');
});

test('product detail shows name and formatted price', async ({ page }) => {
	await page.goto('/products');
	await page.getByRole('link', { name: /Pearl Crown/ }).click();
	await expect(page.getByRole('heading', { name: 'Pearl Crown' })).toBeVisible();
	await expect(page.getByText('£45.00')).toBeVisible();
});

test('sold-out product cannot be added to the cart', async ({ page }) => {
	await page.goto('/products');
	await page.getByRole('link', { name: /Seafoam Tiara/ }).click();
	await expect(page.getByText('Sold out')).toBeVisible();
	await expect(page.getByRole('button', { name: 'Add to Cart' })).toHaveCount(0);
});

test('product gallery shows every image, with thumbnails and a counter', async ({ page }) => {
	await page.goto('/products');
	await page.getByRole('link', { name: /Pearl Crown/ }).click();

	await expect(page.getByTestId('gallery').locator('img')).toHaveCount(3);
	await expect(page.getByTestId('thumbnails').locator('button')).toHaveCount(3);
	await expect(page.getByText('1 / 3')).toBeVisible();

	// selecting a thumbnail moves the gallery
	await page.getByTestId('thumbnails').locator('button').nth(2).click();
	await expect(page.getByText('3 / 3')).toBeVisible();
});

test('clicking the photo opens a fullscreen lightbox, Escape closes it', async ({ page }) => {
	await page.goto('/products');
	await page.getByRole('link', { name: /Pearl Crown/ }).click();

	await page.getByRole('button', { name: /Zoom image 1/ }).click();
	await expect(page.locator('dialog')).toBeVisible();

	await page.keyboard.press('Escape');
	await expect(page.locator('dialog')).not.toBeVisible();
});

test('a product without gallery images still renders a placeholder', async ({ page }) => {
	await page.goto('/products');
	await page.getByRole('link', { name: /Seafoam Tiara/ }).click();
	await expect(page.getByText('No image')).toBeVisible();
	await expect(page.getByTestId('thumbnails')).toHaveCount(0);
});

test('full cart flow: add, badge, cart page, persistence, clear', async ({ page }) => {
	await gotoHydrated(page, '/products');
	await page.getByRole('link', { name: /Pearl Crown/ }).click();
	await page.getByRole('button', { name: 'Add to Cart' }).click();
	await expect(page.getByText('Added to cart!')).toBeVisible();

	// header badge shows the count ('Cart' exact — not the 'View cart' link)
	await expect(page.getByRole('link', { name: 'Cart', exact: true })).toContainText('1');

	await page.getByRole('link', { name: 'View cart' }).click();
	await expect(page).toHaveURL('/cart');
	await expect(page.getByText('Total: £45.00')).toBeVisible();
	// checkout is Instagram instructions, not a payment form
	await expect(page.getByRole('link', { name: '@monniemermaidofficial' })).toBeVisible();

	// cart survives a full page reload (localStorage)
	await page.reload();
	await expect(page.getByText('Pearl Crown')).toBeVisible();

	await page.getByRole('button', { name: 'Clear cart' }).click();
	await expect(page.getByText('Your cart is empty.')).toBeVisible();
});
