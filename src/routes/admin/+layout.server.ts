import { redirect } from '@sveltejs/kit';
import { validateSession } from '$lib/server/auth';

export function load({ cookies, url }) {
	// Login page skips the auth check
	if (url.pathname === '/admin/login') return {};

	if (!validateSession(cookies)) {
		redirect(303, '/admin/login');
	}

	return {};
}
