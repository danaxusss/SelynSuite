# ADR 0001 — Tech stack lock

- **Status:** Accepted
- **Date:** 2026-05-02
- **Deciders:** Selyn founding team
- **Phase:** 0 — Foundation

## Context

We are building Selyn Suite — a multi-tenant SaaS for Moroccan SMEs. The first product is **SelynPaie** (Moroccan payroll). Future products (RH, Compta, Facturation, Commerce, Trésorerie, CRM, Projets) will follow as modules of the same monolith.

Payroll is a high-stakes domain: monetary correctness, fiscal/social compliance, 10-year legal retention, multi-tenant isolation across thousands of small employers. The technology decisions made here are very expensive to reverse — they need to be deliberately locked.

## Decision

| Layer | Choice |
|---|---|
| Frontend | **Next.js 15** (App Router) + TypeScript + Tailwind + shadcn/ui (PWA) |
| Backend API | **NestJS 10** modular monolith, one module per Selyn Suite product |
| Database | **PostgreSQL 16** + **Prisma 6** ORM, Row-Level Security for multi-tenancy |
| Cache & queues | **Redis 7** + **BullMQ** |
| PDF generation | **Puppeteer** (HTML templates) |
| File storage | **S3-compatible**, Moroccan provider preferred |
| Auth | **Auth.js v5** on Next.js, sessions trusted by NestJS API |
| Hosting | **Hostinger** (interim) → Moroccan host (CNDP arg.) |
| Observability | **Sentry** + **PostHog** |
| CI/CD | **GitHub Actions** |
| Email | Resend or Postmark |
| Repo strategy | **Single monorepo for the whole Suite** (pnpm workspaces) |

### Forbidden choices

- ❌ MongoDB or any non-relational primary store (payroll requires ACID).
- ❌ Client-side payroll calculation (always server-side; offline = read-only).
- ❌ Hardcoded tax rates in code (must be DB-versioned with effective dates).
- ❌ Hard tenant isolation by separate databases (one DB, RLS by `tenant_id`).
- ❌ Multi-repo split per product (defer until org actually needs it).

## Consequences

**Positive**
- One Prisma schema, one Auth flow, one CI, one deploy — drastically lower setup overhead for an early-stage team.
- Atomic refactors across modules remain possible.
- The `payroll-engine` package is shared with no version skew.
- PostgreSQL RLS gives DB-level multi-tenant guarantees that survive application bugs.

**Negative**
- All products ship together (no independent release cadence). Acceptable until separate teams exist.
- The team must enforce module boundaries by discipline + lint rules, since nothing physically prevents a cross-module DB join.
- Auth.js + NestJS coupling: sessions live on the Next.js side, API trusts a session cookie / JWT. Adds slight complexity vs. a single-framework approach.

## Alternatives considered

- **Multi-repo per product** — rejected. Forces premature service boundaries, multiplies CI/auth/RLS setup, and creates problems (independent deploys, separate teams) we don't yet have.
- **Microservices** — same reasoning, plus distributed-systems complexity in a domain (payroll) that benefits enormously from ACID transactions.
- **MongoDB / NoSQL** — explicitly forbidden. Payroll is the textbook ACID workload.
- **Tailwind v4** — deferred until shadcn/ui ecosystem fully aligns; Tailwind v3 today.

## References

- Project brief §2 (Tech stack — locked decisions)
- Project brief §3 (Cardinal Architectural Rules)
- Project brief §4 (Repository structure)
