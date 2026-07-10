<script lang="ts">
	import { cart } from '$lib/cart.svelte';
	import { formatPrice } from '$lib/format';

	let { data } = $props();
	let { product, images } = $derived(data);

	let inCart = $derived(cart.items.some((i) => i.id === product.id));

	let strip: HTMLDivElement | undefined = $state();
	let dialog: HTMLDialogElement | undefined = $state();
	let current = $state(0);
	let lightboxSrc = $state<string | null>(null);

	function goTo(i: number) {
		current = i;
		strip?.scrollTo({ left: i * strip.clientWidth, behavior: 'smooth' });
	}

	// Keep the counter/thumbnails in sync when the user swipes the strip
	function onScroll() {
		if (strip) current = Math.round(strip.scrollLeft / strip.clientWidth);
	}

	function openLightbox(src: string) {
		lightboxSrc = src;
		dialog?.showModal();
	}

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

{#key product.id}
	<div class="grid gap-8 py-6 lg:grid-cols-5 lg:gap-12">
		<!-- Gallery: CSS scroll-snap strip — swipeable on touch, no dependency -->
		<div class="lg:col-span-3">
			{#if images.length > 0}
				<div class="relative overflow-hidden rounded-xl">
					<div
						bind:this={strip}
						onscroll={onScroll}
						data-testid="gallery"
						class="flex snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
					>
						{#each images as src, i (src)}
							<button
								type="button"
								class="w-full shrink-0 snap-center"
								onclick={() => openLightbox(src)}
								aria-label="Zoom image {i + 1}"
							>
								<img
									{src}
									alt="{product.name} — photo {i + 1} of {images.length}"
									class="aspect-square w-full object-cover"
									loading={i === 0 ? 'eager' : 'lazy'}
								/>
							</button>
						{/each}
					</div>

					{#if images.length > 1}
						<div
							class="pointer-events-none absolute right-3 bottom-3 rounded-full bg-black/50 px-3 py-1 text-xs text-white"
						>
							{current + 1} / {images.length}
						</div>
					{/if}
				</div>

				{#if images.length > 1}
					<div data-testid="thumbnails" class="mt-3 flex gap-2 overflow-x-auto pb-1">
						{#each images as src, i (src)}
							<button
								type="button"
								onclick={() => goTo(i)}
								aria-label="Show image {i + 1}"
								aria-current={current === i}
								class="h-16 w-16 shrink-0 overflow-hidden rounded-md transition
									{current === i ? 'ring-2 ring-teal-400' : 'opacity-60 hover:opacity-100'}"
							>
								<img {src} alt="" class="h-full w-full object-cover" />
							</button>
						{/each}
					</div>
				{/if}
			{:else}
				<div
					class="flex aspect-square items-center justify-center rounded-xl bg-gray-100 text-gray-400"
				>
					No image
				</div>
			{/if}
		</div>

		<!-- Product info -->
		<div class="lg:col-span-2">
			<div class="flex flex-col gap-4 lg:sticky lg:top-6">
				<div>
					<h1 class="text-2xl sm:text-3xl">{product.name}</h1>
					<p class="mt-1 text-xl text-gray-700">{formatPrice(product.price)}</p>
				</div>

				{#if inCart}
					<p class="text-green-600">Added to cart!</p>
					<a href="/cart" class="underline">View cart</a>
				{:else if product.quantity > 0}
					<button
						onclick={addToCart}
						class="rounded-full bg-teal-400 px-8 py-3 font-bold text-white transition hover:bg-teal-300"
					>
						Add to Cart
					</button>
				{:else}
					<p class="italic text-gray-500">Sold out</p>
				{/if}

				{#if product.description}
					<p class="leading-relaxed whitespace-pre-line text-gray-600">{product.description}</p>
				{/if}
			</div>
		</div>
	</div>
{/key}

<!-- Fullscreen lightbox (native <dialog>: Escape closes it for free) -->
<dialog
	bind:this={dialog}
	onclick={(e) => {
		if (e.target === dialog) dialog?.close();
	}}
	class="m-auto bg-transparent backdrop:bg-black/80"
>
	{#if lightboxSrc}
		<button type="button" onclick={() => dialog?.close()} aria-label="Close zoomed image">
			<img src={lightboxSrc} alt={product.name} class="max-h-[90vh] max-w-[90vw] object-contain" />
		</button>
	{/if}
</dialog>
