<script lang="ts">
	let { data } = $props();
</script>

<svelte:head>
	<title>Admin — Monnie Mermaid</title>
</svelte:head>

<h1 class="mb-6 text-2xl font-bold">Products</h1>

<div class="flex flex-col gap-3">
	{#each data.products as product (product.id)}
		<div class="flex items-center gap-4 rounded border p-3">
			{#if product.hero}
				<img src={product.hero} alt={product.name} class="h-16 w-16 rounded object-cover" />
			{/if}
			<div class="flex-1">
				<p class="font-bold">{product.name}</p>
				<p class="text-sm text-gray-600">£{product.price} · qty: {product.quantity}</p>
			</div>
			<a href="/admin/products/{product.id}" class="text-sm underline">Edit</a>
		</div>
	{:else}
		<p class="text-gray-500">No products yet. <a href="/admin/products/new" class="underline">Add one.</a></p>
	{/each}
</div>
