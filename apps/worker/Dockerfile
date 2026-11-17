# Build from the repo root:  docker build -f apps/worker/Dockerfile -t frostflow-worker .
FROM node:20-bookworm-slim AS base
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*
RUN npm install -g turbo@1.13.4

FROM base AS pruner
WORKDIR /app
COPY . .
RUN turbo prune --scope=@frostflow/worker --docker

FROM base AS installer
WORKDIR /app
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/package-lock.json ./package-lock.json
RUN npm ci
COPY --from=pruner /app/out/full/ .
RUN npx turbo run build --filter=@frostflow/worker...

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production API_PORT=4000 PLAYWRIGHT_BROWSERS_PATH=/ms-playwright
COPY --from=installer /app ./
# Chromium + its system libraries; version always matches the installed playwright package
RUN node node_modules/playwright/cli.js install --with-deps chromium \
    && chmod -R a+rX /ms-playwright \
    && rm -rf /var/lib/apt/lists/*

USER node
WORKDIR /app/apps/worker
EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.API_PORT||4000)+'/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "dist/index.js"]
