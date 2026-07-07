<script lang="ts">
	import { cart } from '$lib/cart.svelte';

	// Instagram handle — update if it changes
	const INSTAGRAM = 'https://www.instagram.com/monniemermaidofficial/';
</script>

<svelte:head>
	<title>Cart — Monnie Mermaid</title>
</svelte:head>

<h1 class="py-6 text-2xl font-bold">Shopping Cart</h1>

{#if cart.items.length === 0}
	<p class="text-gray-500">Your cart is empty.</p>
	<a href="/products" class="mt-4 inline-block underline">Browse products</a>
{:else}
	<div class="flex flex-col gap-4">
		{#each cart.items as item (item.id)}
			<div class="flex items-center gap-4 border-b pb-4">
				{#if item.hero}
					<img src={item.hero} alt={item.name} class="h-20 w-20 rounded object-cover" />
				{/if}
				<div class="flex-1">
					<p class="font-bold">{item.name}</p>
					<p class="text-sm text-gray-600">Qty: {item.quantity}</p>
					<p>£{(item.price * item.quantity).toFixed(2)}</p>
				</div>
				<button
					onclick={() => cart.remove(item.id)}
					class="text-gray-400 hover:text-red-500"
					aria-label="Remove"
				>
					✕
				</button>
			</div>
		{/each}

		<div class="mt-2 text-xl font-bold">
			Total: £{cart.total.toFixed(2)}
		</div>
	</div>

	<!-- Checkout instructions -->
	<div class="mt-8 rounded-md bg-blue-50 p-6">
		<h2 class="text-xl font-bold">How to buy</h2>
		<ol class="mt-3 flex flex-col gap-2 list-decimal pl-5">
			<li>Take a screenshot of this page showing your cart.</li>
			<li>
				Send it to me on Instagram:
				<a href={INSTAGRAM} target="_blank" rel="noopener" class="underline text-blue-600">
					@monniemermaidofficial
				</a>
			</li>
			<li>I'll confirm availability and arrange payment with you directly.</li>
		</ol>
	</div>

	<button
		onclick={() => cart.clear()}
		class="mt-6 text-sm text-gray-400 underline hover:text-red-400"
	>
		Clear cart
	</button>
{/if}
