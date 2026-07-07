import bcrypt from 'bcrypt';
import { eq } from 'drizzle-orm';
import type { Cookies } from '@sveltejs/kit';
import { db } from './db';
import { adminSessions } from './db/schema';
import { env } from '$env/dynamic/private';

const COOKIE_NAME = 'mm_session';
const SESSION_DAYS = 30;
const SESSION_MS = SESSION_DAYS * 24 * 60 * 60 * 1000;

export async function validatePassword(password: string): Promise<boolean> {
	if (!env.ADMIN_PASSWORD_HASH) throw new Error('ADMIN_PASSWORD_HASH is not set');
	return bcrypt.compare(password, env.ADMIN_PASSWORD_HASH);
}

export function createSession(cookies: Cookies): void {
	const id = crypto.randomUUID();
	const expiresAt = new Date(Date.now() + SESSION_MS);

	db.insert(adminSessions).values({ id, expiresAt }).run();

	cookies.set(COOKIE_NAME, id, {
		httpOnly: true,
		secure: env.NODE_ENV === 'production',
		sameSite: 'lax',
		maxAge: SESSION_MS / 1000,
		path: '/'
	});
}

export function validateSession(cookies: Cookies): boolean {
	const id = cookies.get(COOKIE_NAME);
	if (!id) return false;

	const session = db
		.select()
		.from(adminSessions)
		.where(eq(adminSessions.id, id))
		.get();

	if (!session) return false;
	return session.expiresAt > new Date();
}

export function deleteSession(cookies: Cookies): void {
	const id = cookies.get(COOKIE_NAME);
	if (id) db.delete(adminSessions).where(eq(adminSessions.id, id)).run();
	cookies.delete(COOKIE_NAME, { path: '/' });
}
