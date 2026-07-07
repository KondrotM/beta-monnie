<script lang="ts">
	import { cart } from '$lib/cart.svelte';

	let { data } = $props();
	let { product, images } = $derived(data);

	let inCart = $derived(cart.items.some((i) => i.id === product.id));

	function addToCart() {
		cart.add({
			id: product.id,
			name: product.name,
			price: product.price,
			hero: product.hero
		});
	}
</script>

<svelte:head>
	<title>{product.name} — Monnie Mermaid</title>
</svelte:head>

<div class="flex flex-wrap gap-6 py-6">
	<!-- Gallery — TODO: wire up Swiper with zoom -->
	<div class="w-full lg:w-2/3">
		{#if images.length > 0}
			<img src={images[0]} alt={product.name} class="w-full rounded" />
		{:else}
			<div class="aspect-square bg-gray-100 rounded flex items-center justify-center text-gray-400">
				No image
			</div>
		{/if}
		<!-- TODO: thumbnail strip / Swiper slider -->
	</div>

	<!-- Product info -->
	<div class="flex flex-col gap-3 lg:flex-1">
		<h1 class="text-3xl">{product.name}</h1>
		<p class="text-xl">£{product.price % 1 === 0 ? `${product.price}.00` : product.price}</p>
		<p>{product.description ?? ''}</p>

		{#if inCart}
			<p class="text-green-600">Added to cart!</p>
			<a href="/cart" class="underline">View cart</a>
		{:else if product.quantity > 0}
			<button
				onclick={addToCart}
				class="rounded bg-teal-400 px-6 py-2 font-bold text-white hover:bg-teal-300"
			>
				Add to Cart
			</button>
		{:else}
			<p class="italic text-gray-500">Out of stock</p>
		{/if}
	</div>
</div>
