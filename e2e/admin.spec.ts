import { test, expect, type Page } from '@playwright/test';

async function login(page: Page) {
	await page.goto('/admin/login');
	await page.getByLabel('Password').fill('test-password');
	await page.getByRole('button', { name: 'Log in' }).click();
	await expect(page).toHaveURL('/admin');
}

test('visiting /admin without a session redirects to login', async ({ page }) => {
	await page.goto('/admin');
	await expect(page).toHaveURL(/\/admin\/login/);
});

test('wrong password shows an error and stays on the login page', async ({ page }) => {
	await page.goto('/admin/login');
	await page.getByLabel('Password').fill('not-the-password');
	await page.getByRole('button', { name: 'Log in' }).click();
	await expect(page.getByText('Invalid password')).toBeVisible();
	await expect(page).toHaveURL(/\/admin\/login/);
});

test('correct password reaches the dashboard', async ({ page }) => {
	await login(page);
	await expect(page.getByRole('heading', { name: 'Products' })).toBeVisible();
	await expect(page.getByRole('button', { name: 'Log out' })).toBeVisible();
});

test('dashboard lists seeded products', async ({ page }) => {
	await login(page);
	await expect(page.getByText('Pearl Crown')).toBeVisible();
	await expect(page.getByText('Seafoam Tiara')).toBeVisible();
});

test('creating a product makes it appear in admin and on the public site', async ({ page }) => {
	await login(page);
	await page.getByRole('link', { name: '+ New product' }).click();

	await page.getByLabel('Name').fill('E2E Kelp Crown');
	await page.getByLabel('Price (GBP)').fill('12.50');
	await page.getByLabel('Quantity').fill('2');
	await page.getByLabel('Description').fill('Created by the e2e suite.');
	await page.getByRole('button', { name: 'Create product' }).click();

	// lands on the edit page for the new product
	await expect(page).toHaveURL(/\/admin\/products\/\d+/);
	await expect(page.getByRole('heading', { name: /E2E Kelp Crown/ })).toBeVisible();

	// and it is live on the storefront
	await page.goto('/products');
	await page.getByRole('link', { name: /E2E Kelp Crown/ }).click();
	await expect(page.getByText('£12.50')).toBeVisible();
});

test('logout ends the session', async ({ page }) => {
	await login(page);
	await page.getByRole('button', { name: 'Log out' }).click();
	await expect(page).toHaveURL(/\/admin\/login/);

	// session is gone server-side, not just the cookie UI
	await page.goto('/admin');
	await expect(page).toHaveURL(/\/admin\/login/);
});
