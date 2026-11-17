# FrostFlow

> **"Your client site is probably broken somewhere. FrostFlow finds it before they do."**

A full QA audit engine for freelancers, small agencies, and non-technical founders. Delivers a beautiful, plain-English report in 60 seconds — no setup, no code, just a URL.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 (Vite, React Router v6), Tailwind CSS, Framer Motion, GSAP |
| Web Server & API | Node.js, Express, Cookie Session Auth |
| Scan Worker API | Node.js, Fastify |
| Browser automation | Playwright (Chromium) |
| AI report | Google Gemini (`GEMINI_MODEL`, default `gemini-2.5-flash`) |
| Database | PostgreSQL + Prisma ORM |
| Queue | Redis + BullMQ |
| Storage | Uploadthing (PDFs, screenshots — optional) |
| Auth | Prisma Session in PostgreSQL + scrypt passwords |

## Structure

```
apps/web      Express server + React SPA (UI, auth, API proxy to worker)
apps/worker   Fastify API + BullMQ consumer + Playwright scan engine + monitor scheduler
packages/     database (Prisma + queries), queue (BullMQ), types
```

The browser never talks to the worker directly: the web app proxies `/api/jobs`, `/api/results` etc. and
authenticates to the worker with a shared `INTERNAL_API_KEY`.

## Local development

```bash
cp .env.example .env            # set INTERNAL_API_KEY (openssl rand -hex 32); the rest has dev defaults
docker compose -f infrastructure/docker-compose.yml up -d   # Postgres + Redis
npm install                     # also runs `prisma generate`
npx playwright install chromium
npm run db:push
npm run db:seed                 # optional: test@frostflow.local / frostflow-demo 
npm run dev                     # web :3000, worker API :4000
```

Checks: `npm run type-check` · `npm run build` · `npm run lint -w apps/web`

## Deployment

**Docker (everything):** `docker compose -f infrastructure/docker-compose.yml --profile app up -d --build`
(runs `prisma db push`, then worker + web).

**Split hosting:** deploy `apps/web` (Express + React Dockerfile) and `apps/worker` (Dockerfile; needs ~1 GB RAM for Chromium),
point both at the same Postgres and Redis, and set on both: `DATABASE_URL`, `INTERNAL_API_KEY`;
web also needs `WORKER_API_URL`, `APP_URL`; worker needs `REDIS_URL`.

**Notes**
- Everything is free. Signed-in users get all features (unlimited scans, 25-page crawl, AI report, PDF, monitors). Visitors who aren't signed in get 3 single-page scans/day.
- Run the worker behind a reverse proxy; the web app forwards the visitor IP for free-tier rate limiting via `x-real-ip` / `x-forwarded-for`.
- Scans only target public hosts (private/loopback ranges are blocked).
- `prisma db push` is used for schema sync; switch to `prisma migrate` once the schema stabilises.
