import { describe, it, expect } from 'vitest';
import { isRedirect, type Redirect } from '@sveltejs/kit';
import { createSession } from '$lib/server/auth';
import { load } from '../routes/admin/+layout.server';
import { mockCookies } from './helpers';

function runGuard(cookies: unknown, pathname: string) {
	try {
		return load({ cookies, url: new URL(`http://localhost${pathname}`) } as never);
	} catch (e) {
		if (isRedirect(e)) return e;
		throw e;
	}
}

describe('admin auth guard', () => {
	it('redirects to /admin/login without a session', () => {
		const { cookies } = mockCookies();
		const result = runGuard(cookies, '/admin') as Redirect;
		expect(isRedirect(result)).toBe(true);
		expect(result.location).toBe('/admin/login');
		expect(result.status).toBe(303);
	});

	it('redirects on a nested admin route too', () => {
		const { cookies } = mockCookies();
		const result = runGuard(cookies, '/admin/products/3') as Redirect;
		expect(isRedirect(result)).toBe(true);
	});

	it('lets a valid session through', () => {
		const { cookies } = mockCookies();
		createSession(cookies);
		expect(runGuard(cookies, '/admin')).toEqual({});
	});

	it('rejects a forged session cookie', () => {
		const { cookies } = mockCookies({ mm_session: crypto.randomUUID() });
		const result = runGuard(cookies, '/admin') as Redirect;
		expect(isRedirect(result)).toBe(true);
	});

	it('never blocks the login page itself', () => {
		const { cookies } = mockCookies();
		expect(runGuard(cookies, '/admin/login')).toEqual({});
	});
});
