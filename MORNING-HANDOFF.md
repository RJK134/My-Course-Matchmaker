# Morning handoff — 2026-05-19

Overnight prep for the Fly + Vercel deploy. Everything below was rehearsed
locally and confirmed to work; the morning's job is just to repeat it
against the hosted services after you've signed in.

## What's already done

| ✅ | Item |
|---|---|
| ✅ | `flyctl` 0.4.53 installed at `~/.fly/bin/flyctl`, PATH appended to `~/.bashrc` |
| ✅ | `vercel` CLI 54.1.0 installed via `npm i -g` |
| ✅ | API Docker image builds clean (`docker build api/`) |
| ✅ | Frontend Vite build clean (`cd frontend && npm run build`) — 2.7 MB main bundle, OK for launch |
| ✅ | Local Postgres + Meili running via `docker compose up -d db meilisearch` (ports 5434 / 7700) |
| ✅ | Seed succeeds: 159 courses, 109 institutions, 55 cities, 19 domains |
| ✅ | Indexer succeeds: **5,484 documents** in Meili (DEPLOY.md target is `> 5000`) |
| ✅ | API serves all four smoke-test endpoints locally |
| ✅ | **27/27 persona checks pass** against the local API |
| ✅ | `DEPLOY.md` step 4 rewritten — the original `fly ssh console -C "node /app/db/seed.js"` was broken (seed reads from `frontend/src/data` which isn't in the image). New flow uses `fly proxy` from your laptop. |

## What you do this morning

### 1. Sign in (interactive — both pop a browser)

```bash
flyctl auth login        # or `flyctl auth signup` if you don't have an account yet
vercel login             # pick "Continue with GitHub"
```

Fly will ask for a card. `shared-cpu-1x` machines are free-tier but the card
is required to provision anything.

### 2. Follow DEPLOY.md top-to-bottom

It's now self-consistent. Headline commands:

```bash
# Postgres
fly postgres create --name mcm-db --region lhr --vm-size shared-cpu-1x \
  --initial-cluster-size 1 --volume-size 1
# Save the DATABASE_URL it prints — it's only shown once.

# Meilisearch
cd infra/meili
fly launch --copy-config --no-deploy --name mcm-meili
fly volumes create meili_data --region lhr --size 1
fly secrets set MEILI_MASTER_KEY=$(openssl rand -base64 32)
fly deploy
fly secrets list           # save MEILI_MASTER_KEY for the next step

# API
cd ../../api
fly launch --copy-config --no-deploy --name mcm-api
fly postgres attach mcm-db --app mcm-api
fly secrets set MEILI_HOST=http://mcm-meili.flycast:7700 \
                MEILI_KEY="<the master key>" \
                ADMIN_API_KEY=$(openssl rand -hex 24)
fly deploy
```

### 3. Seed + index via fly proxy (the corrected DEPLOY.md step 4)

```bash
# Terminal A
fly proxy 5432 -a mcm-db
# Terminal B
fly proxy 7700 -a mcm-meili
# Terminal C — get the DATABASE_URL Fly set on the API
fly ssh console -a mcm-api -C "printenv DATABASE_URL"
```

Parse host/user/password/db from that URL. Host on your laptop is
`localhost` because of the proxy. Then:

```bash
cd api && DB_HOST=localhost DB_PORT=5432 \
  DB_NAME=<db> DB_USER=<user> DB_PASSWORD=<pwd> PGSSL=true \
  node db/seed.js
cd ..
DB_HOST=localhost DB_PORT=5432 DB_NAME=<db> DB_USER=<user> DB_PASSWORD=<pwd> \
  PGSSL=true MEILI_HOST=http://localhost:7700 MEILI_KEY=<master-key> \
  node scripts/index-courses.mjs
```

Expected: `~159 courses` seeded, `5,484 documents` indexed.

### 4. Frontend

```bash
cd frontend
vercel link --yes
vercel env add VITE_API_URL production
# value: https://mcm-api.fly.dev
vercel --prod
```

### 5. Smoke test

```bash
curl -s https://mcm-api.fly.dev/api/health
curl -s https://mcm-api.fly.dev/api/search/health     # numberOfDocuments > 5000
curl -s "https://mcm-api.fly.dev/api/fx/convert?amount=10000&from=GBP&to=USD"

API_URL=https://mcm-api.fly.dev node scripts/test-personas.mjs
# Expected: === 27 passed · 0 failed ===
```

## Local stack status when I went to bed

- `mcm-db` (Postgres 16, port 5434) — running, seeded with 159 courses
- `mcm-meili` (Meilisearch 1.10, port 7700) — running, 5,484 docs indexed
- API server — stopped (was just for the rehearsal)

If you want to bring the API back up to keep testing locally:

```bash
cd api && PORT=3002 DB_HOST=localhost DB_PORT=5434 \
  DB_NAME=coursematchmaker DB_USER=mcm DB_PASSWORD=changeme \
  MEILI_HOST=http://localhost:7700 MEILI_KEY=mcm-dev-master-key-change-me \
  ADMIN_API_KEY=dev-admin-key node server.js
```

To tear down local stack:

```bash
docker compose stop db meilisearch
# or: docker compose down -v   (also wipes data)
```

## Known gotcha I didn't fix

The API Docker image only contains `api/`. The repo-root `scripts/` and the
`frontend/src/data/*.json` files used by the seed/indexer are **not in the
image**. That's why DEPLOY.md step 4 uses `fly proxy` from your laptop now
instead of `fly ssh console`. If you ever want one-command reindex from
inside the container (e.g. for an automated post-`sync-datalake` trigger),
the fix is to widen the Docker build context to the repo root and copy
`scripts/` and the needed JSON files in — not a small change, deferred.
