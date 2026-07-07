/// <reference types="vitest/config" />
import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { fileURLToPath } from 'url';

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()],
	test: {
		include: ['src/tests/**/*.test.ts'],
		environment: 'node',
		setupFiles: ['src/tests/setup.ts'],
		// Each test file gets its own module graph, so DATABASE_URL=:memory:
		// means a fresh, isolated database per file.
		env: {
			DATABASE_URL: ':memory:',
			ADMIN_EMAIL: 'admin@test.local',
			// bcrypt hash of 'test-password'
			ADMIN_PASSWORD_HASH: '$2b$10$us7v.pYfkcnZ8tW8NLsPJex8k4uKmvcohHT9yf9/KpqByHYTJky8G'
		},
		alias: {
			// SvelteKit virtual modules don't exist outside the kit runtime;
			// point them at test doubles. Individual tests can still override
			// with vi.mock (e.g. cart tests set browser: true).
			'$app/environment': fileURLToPath(new URL('./src/tests/mocks/app-environment.ts', import.meta.url)),
			'$env/dynamic/private': fileURLToPath(new URL('./src/tests/mocks/env-dynamic-private.ts', import.meta.url))
		}
	}
});
