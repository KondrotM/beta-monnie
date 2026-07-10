import { describe, it, expect } from 'vitest';
import { isRedirect, isActionFailure, type Redirect, type ActionFailure } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { adminSessions, settings } from '$lib/server/db/schema';
import { actions } from '../routes/admin/login/+page.server';
import { mockCookies, formRequest } from './helpers';

async function runAction(fn: (event: never) => unknown, event: Record<string, unknown>) {
	try {
		return await fn(event as never);
	} catch (e) {
		if (isRedirect(e)) return e;
		throw e;
	}
}

describe('login action', () => {
	it('correct password: creates a session and redirects to /admin', async () => {
		const { cookies, store } = mockCookies();
		const result = (await runAction(actions.login, {
			request: formRequest({ password: 'test-password' }),
			cookies
		})) as Redirect;

		expect(isRedirect(result)).toBe(true);
		expect(result.location).toBe('/admin');
		expect(store.has('mm_session')).toBe(true);
		expect(db.select().from(adminSessions).all()).toHaveLength(1);
	});

	it('wrong password: fails with 401 and no session', async () => {
		const { cookies, store } = mockCookies();
		const result = (await runAction(actions.login, {
			request: formRequest({ password: 'nope' }),
			cookies
		})) as ActionFailure<{ error: string }>;

		expect(isActionFailure(result)).toBe(true);
		expect(result.status).toBe(401);
		expect(result.data.error).toMatch(/invalid/i);
		expect(store.has('mm_session')).toBe(false);
		expect(db.select().from(adminSessions).all()).toHaveLength(0);
	});

	it('missing password field: fails with 401', async () => {
		const { cookies } = mockCookies();
		const result = (await runAction(actions.login, {
			request: formRequest({}),
			cookies
		})) as ActionFailure<{ error: string }>;
		expect(isActionFailure(result)).toBe(true);
		expect(result.status).toBe(401);
	});

	it('tells the admin how to fix an unconfigured password instead of a bare 500', async () => {
		db.delete(settings).run();
		const { cookies } = mockCookies();
		const result = (await runAction(actions.login, {
			request: formRequest({ password: 'test-password' }),
			cookies
		})) as ActionFailure<{ error: string }>;

		expect(isActionFailure(result)).toBe(true);
		expect(result.status).toBe(500);
		expect(result.data.error).toMatch(/set-password/);
	});

	it('logout: deletes the session and redirects to the login page', async () => {
		const { cookies, store } = mockCookies();
		await runAction(actions.login, {
			request: formRequest({ password: 'test-password' }),
			cookies
		});
		expect(db.select().from(adminSessions).all()).toHaveLength(1);

		const result = (await runAction(actions.logout, { cookies })) as Redirect;

		expect(isRedirect(result)).toBe(true);
		expect(result.location).toBe('/admin/login');
		expect(store.has('mm_session')).toBe(false);
		expect(db.select().from(adminSessions).all()).toHaveLength(0);
	});
});
