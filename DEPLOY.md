# Deploying MyCourseMatchmaker

This document is the single source of truth for shipping the app. After running
through it once, the routine deploy is two commands.

## Production architecture

```
                              ┌─────────────────────────┐
   user browser ─── HTTPS ─►  │  Vercel (frontend)      │
                              │  React + Vite static    │
                              └────────────┬────────────┘
                                           │ /api/* rewrite
                                           ▼
                              ┌─────────────────────────┐
                              │  Fly.io  mcm-api        │
                              │  Express container      │
                              └─────┬────────────┬──────┘
                                    │            │
                                    ▼            ▼
                       ┌──────────────┐  ┌──────────────────┐
                       │ Fly Postgres │  │ Fly  mcm-meili   │
                       │ mcm-db       │  │ Meilisearch+vol  │
                       └──────────────┘  └──────────────────┘
```

All three Fly apps live in the same `lhr` region with private internal
networking — the API talks to Postgres and Meilisearch over `.flycast`
addresses, never over the public internet.

## Prerequisites

```bash
brew install flyctl                  # or: curl -L https://fly.io/install.sh | sh
brew install vercel-cli              # or: npm i -g vercel

fly auth signup                      # or: fly auth login
vercel login
```

You'll also need a payment method on Fly (the smallest VMs are free but a card
is required to provision them).

## 1. Stand up Postgres on Fly

```bash
fly postgres create \
  --name mcm-db \
  --region lhr \
  --vm-size shared-cpu-1x \
  --initial-cluster-size 1 \
  --volume-size 1
```

Save the connection string Fly prints — you'll need the `DATABASE_URL`.

## 2. Stand up Meilisearch on Fly

```bash
cd infra/meili
fly launch --copy-config --no-deploy --name mcm-meili
fly volumes create meili_data --region lhr --size 1
fly secrets set MEILI_MASTER_KEY=$(openssl rand -base64 32)
fly deploy
fly secrets list   # capture MEILI_MASTER_KEY for the API
```

## 3. Deploy the API on Fly

```bash
cd api
fly launch --copy-config --no-deploy --name mcm-api
fly postgres attach mcm-db --app mcm-api      # sets DATABASE_URL automatically
fly secrets set \
  MEILI_HOST=http://mcm-meili.flycast:7700 \
  MEILI_KEY="<the master key from step 2>" \
  ADMIN_API_KEY=$(openssl rand -hex 24)
fly deploy
fly status        # confirm health check passing on /api/health
```

The API expects the `pg` connection variables (`DB_HOST`, `DB_PORT`, …) but
Fly's `postgres attach` only sets `DATABASE_URL`. Add this shim to
`api/db/pool.js` if you haven't already:

```js
if (process.env.DATABASE_URL && !process.env.DB_HOST) {
  const u = new URL(process.env.DATABASE_URL);
  process.env.DB_HOST = u.hostname;
  process.env.DB_PORT = u.port || "5432";
  process.env.DB_USER = decodeURIComponent(u.username);
  process.env.DB_PASSWORD = decodeURIComponent(u.password);
  process.env.DB_NAME = u.pathname.slice(1);
}
```

## 4. Seed Postgres + Meilisearch (one time)

Both scripts live at the repo root / under `api/` and read JSON data from
`frontend/src/data/` and `api/data/`. None of that is baked into the API
Docker image — so run them from your laptop against the hosted services
through Fly's local proxy.

Open two terminals (or use `&` to background the proxies):

```bash
# Terminal A — tunnel hosted Postgres to localhost:5432
fly proxy 5432 -a mcm-db

# Terminal B — tunnel hosted Meilisearch to localhost:7700
fly proxy 7700 -a mcm-meili
```

Then, in a third terminal at the repo root:

```bash
# Get the Postgres credentials Fly attached to the API
fly ssh console -a mcm-api -C "printenv DATABASE_URL"
# Parse host/user/password/db from that URL — they're what we'll feed seed.js
# (host becomes 'localhost' because of the proxy).

# Seed (idempotent — uses ON CONFLICT DO NOTHING)
cd api && DB_HOST=localhost DB_PORT=5432 \
  DB_NAME=<db> DB_USER=<user> DB_PASSWORD=<password> \
  PGSSL=true \
  node db/seed.js
cd ..

# Build the Meilisearch index
DB_HOST=localhost DB_PORT=5432 \
  DB_NAME=<db> DB_USER=<user> DB_PASSWORD=<password> \
  PGSSL=true \
  MEILI_HOST=http://localhost:7700 \
  MEILI_KEY="<master key from step 2>" \
  node scripts/index-courses.mjs
```

Expected output on a clean run: seed reports ~159 courses, 109 institutions,
55 cities, 19 domain families; indexer reports ~5,484 documents (curated +
deduped lake), with `task status: succeeded`.

Close the two `fly proxy` terminals when finished.

When the workhorse pushes a new lake snapshot, re-run only the indexer (the
DB doesn't need re-seeding):

```bash
fly proxy 7700 -a mcm-meili &
fly proxy 5432 -a mcm-db &
npm run sync-datalake   # refresh api/data/lake-courses.json
DB_HOST=localhost DB_PORT=5432 DB_NAME=<db> DB_USER=<user> DB_PASSWORD=<pwd> \
  PGSSL=true MEILI_HOST=http://localhost:7700 MEILI_KEY=<key> \
  node scripts/index-courses.mjs
```

## 5. Deploy the frontend on Vercel

From the repo root:

```bash
cd frontend
vercel link --yes              # creates .vercel/project.json
vercel env add VITE_API_URL production
# Enter: https://mcm-api.fly.dev
vercel --prod
```

`vercel.json` already rewrites `/api/*` to `https://mcm-api.fly.dev/api/*` so
the frontend can keep using relative `/api/...` URLs. If you change the
hostname (custom domain, different region), update both `vercel.json` and the
`VITE_API_URL` env var.

## 6. Smoke test

```bash
curl -s https://mcm-api.fly.dev/api/health
curl -s https://mcm-api.fly.dev/api/search/health    # should report numberOfDocuments > 5000
curl -s "https://mcm-api.fly.dev/api/fx/convert?amount=10000&from=GBP&to=USD"

open https://mycoursematchmaker.vercel.app/           # or your custom domain
open https://mycoursematchmaker.vercel.app/search
```

## Routine redeploy

```bash
# Frontend (every commit to main is auto-deployed once Git is connected; manual:)
cd frontend && vercel --prod

# API
cd api && fly deploy
```

When the workhorse pushes a new lake snapshot to gdrive, refresh the index
from your laptop (the indexer isn't baked into the API image — see step 4):

```bash
fly proxy 7700 -a mcm-meili &
fly proxy 5432 -a mcm-db &
npm run sync-datalake          # refresh api/data/lake-courses.json
DB_HOST=localhost DB_PORT=5432 DB_NAME=<db> DB_USER=<user> DB_PASSWORD=<pwd> \
  PGSSL=true MEILI_HOST=http://localhost:7700 MEILI_KEY=<key> \
  node scripts/index-courses.mjs
```

## Custom domain

```bash
vercel domains add mycoursematchmaker.com
# follow the DNS instructions
```

## Rollback

```bash
# Frontend: pick a prior deployment in the Vercel dashboard → Promote to Production
fly deploys list -a mcm-api       # find the prior release id
fly deploy --image registry.fly.io/mcm-api:deployment-<id>
```

## Monitoring + logs

```bash
fly logs -a mcm-api
fly logs -a mcm-meili
fly status -a mcm-api
```

For deeper observability, Sentry / LogTail / Better Stack all have free tiers
and ~5 min setup. Not required for first launch.

## Cost ballpark (May 2026)

| Component | Plan | Monthly |
|---|---|---|
| Vercel Hobby | Free | £0 |
| Fly Postgres (1x shared, 1 GB volume) | shared-cpu-1x | ~£2 |
| Fly mcm-api (shared-cpu-1x, scales to zero) | pay-as-you-go | ~£2–5 |
| Fly mcm-meili (shared-cpu-1x, always-on) | pay-as-you-go | ~£4 |
| **Total** | | **~£8–11/mo** |

Vercel-side bandwidth and Fly outbound are well below free-tier limits at
hobby traffic levels.
