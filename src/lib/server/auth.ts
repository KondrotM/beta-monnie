import bcrypt from 'bcrypt';
import { eq } from 'drizzle-orm';
import type { Cookies } from '@sveltejs/kit';
import { db } from './db';
import { adminSessions, settings } from './db/schema';
import { env } from '$env/dynamic/private';

const COOKIE_NAME = 'mm_session';
const SESSION_DAYS = 30;
const SESSION_MS = SESSION_DAYS * 24 * 60 * 60 * 1000;

// The hash lives in the DB, not .env: dotenv-expand treats the `$` sections
// of a bcrypt hash as variable references and silently corrupts the value.
export async function validatePassword(password: string): Promise<boolean> {
	const row = db.select().from(settings).where(eq(settings.key, 'admin_password_hash')).get();
	if (!row) throw new Error('Admin password not set — run: npm run set-password');
	return bcrypt.compare(password, row.value);
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
