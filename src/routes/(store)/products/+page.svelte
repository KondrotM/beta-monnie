<script lang="ts">
	let { data } = $props();
</script>

<svelte:head>
	<title>Products — Monnie Mermaid</title>
</svelte:head>

<div class="py-4">
	<!-- TODO: Banner image linking to Etsy shop -->
</div>

<div class="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 sm:gap-x-6">
	{#each data.products as product (product.id)}
		<a href="/products/{product.id}" class="group">
			<div class="relative aspect-[3/4] overflow-hidden rounded-lg bg-gray-100">
				<img
					src={product.hero ?? 'https://dummyimage.com/600x800/eee/999?text=No+Image'}
					alt={product.name}
					loading="lazy"
					class="h-full w-full object-cover transition duration-300 group-hover:scale-105
						{product.quantity === 0 ? 'opacity-60 saturate-50' : ''}"
				/>
			</div>
			<div class="mt-3">
				<h2 class="text-sm sm:text-base">{product.name}</h2>
				<p class="mt-0.5 text-sm text-gray-500 sm:text-base">
					{product.quantity > 0 ? 'Available' : 'Sold out'}
				</p>
			</div>
		</a>
	{/each}
</div>
