import { describe, it, expect } from 'vitest';
import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { adminSessions } from '$lib/server/db/schema';
import { validatePassword, createSession, validateSession, deleteSession } from '$lib/server/auth';
import { mockCookies } from './helpers';

describe('validatePassword', () => {
	it('accepts the correct password', async () => {
		expect(await validatePassword('test-password')).toBe(true);
	});

	it('rejects a wrong password', async () => {
		expect(await validatePassword('wrong')).toBe(false);
	});

	it('rejects an empty password', async () => {
		expect(await validatePassword('')).toBe(false);
	});

	it('throws when ADMIN_PASSWORD_HASH is not set', async () => {
		const saved = process.env.ADMIN_PASSWORD_HASH;
		delete process.env.ADMIN_PASSWORD_HASH;
		try {
			await expect(validatePassword('anything')).rejects.toThrow('ADMIN_PASSWORD_HASH');
		} finally {
			process.env.ADMIN_PASSWORD_HASH = saved;
		}
	});
});

describe('sessions', () => {
	it('createSession stores a row and sets an httpOnly cookie', () => {
		const { cookies, setCalls } = mockCookies();
		createSession(cookies);

		expect(setCalls).toHaveLength(1);
		const call = setCalls[0];
		expect(call.name).toBe('mm_session');
		expect(call.opts.httpOnly).toBe(true);
		expect(call.opts.path).toBe('/');

		const row = db.select().from(adminSessions).where(eq(adminSessions.id, call.value)).get();
		expect(row).toBeDefined();
		expect(row!.expiresAt.getTime()).toBeGreaterThan(Date.now());
	});

	it('validateSession accepts a session created by createSession', () => {
		const { cookies } = mockCookies();
		createSession(cookies);
		expect(validateSession(cookies)).toBe(true);
	});

	it('validateSession rejects when there is no cookie', () => {
		const { cookies } = mockCookies();
		expect(validateSession(cookies)).toBe(false);
	});

	it('validateSession rejects a cookie with no matching row', () => {
		const { cookies } = mockCookies({ mm_session: 'not-a-real-session' });
		expect(validateSession(cookies)).toBe(false);
	});

	it('validateSession rejects an expired session', () => {
		const id = crypto.randomUUID();
		db.insert(adminSessions)
			.values({ id, expiresAt: new Date(Date.now() - 1000) })
			.run();
		const { cookies } = mockCookies({ mm_session: id });
		expect(validateSession(cookies)).toBe(false);
	});

	it('deleteSession removes the row and the cookie', () => {
		const { cookies, store } = mockCookies();
		createSession(cookies);
		const id = store.get('mm_session')!;

		deleteSession(cookies);

		expect(store.has('mm_session')).toBe(false);
		const row = db.select().from(adminSessions).where(eq(adminSessions.id, id)).get();
		expect(row).toBeUndefined();
		// a deleted session no longer validates
		expect(validateSession(mockCookies({ mm_session: id }).cookies)).toBe(false);
	});
});
