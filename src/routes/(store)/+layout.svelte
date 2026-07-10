<script lang="ts">
	import { cart } from '$lib/cart.svelte';

	let { children } = $props();
	let menuOpen = $state(false);
</script>

{#if menuOpen}
	<!-- Overlay to close menu on outside click -->
	<div
		class="fixed inset-0 z-40 bg-black/20"
		role="presentation"
		onclick={() => (menuOpen = false)}
	></div>
{/if}

<!-- Slide-in nav menu -->
<nav
	class="fixed top-0 left-0 z-50 flex h-full w-72 flex-col justify-between bg-white shadow-lg transition-transform duration-300"
	style:transform={menuOpen ? 'translateX(0)' : 'translateX(-100%)'}
	aria-hidden={!menuOpen}
>
	<div class="flex flex-col p-6 pt-12 gap-6">
		<button class="self-start" onclick={() => (menuOpen = false)} aria-label="Close menu">
			✕
		</button>
		<a class="text-2xl" href="/" onclick={() => (menuOpen = false)}>Home</a>
		<a class="text-2xl" href="/products" onclick={() => (menuOpen = false)}>Products</a>
		<a class="text-2xl" href="/about" onclick={() => (menuOpen = false)}>About</a>
		<a class="text-2xl" href="/contact" onclick={() => (menuOpen = false)}>Contact</a>
	</div>
	<div class="p-6 opacity-50 text-sm">Monnie Mermaid</div>
</nav>

<!-- Top bar -->
<header class="flex items-center justify-between px-6 py-4 max-w-[1080px] mx-auto w-full">
	<button onclick={() => (menuOpen = true)} aria-label="Open menu" class="text-xl">☰</button>

	<a href="/">
		<img src="/assets/logo-edit-bw-invert.png" alt="Monnie Mermaid" class="h-20" />
	</a>

	<a href="/cart" class="relative" aria-label="Cart">
		🧺
		{#if cart.count > 0}
			<span
				class="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-blue-400 text-xs text-white"
			>
				{cart.count}
			</span>
		{/if}
	</a>
</header>

<main class="mx-auto w-full max-w-[1080px] px-4">
	{@render children()}
</main>

<footer class="mx-auto mt-12 w-full max-w-[1080px] px-6 py-8 text-sm text-gray-500">
	<div class="flex justify-between">
		<span>&copy; {new Date().getFullYear()} Monnie Mermaid</span>
		<span>Made with ♡</span>
	</div>
</footer>
