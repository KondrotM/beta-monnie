import { defineConfig } from '@playwright/test';

export default defineConfig({
	testDir: 'e2e',
	globalSetup: './e2e/global-setup.ts',
	// One worker: the tests share a single SQLite file; parallelism isn't
	// worth the flakiness at this suite size.
	workers: 1,
	use: { baseURL: 'http://localhost:4173' },
	webServer: {
		command: 'npm run dev -- --port 4173 --strictPort',
		url: 'http://localhost:4173',
		reuseExistingServer: false,
		env: {
			// Points the dev server at the throwaway DB created by global-setup.
			// (process.env wins over .env, so local.db is never touched.)
			// The admin password hash is seeded into that DB by global-setup;
			// the plaintext is 'test-password'.
			DATABASE_URL: '.e2e.db'
		}
	}
});
