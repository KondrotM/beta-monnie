# Production image: one container, SQLite on a /data volume, app on port 3350.
# Caddy terminates TLS outside the container and reverse-proxies to 3350.
#
# Build and run stages use the same base so better-sqlite3/bcrypt native
# modules compiled in the build stage match the runtime (see RUNBOOK.md).
FROM node:22-alpine AS build
WORKDIR /app

# Toolchain for bcrypt/better-sqlite3 when no musl prebuilt binary exists
RUN apk add --no-cache python3 make g++

COPY package.json package-lock.json .npmrc ./
RUN npm ci

COPY . .
# .env isn't baked into the image, but SvelteKit's post-build analysis
# imports the server code, which throws without a DATABASE_URL — give it a
# throwaway in-memory one. The real value comes from the runtime env below.
RUN DATABASE_URL=:memory: npm run build

# Render schema.ts to plain SQL so the runtime image can bootstrap a fresh
# database without drizzle-kit (applied by scripts/init-db.ts at startup)
RUN node scripts/generate-schema-sql.ts

# Only runtime dependencies ship in the final image
RUN npm prune --omit=dev

FROM node:22-alpine
WORKDIR /app

ENV NODE_ENV=production \
    PORT=3350 \
    DATABASE_URL=/data/prod.db \
    # adapter-node's default request body limit is 512K — too small for the
    # admin panel's product photo uploads
    BODY_SIZE_LIMIT=20M

COPY --from=build /app/build ./build
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./
COPY --from=build /app/schema.sql ./
COPY --from=build /app/scripts/init-db.ts /app/scripts/set-password.ts ./scripts/

RUN mkdir /data && chown node:node /data
USER node

EXPOSE 3350
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s \
    CMD wget -qO /dev/null http://127.0.0.1:3350/ || exit 1

# Initialise the database on a fresh /data volume, then start the server
CMD ["sh", "-c", "node scripts/init-db.ts && exec node build"]
