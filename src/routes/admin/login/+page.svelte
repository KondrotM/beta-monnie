<script lang="ts">
	import type { ActionData } from './$types';
	let { form }: { form: ActionData } = $props();
</script>

<svelte:head>
	<title>Admin login</title>
</svelte:head>

<div class="mx-auto mt-24 max-w-sm">
	<h1 class="mb-6 text-2xl font-bold">Admin</h1>

	<form method="POST" class="flex flex-col gap-4">
		<label class="flex flex-col gap-1">
			<span class="text-sm text-gray-600">Password</span>
			<input
				type="password"
				name="password"
				class="rounded border px-3 py-2"
				autocomplete="current-password"
				required
			/>
		</label>

		{#if form?.error}
			<p class="text-sm text-red-500">{form.error}</p>
		{/if}

		<button type="submit" class="rounded bg-blue-400 py-2 font-bold text-white hover:bg-blue-300">
			Log in
		</button>
	</form>
</div>
