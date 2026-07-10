import { fail, redirect } from '@sveltejs/kit';
import { validatePassword, createSession, deleteSession } from '$lib/server/auth';

// Both actions must be named: SvelteKit forbids mixing `default` with
// named actions in one route (any POST 500s if you try).
export const actions = {
	login: async ({ request, cookies }) => {
		const data = await request.formData();
		const password = data.get('password')?.toString() ?? '';

		let ok: boolean;
		try {
			ok = await validatePassword(password);
		} catch {
			return fail(500, { error: 'Admin password not set on the server — run: npm run set-password' });
		}
		if (!ok) return fail(401, { error: 'Invalid password' });

		createSession(cookies);
		redirect(303, '/admin');
	},

	logout: async ({ cookies }) => {
		deleteSession(cookies);
		redirect(303, '/admin/login');
	}
};
