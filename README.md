# Selyn Suite

> Plateforme SaaS marocaine pour la gestion des PME.
> Premier produit : **SelynPaie** — la paie sans la complexité.

| Domain | Value |
|---|---|
| Owner | Selyn Business Center |
| Repo | https://github.com/danaxusss/SelynSuite |
| Staging | https://selyn.qodweb.com |
| Stack | Next.js 15 · NestJS 10 · PostgreSQL 16 · Prisma · Redis · pnpm |
| Phase | 0 — Foundation |

---

## Repository layout

```
SelynSuite/
├─ apps/
│  ├─ web/              Next.js 15 frontend (PWA)
│  └─ api/              NestJS modular monolith
│     └─ prisma/        DB schema + migrations
├─ packages/
│  ├─ types/            Shared TypeScript types & enums
│  ├─ payroll-engine/   Pure payroll calculation engine (Phase 3)
│  └─ ui/               Shared React components (reserved)
├─ docs/
│  ├─ rules/            One .md per regulatory rule (Phase 3+)
│  └─ adr/              Architecture Decision Records
├─ .github/workflows/   CI pipelines
└─ docker-compose.yml   Local Postgres · Redis · MailHog
```

The repo is the **whole Suite**, not Paie alone. Future products (RH, Compta, Facturation, Commerce, Trésorerie, CRM, Projets) will land as additional NestJS modules under `apps/api/src/modules/` per Cardinal Rule R5.

---

## Prerequisites

- **Node.js 22** (use `nvm use` — see `.nvmrc`)
- **pnpm 10** (`npm install -g pnpm@10.33.0`)
- **Docker** with `docker compose` v2

---

## Local quickstart

```bash
# 1. Install dependencies
pnpm install

# 2. Copy and review environment variables
cp .env.example .env

# 3. Start Postgres + Redis + MailHog
pnpm docker:up

# 4. Apply database migrations (first run creates the migration directory)
pnpm prisma:migrate

# 5. Start everything (web + api in parallel)
pnpm dev
```

| Service | URL |
|---|---|
| Web | http://localhost:3000 |
| API | http://localhost:3001/api/v1 |
| API health | http://localhost:3001/api/v1/health |
| MailHog UI | http://localhost:8025 |
| Prisma Studio | `pnpm prisma:studio` → http://localhost:5555 |

---

## Common commands

```bash
pnpm dev              # Run web + api in watch mode
pnpm build            # Build all workspaces
pnpm lint             # ESLint across all workspaces
pnpm typecheck        # tsc --noEmit across all workspaces
pnpm test             # Jest across all workspaces
pnpm format           # Prettier write
pnpm format:check     # Prettier check (CI)

pnpm docker:up        # Start Postgres + Redis + MailHog
pnpm docker:down      # Stop them
pnpm docker:reset     # Stop and wipe volumes

pnpm prisma:generate  # Regenerate Prisma client
pnpm prisma:migrate   # Create + apply migration
pnpm prisma:studio    # GUI for the dev DB
```

---

## Cardinal Rules (recap)

Full text in the project brief. Quick reference:

| # | Rule |
|---|---|
| R1 | Multi-tenant by `tenant_id` + PostgreSQL Row-Level Security |
| R2 | Versioned reference data with effective dates (no hardcoded rates) |
| R3 | Server-side only payroll engine (offline = read-only) |
| R4 | Money is `Decimal`, never `Float`; arithmetic via `Money` value object |
| R5 | Modular monolith, bounded contexts, events between modules |
| R6 | Audit log is append-only |
| R7 | Soft delete on legal-retention entities (10-year retention) |
| R8 | Every bulletin line item traceable to a rule |
| R9 | Idempotent legal exports (byte-identical re-generation) |
| R10 | No PII in logs or error trackers |

---

## Deployment (Hostinger)

Production hosting is managed on Hostinger with auto-deploy from `main`.
Domain: **selyn.qodweb.com**.

Set the following environment variables in the Hostinger panel
(see `.env.example` for the complete documented list):

**Required at first deploy:**

| Variable | Notes |
|---|---|
| `NODE_ENV` | `production` |
| `LOG_LEVEL` | `info` |
| `TZ` | `Africa/Casablanca` |
| `DATABASE_URL` | Hostinger Postgres URL |
| `REDIS_URL` | Hostinger Redis URL |
| `NEXT_PUBLIC_APP_URL` | `https://selyn.qodweb.com` |
| `NEXT_PUBLIC_API_URL` | `https://selyn.qodweb.com/api/v1` (or subdomain) |
| `WEB_ORIGIN` | `https://selyn.qodweb.com` |
| `AUTH_SECRET` | Generate with `openssl rand -base64 32` |
| `AUTH_URL` | `https://selyn.qodweb.com` |
| `AUTH_TRUST_HOST` | `true` |

**Add as soon as features come online:**

- S3 storage: `S3_ENDPOINT`, `S3_REGION`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`
- Email (Phase 1): `EMAIL_PROVIDER`, `EMAIL_FROM`, `RESEND_API_KEY` *or* `POSTMARK_SERVER_TOKEN`
- Observability: `SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_DSN`, `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST`
- Damancom (Phase 6): `DAMANCOM_AFFILIATION_NUMBER`, `DAMANCOM_TEST_MODE`
- Internal admin: `SELYN_INTERNAL_ADMIN_EMAILS`

---

## Documentation

- `docs/CDC_SelynPaie_v1.0.docx` — full functional specification (single source of truth)
- `docs/adr/` — Architecture Decision Records
- `docs/rules/` — one document per regulatory rule (Phase 3+)

---

## License

Proprietary — © Selyn Business Center. All rights reserved.
