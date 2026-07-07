<script lang="ts">
	let { children } = $props();
</script>

<nav class="flex gap-4 border-b px-6 py-3 text-sm">
	<a href="/admin" class="font-bold">Dashboard</a>
	<a href="/admin/products/new">+ New product</a>
	<form method="POST" action="/admin/login?/logout" class="ml-auto">
		<button type="submit" class="text-gray-500 hover:text-red-500">Log out</button>
	</form>
</nav>

<div class="mx-auto max-w-[1080px] px-4 py-6">
	{@render children()}
</div>
