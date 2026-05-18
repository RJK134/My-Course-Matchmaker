# Production image for the MyCourseMatchmaker Express API.
# Multi-stage build keeps the final image small; only runtime deps end up in /app.
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

FROM node:20-alpine AS runner
ENV NODE_ENV=production
ENV PORT=3002
WORKDIR /app

# Add a non-root user so we don't run the API as root on Fly.
RUN addgroup -S mcm && adduser -S mcm -G mcm

COPY --from=deps /app/node_modules ./node_modules
COPY --chown=mcm:mcm . .

USER mcm

EXPOSE 3002

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- "http://127.0.0.1:${PORT}/api/health" || exit 1

CMD ["node", "server.js"]
