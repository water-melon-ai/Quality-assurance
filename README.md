# 🧊 FrostFlow

**Free & Automated website quality assurance platform** — enter a URL and get a full audit with scores, categorized issues, AI-powered analysis, and exportable PDF reports.

FrostFlow crawls your website with a real browser (Playwright), runs six automated check suites, scores the results, generates an AI summary via Google Gemini, and delivers a downloadable PDF — all within a polished React dashboard.

---

## ✨ Features

| Feature | Description |
|---|---|
| **6-Point QA Audit** | Broken links, performance, accessibility, security, SEO, and mobile responsiveness |
| **Browser-Based Testing** | Real Chromium via Playwright — no synthetic/fake checks |
| **Severity Scoring** | Issues graded CRITICAL → LOW; overall score 0-100 with letter grades (A–F) |
| **AI Reports** | Google Gemini generates actionable, human-readable analysis per test |
| **PDF Export** | Auto-generated PDF report with all findings, downloadable and shareable |
| **Shareable Links** | Token-based share URLs with 30-day expiry |
| **Screenshots** | Full-page desktop & mobile screenshots captured during testing |
| **Auth System** | Email/password authentication via Lucia with session management |
| **Usage Tracking** | Per-user tracking of tests run, pages crawled, and AI reports generated |
| **Monitoring** | Scheduled recurring tests with email/Slack alerting (model defined) |

## 🛠️ Tech Stack

### Frontend (`apps/web`)
| Technology | Purpose |
|---|---|
| [React 18](https://react.dev) | UI framework |
| [Vite 5](https://vitejs.dev) | Dev server & bundler |
| [React Router 6](https://reactrouter.com) | Client-side routing |
| [TailwindCSS 3](https://tailwindcss.com) | Utility-first CSS |
| [Framer Motion](https://www.framer.com/motion/) | Animations |
| [GSAP](https://greensock.com/gsap/) | Advanced animations |
| [Recharts](https://recharts.org) | Data visualization |
| [Lucide React](https://lucide.dev) | Icon library |

### Backend API (`apps/api`)
| Technology | Purpose |
|---|---|
| [Fastify 4](https://fastify.dev) | HTTP framework |
| [Lucia 3](https://lucia-auth.com) | Authentication |
| [Prisma](https://www.prisma.io) | Database ORM |
| [Zod](https://zod.dev) | Request validation |
| [Resend](https://resend.com) | Transactional email |

### Worker (`apps/worker`)
| Technology | Purpose |
|---|---|
| [BullMQ 5](https://docs.bullmq.io) | Job queue processing |
| [Playwright](https://playwright.dev) | Browser automation |
| [Google Generative AI](https://ai.google.dev) | Gemini AI reports |
| [PDFKit](https://pdfkit.org) | PDF generation |

### Infrastructure
| Technology | Purpose |
|---|---|
| [PostgreSQL 15](https://www.postgresql.org) | Primary database |
| [Redis 7](https://redis.io) | Job queue + AI report cache |
| [Docker Compose](https://docs.docker.com/compose/) | Local services |
| [Turborepo](https://turbo.build) | Monorepo task orchestration |
| [pnpm 9](https://pnpm.io) | Package manager |