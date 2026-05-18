# Meilisearch on Fly.io

The deploy uses the upstream `getmeili/meilisearch:v1.10` image with a 1 GB
persistent volume mounted at `/meili_data`. Master key is provided via
Fly secrets at runtime.

## First-time setup

```bash
cd infra/meili
fly launch --copy-config --no-deploy
fly volumes create meili_data --region lhr --size 1
fly secrets set MEILI_MASTER_KEY=$(openssl rand -base64 32)
fly deploy
```

## Routine deploys

```bash
cd infra/meili
fly deploy
```

The index isn't built on deploy — run the indexer from the API host:

```bash
fly ssh console -a mcm-api
node /app/scripts/index-courses.mjs  # or run the bundled npm script
```
