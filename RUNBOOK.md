# Monnie Mermaid — Runbook

How to run, administer, and eventually deploy this thing. Written for future-you
picking this up cold. (CLAUDE.md is the doc for Claude; this one's for humans.)

---

## The 30-second refresher

One SvelteKit app. Storefront + admin panel in the same codebase. SQLite database
(`local.db`, a single file in the project root — no daemon, no container). No payment
integration: customers screenshot their cart and DM it to the Instagram account.
Images save to `static/uploads/` in dev and go to S3 in prod.

There is no Docker locally. You just run `npm run dev`.

---

## Day-to-day: running it locally

```bash
cd rebuild
npm run dev
```

Open http://localhost:5173. That's it — the database already exists (`local.db`).

If you're on a fresh clone / new machine:

```bash
npm install
npx playwright install chromium   # one-off, for the e2e tests
cp .env.example .env
npm run db:push           # creates local.db from the schema
npm run set-password      # prompts for the admin password
npm run dev
```

### Sanity checks

```bash
npm test                  # unit tests (vitest) — should be all green
npm run test:e2e          # browser tests (Playwright, headless Chromium)
npm run check             # typecheck — should be 0 errors, 0 warnings
npm run build             # confirm it builds for prod
```

Both test layers use throwaway databases — they never touch `local.db`.
The e2e suite drives a real headless browser through the actual pages
(login, product CRUD, cart flow), so it catches things unit tests can't.
On a new machine, run `npx playwright install chromium` once first.

Use `npm run test:watch` while developing. The project is developed TDD:
write the test first, watch it fail, then implement.

---

## Admin panel

- **URL:** http://localhost:5173/admin
- **Login:** password only. Sessions last 30 days.
- **Add a product:** Admin → New product. Name + price required. First uploaded
  image becomes the hero automatically.
- **Edit a product:** click it in the dashboard. On the edit page:
  - ⭐ / ☆ under an image = set it as the hero (the thumbnail shown on listings)
  - ✕ = remove the image (takes effect when you hit Save)
  - You can add more images via the file input
- **Delete a product:** button at the bottom of the edit page. Its images rows are
  cascade-deleted from the DB. (The image *files* stay on disk/S3 — harmless orphans.)

### Set or reset the admin password

```bash
npm run set-password      # prompts for the new password
```

Takes effect immediately — no restart needed. The bcrypt hash is stored in the
database (`settings` table), **not** in `.env`. Don't move it to `.env`: the
`$` characters in bcrypt hashes get silently mangled by env-file parsing,
which makes login fail with "Invalid password" even when it's correct.
(In prod, run it against the prod DB: `DATABASE_URL=/data/prod.db npm run set-password`.)

### Log everyone out (nuke all sessions)

```bash
sqlite3 local.db "DELETE FROM admin_sessions;"
```

---

## The database

- It's **one file**: `local.db` (dev) / `/data/prod.db` (prod, once deployed).
- **Backup = copy the file.** Ideally while the app isn't writing:
  ```bash
  sqlite3 local.db ".backup backup-$(date +%F).db"
  ```
  (`.backup` is safe even while the app runs; a plain `cp` usually is too at this
  traffic level.)
- **Restore = put the file back** and restart the app.
- **Browse/edit data with a GUI:** `npm run db:studio` → opens Drizzle Studio in
  the browser. Handy for quick fixes without writing SQL.
- **Poke it from the terminal:** `sqlite3 local.db` then e.g. `SELECT * FROM products;`

### Changing the schema

1. Edit `src/lib/server/db/schema.ts`
2. `npm run db:push` (add `--force` if it asks for confirmation you can't give,
   e.g. in a script). This diffs the schema against the DB and applies it directly —
   fine for this project's scale. Take a backup first if the change is destructive.

Tables: `products`, `product_images` (FK → products, cascade delete),
`admin_sessions`.

---

## Environment variables (`.env`)

| Variable | Dev value | Prod value |
|---|---|---|
| `DATABASE_URL` | `local.db` | `/data/prod.db` |
| `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` | not needed | required |
| `AWS_REGION` | — | `eu-west-2` |
| `AWS_S3_BUCKET` | — | `monniemermaid` |
| `CDN_URL` | — | `cdn.mermaidmonnieofficial.com` |

Dev vs prod behaviour (local images vs S3, secure cookies) is keyed off the build
mode — `npm run dev` is dev, the built app is prod. No flag to set.

---

## Deploying to prod (not done yet — the plan)

Target: one Docker container on the VPS. Still to do, in order:

1. `npm install @aws-sdk/client-s3 @aws-sdk/lib-storage` — the S3 code in
   `src/lib/server/images.ts` lazy-imports these; without them, image upload in
   prod will crash.
2. Write a `Dockerfile`: `npm ci && npm run build`, then run `node build` with
   `better-sqlite3`'s native module intact (build and run on the same base image,
   e.g. `node:22-slim`, to avoid native-module mismatches).
3. `docker-compose.yml` with:
   - a bind mount or named volume at `/data` (the SQLite file must live on a
     volume or it dies with the container)
   - `env_file: .env` with the prod values
   - `ORIGIN=https://yourdomain` env var (adapter-node needs it for form actions
     to pass CSRF checks — forms will 403 without it)
4. Reverse proxy (nginx/caddy) in front for TLS.
5. Seed the products (see below), or just re-enter them through the admin panel —
   there are only ~6.

### Prod ops once it's live

- **Logs:** `docker compose logs -f`
- **Update:** `git pull && docker compose up -d --build`
- **Backup:** copy `/data/prod.db` off the VPS on a cron. That file is the whole store.

---

## What's left to build (nice-to-haves)

- [ ] Swiper gallery with zoom on the product detail page (`npm install swiper`) —
      currently shows plain images
- [ ] Home page hero content — needs copy + images from your sister
- [ ] Copy assets (logo, fonts, hero images) from the old `frontend/public/` into `static/`
- [x] ~~Seed script~~ — done: `npm run db:seed` imports the 6 live products
      (and their images) straight from mermaidmonnieofficial.com
- [ ] Dockerfile + compose (see deploy plan above)

---

## Troubleshooting

| Symptom | Likely cause / fix |
|---|---|
| Admin login always fails | Reset it: `npm run set-password`. (Never put the hash in `.env` — the `$`s get mangled.) |
| "Admin password not set" on the login page | Run `npm run set-password` against the right `DATABASE_URL`. |
| Image upload fails in dev | `static/uploads/` should be auto-created, but check it's writable. |
| Image upload crashes in prod | AWS SDK not installed, or AWS env vars missing. |
| `better-sqlite3` errors after `npm install` / Node upgrade | Native module needs rebuilding: `npm rebuild better-sqlite3`. |
| Form submissions 403 in prod | `ORIGIN` env var not set on the container. |
| DB looks wrong / need to inspect it | `npm run db:studio`. |
| Start over with a clean DB | delete `local.db`, run `npm run db:push`. |
