import { fail, redirect } from '@sveltejs/kit';
import { validatePassword, createSession, deleteSession } from '$lib/server/auth';

export const actions = {
	default: async ({ request, cookies }) => {
		const data = await request.formData();
		const password = data.get('password')?.toString() ?? '';

		const ok = await validatePassword(password);
		if (!ok) return fail(401, { error: 'Invalid password' });

		createSession(cookies);
		redirect(303, '/admin');
	},

	logout: async ({ cookies }) => {
		deleteSession(cookies);
		redirect(303, '/admin/login');
	}
};
