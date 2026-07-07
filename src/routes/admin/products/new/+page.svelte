<script lang="ts">
	import type { ActionData } from './$types';
	let { form }: { form: ActionData } = $props();
</script>

<svelte:head>
	<title>New product — Admin</title>
</svelte:head>

<h1 class="mb-6 text-2xl font-bold">New product</h1>

<form method="POST" enctype="multipart/form-data" class="flex flex-col gap-4 max-w-lg">
	{#if form?.error}
		<p class="text-sm text-red-500">{form.error}</p>
	{/if}

	<label class="flex flex-col gap-1">
		<span class="text-sm font-medium">Name</span>
		<input type="text" name="name" class="rounded border px-3 py-2" required />
	</label>

	<label class="flex flex-col gap-1">
		<span class="text-sm font-medium">Price (GBP)</span>
		<input type="number" name="price" step="0.01" min="0" class="rounded border px-3 py-2" required />
	</label>

	<label class="flex flex-col gap-1">
		<span class="text-sm font-medium">Quantity</span>
		<input type="number" name="quantity" min="0" value="1" class="rounded border px-3 py-2" />
	</label>

	<label class="flex flex-col gap-1">
		<span class="text-sm font-medium">Description</span>
		<textarea name="description" rows="4" class="rounded border px-3 py-2"></textarea>
	</label>

	<label class="flex flex-col gap-1">
		<span class="text-sm font-medium">Images (first will be the hero)</span>
		<input type="file" name="files" multiple accept="image/*" />
	</label>

	<button type="submit" class="rounded bg-teal-400 py-2 font-bold text-white hover:bg-teal-300">
		Create product
	</button>
</form>
