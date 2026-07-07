# Monnie Mermaid — Rebuild

A storefront for handmade mermaid crowns and tiaras (sister's business). This is a ground-up rewrite of the old Remix/Express/Postgres stack, deliberately scaled back to match the actual scope: a small catalogue site with an admin panel, a handful of products, and very few users.

## Stack

| Concern | Choice | Why |
|---|---|---|
| Framework | SvelteKit (Svelte 5) | Active maintenance, same server-load/form-action philosophy as Remix, simpler |
| Database | SQLite via better-sqlite3 | No daemon, one file, trivially backed up |
| ORM | Drizzle | Lightweight, type-safe, handles migrations |
| Styling | Tailwind CSS v4 | Same as before |
| Image gallery | Swiper | Same as before, keep the zoom/swipe UX |
| Auth | DB-backed session cookie | Simple — one hardcoded admin account in .env |
| Images | Local in dev, S3 in prod | No AWS creds needed to develop |
| Deployment | Single Docker container (adapter-node) | Replaces 4 containers + 3 networks |

## Running in dev

```bash
cp .env.example .env          # fill in ADMIN_PASSWORD_HASH (see below)
npm run db:push               # creates local.db and runs schema
npm run dev                   # starts on http://localhost:5173
```

No Docker needed locally. The database is `local.db` in the project root (gitignored).

### Generating an admin password hash

```bash
node -e "import('bcrypt').then(b => b.default.hash('yourpassword', 10).then(console.log))"
```

Paste the output as `ADMIN_PASSWORD_HASH` in `.env`.

## Environment variables

| Variable | Dev | Prod | Purpose |
|---|---|---|---|
| `DATABASE_URL` | `local.db` | `/data/prod.db` | SQLite file path |
| `ADMIN_EMAIL` | any | real email | Display only |
| `ADMIN_PASSWORD_HASH` | bcrypt hash | bcrypt hash | Admin login |
| `NODE_ENV` | `development` | `production` | Controls image storage |
| `AWS_ACCESS_KEY_ID` | not needed | required | S3 uploads |
| `AWS_SECRET_ACCESS_KEY` | not needed | required | S3 uploads |
| `AWS_REGION` | — | `eu-west-2` | S3 region |
| `AWS_S3_BUCKET` | — | `monniemermaid` | S3 bucket name |
| `CDN_URL` | — | `cdn.mermaidmonnieofficial.com` | CDN prefix for image URLs |

## File structure

```
src/
  lib/
    server/
      db/
        schema.ts        ← Drizzle table definitions
        index.ts         ← db instance (better-sqlite3 + drizzle)
      auth.ts            ← session create/validate/delete
      images.ts          ← upload helper: saves locally in dev, S3 in prod
    cart.svelte.ts       ← Svelte 5 class-based cart store (localStorage)
  routes/
    +layout.svelte       ← nav (hamburger + logo + cart icon) + footer
    +page.svelte         ← home
    products/
      +page.server.ts    ← load all products
      +page.svelte       ← product listing
      [id]/
        +page.server.ts  ← load single product with images
        +page.svelte     ← product detail (Swiper gallery + add to cart)
    cart/
      +page.svelte       ← cart contents + IG checkout instructions
    about/+page.svelte
    contact/+page.svelte
    admin/
      +layout.server.ts  ← auth guard: redirects to /admin/login if no valid session
      +layout.svelte     ← admin nav
      +page.server.ts    ← load all products for dashboard
      +page.svelte       ← product list with edit/delete links
      login/
        +page.server.ts  ← form action: validate password, create session
        +page.svelte
      products/
        new/
          +page.server.ts  ← form action: create product + upload images
          +page.svelte
        [id]/
          +page.server.ts  ← load product, actions: update / delete
          +page.svelte     ← edit form (image management: star=hero, trash=remove)
```

## Database schema

Three tables. See `src/lib/server/db/schema.ts` for the Drizzle definitions.

```
products        id, name, price, description, quantity, hero, created_at
product_images  id, product_id→products, url, sort_order
admin_sessions  id (UUID), created_at, expires_at
```

## Auth

One admin account. Credentials live in `.env` (`ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH`).

Flow:
1. POST `/admin/login` → compare password with bcrypt hash → insert row in `admin_sessions` → set `mm_session` cookie (httpOnly, secure in prod)
2. Every admin route's `+layout.server.ts` reads the cookie and checks it against `admin_sessions`
3. Logout deletes the session row and clears the cookie

Session helper lives in `src/lib/server/auth.ts`.

## Image handling

`src/lib/server/images.ts` exports a single `uploadImages(files: File[])` function:
- **Dev** (`NODE_ENV !== 'production'`): writes to `static/uploads/`, returns `/uploads/{filename}` URLs
- **Prod**: uploads to S3, returns `https://cdn.mermaidmonnieofficial.com/{filename}` URLs

To enable S3 uploads in prod, install: `npm install @aws-sdk/client-s3 @aws-sdk/lib-storage`

## Cart

`src/lib/cart.svelte.ts` — a Svelte 5 class using `$state`. Persists to `localStorage`. Import and use directly in `.svelte` components:

```svelte
<script>
  import { cart } from '$lib/cart.svelte';
</script>
<button onclick={() => cart.add(product)}>Add to cart</button>
```

The checkout flow is intentionally simple: the cart page prints the cart contents and asks the customer to screenshot it and send it via Instagram DM. No payment integration.

## Testing

Vitest, configured in `vite.config.ts` (`test` block). **This project is developed TDD: write or update tests before implementing features.**

```bash
npm test          # run once
npm run test:watch
```

How it works:
- Tests live in `src/tests/*.test.ts`
- Each test file gets a fresh in-memory SQLite DB (`DATABASE_URL=:memory:` + fresh module graph per file). `src/tests/setup.ts` applies the real `schema.ts` via `drizzle-kit/api`, so tests can't drift from the schema. A `beforeEach` empties all tables.
- SvelteKit virtual modules (`$app/environment`, `$env/dynamic/private`) are aliased to test doubles in `src/tests/mocks/`. Default is server-side dev (`browser: false, dev: true`); override per-file with `vi.mock('$app/environment', ...)` (see `cart.test.ts`).
- `src/tests/helpers.ts` has `mockCookies()`, `seedProduct()`, `seedImages()`, `formRequest()`.
- Form actions and loads are tested by importing the `+page.server.ts` module directly and calling `actions.*` / `load` with mock events. SvelteKit's `redirect()`/`error()` **throw** — catch and inspect with `isRedirect()` / `isHttpError()`; `fail()` returns a value — check with `isActionFailure()`.
- The test admin password is `test-password` (hash set in `vite.config.ts` `test.env`).

## Svelte 5 notes

This project uses Svelte 5. Key differences from Svelte 4:
- Reactivity uses **runes**: `$state`, `$derived`, `$effect`, `$props`
- Event handlers use `onclick={}` not `on:click={}`
- Slots are replaced by **snippets**: `{#snippet foo()}` / `{@render foo()}`
- Stores (`writable`, `readable`) still work but prefer runes in new code

## What's been done

- [x] SvelteKit scaffolded (adapter-node, Tailwind v4, Drizzle + better-sqlite3)
- [x] Real database schema defined
- [x] Auth helper (session create/validate/delete)
- [x] Image upload helper (dev=local, prod=S3 stub)
- [x] Cart store (Svelte 5 class + localStorage)
- [x] Nav layout (hamburger menu, logo, cart icon)
- [x] Products listing + product detail pages
- [x] Cart page (print cart, IG checkout instructions)
- [x] About + contact pages (placeholder content)
- [x] Admin: login, dashboard, create/edit/delete products with image upload
- [x] Type-checks clean (`npm run check` — 0 errors, 0 warnings)

## What still needs building

- [ ] Swiper gallery with zoom on product detail page (`npm install swiper`)
- [ ] Home page content (hero images, welcome text — waiting on copy/images)
- [ ] Copy assets from old frontend/public/ into static/
- [ ] Seed script with existing product data (source: old repo's postgres/setup.sql; add as `npm run db:seed`)
- [ ] Dockerfile + docker-compose.yml for prod (see RUNBOOK.md for the deploy plan)
- [ ] Install AWS SDK before prod deploy: `npm install @aws-sdk/client-s3 @aws-sdk/lib-storage`
