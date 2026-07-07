<script lang="ts">
	import { untrack } from 'svelte';

	let { data, form } = $props();

	// untrack: intentional one-time init from server data — edit forms don't re-init on navigation
	let keepUrls = $state<string[]>(untrack(() => data.images.map((i: { url: string }) => i.url)));
	let hero = $state<string>(untrack(() => data.product.hero ?? data.images[0]?.url ?? ''));

	function removeImage(url: string) {
		keepUrls = keepUrls.filter((u) => u !== url);
		if (hero === url) hero = keepUrls[0] ?? '';
	}
</script>

<svelte:head>
	<title>Edit: {data.product.name} — Admin</title>
</svelte:head>

<h1 class="mb-6 text-2xl font-bold">Edit: {data.product.name}</h1>

<form method="POST" action="?/update" enctype="multipart/form-data" class="flex flex-col gap-4 max-w-lg">
	{#if form?.error}
		<p class="text-sm text-red-500">{form.error}</p>
	{/if}

	<!-- Hidden fields for image state -->
	<input type="hidden" name="hero" value={hero} />
	{#each keepUrls as url}
		<input type="hidden" name="keep" value={url} />
	{/each}

	<!-- Current images -->
	{#if keepUrls.length > 0}
		<div>
			<p class="mb-2 text-sm font-medium">Current images</p>
			<div class="flex flex-wrap gap-2">
				{#each keepUrls as url}
					<div class="relative">
						<img src={url} alt="" class="h-24 w-24 rounded object-cover" />
						<!-- Star = set as hero -->
						<button
							type="button"
							onclick={() => (hero = url)}
							class="absolute bottom-0 left-0 rounded px-1 text-lg"
							title="Set as hero"
						>
							{hero === url ? '⭐' : '☆'}
						</button>
						<!-- Remove -->
						<button
							type="button"
							onclick={() => removeImage(url)}
							class="absolute bottom-0 right-0 rounded px-1 text-sm text-gray-400 hover:text-red-500"
							title="Remove"
						>
							✕
						</button>
					</div>
				{/each}
			</div>
		</div>
	{/if}

	<label class="flex flex-col gap-1">
		<span class="text-sm font-medium">Add images</span>
		<input type="file" name="files" multiple accept="image/*" />
	</label>

	<label class="flex flex-col gap-1">
		<span class="text-sm font-medium">Name</span>
		<input type="text" name="name" value={data.product.name} class="rounded border px-3 py-2" required />
	</label>

	<label class="flex flex-col gap-1">
		<span class="text-sm font-medium">Price (GBP)</span>
		<input type="number" name="price" step="0.01" value={data.product.price} class="rounded border px-3 py-2" required />
	</label>

	<label class="flex flex-col gap-1">
		<span class="text-sm font-medium">Quantity</span>
		<input type="number" name="quantity" value={data.product.quantity} class="rounded border px-3 py-2" />
	</label>

	<label class="flex flex-col gap-1">
		<span class="text-sm font-medium">Description</span>
		<textarea name="description" rows="4" class="rounded border px-3 py-2">{data.product.description ?? ''}</textarea>
	</label>

	<button type="submit" class="rounded bg-teal-400 py-2 font-bold text-white hover:bg-teal-300">
		Save changes
	</button>
</form>

<!-- Delete -->
<form
	method="POST"
	action="?/delete"
	class="mt-8"
	onsubmit={(e) => { if (!confirm('Delete this product?')) e.preventDefault(); }}
>
	<button type="submit" class="rounded border border-red-300 px-4 py-2 text-sm text-red-500 hover:bg-red-50">
		Delete product
	</button>
</form>
