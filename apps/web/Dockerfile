# Build from the repo root:  docker build -f apps/web/Dockerfile -t frostflow-web .
FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat openssl
RUN npm install -g turbo@1.13.4

# 1) Prune monorepo down to web app
FROM base AS pruner
WORKDIR /app
COPY . .
RUN turbo prune --scope=@frostflow/web --docker

# 2) Install deps and build (Vite client + Express server)
FROM base AS installer
WORKDIR /app
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/package-lock.json ./package-lock.json
RUN npm ci
COPY --from=pruner /app/out/full/ .
RUN npx turbo run build --filter=@frostflow/web...

# 3) Minimal runtime image
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production PORT=3000 HOSTNAME=0.0.0.0
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 expressjs

COPY --from=installer --chown=expressjs:nodejs /app ./

USER expressjs
WORKDIR /app/apps/web
EXPOSE 3000
CMD ["node", "dist/server/index.js"]
