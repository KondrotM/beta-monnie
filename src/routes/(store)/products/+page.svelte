<script lang="ts">
	let { data } = $props();
</script>

<svelte:head>
	<title>Products — Monnie Mermaid</title>
</svelte:head>

<div class="py-4">
	<!-- TODO: Banner image linking to Etsy shop -->
</div>

<div class="flex flex-col gap-4 p-2">
	{#each data.products as product (product.id)}
		<a href="/products/{product.id}" class="flex flex-row rounded-md overflow-hidden shadow-sm">
			<img
				src={product.hero ?? 'https://dummyimage.com/300x400/eee/999?text=No+Image'}
				alt={product.name}
				class="w-36 object-cover aspect-[2/3]"
			/>
			<div class="flex flex-col justify-center gap-1 bg-teal-400 px-4 text-white w-full">
				<div class="text-xl font-bold">{product.name}</div>
				<div class="text-sm">{product.description ?? ''}</div>
				<div class="text-sm italic">{product.quantity > 0 ? 'Available' : 'Sold out'}</div>
			</div>
		</a>
	{/each}
</div>
