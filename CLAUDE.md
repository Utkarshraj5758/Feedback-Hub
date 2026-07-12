# CLAUDE.md — FeedbackHub

> This file is read automatically by Claude Code at the start of every session.
> It is also my build plan. Keep it up to date as the project evolves.

## What we're building

A multi-tenant SaaS platform: a lightweight customer feedback & feature-request
tool (Canny-style). Teams create boards, users post and upvote requests, admins
triage them. Billing is tiered so feature-gating and seat-based billing are real.

Pricing tiers:
- **Free** — 1 board, 50 posts
- **Pro** — unlimited boards, custom branding
- **Team** — multiple seats, member roles

The point of this project is to demonstrate production-adjacent skills: auth,
multi-tenancy, role-based access, Stripe billing with webhooks, testing, and a
live deployment.

## Tech stack (do not deviate without asking me)

- **Frontend:** React + Vite + TypeScript, TailwindCSS, React Router, TanStack Query
- **Backend:** Node + Express + TypeScript, Prisma ORM
- **Database:** PostgreSQL
- **Cache / rate limiting:** Redis
- **Payments:** Stripe (Checkout + Customer Portal + webhooks)
- **Validation:** Zod (shared schemas where possible)
- **Testing:** Jest + Supertest (backend), Vitest (frontend)
- **CI:** GitHub Actions (lint + test on every push)
- **Deploy:** Frontend → Vercel, Backend → Render, Postgres → Neon, Redis → Upstash

## Repo layout

```
/apps
  /web        # React frontend
  /api        # Express backend
/packages
  /shared     # shared Zod schemas, types
```

## Conventions Claude Code MUST follow

- TypeScript everywhere, `strict` mode on. No `any` unless justified in a comment.
- Every backend route: validate input with Zod, scope all DB queries by `orgId`,
  check the user's role before mutating.
- Never return password hashes or Stripe secrets to the client.
- Auth: short-lived JWT **access token** held in memory on the client; long-lived
  **refresh token** in an httpOnly cookie. Access-token middleware loads the
  user's org + role onto the request.
- Write tests alongside features, not after.
- Prefer small, focused files. Ask before large multi-file refactors.
- After each feature slice, remind me to commit.

## Data model

- **users** — id, email, passwordHash, name, createdAt
- **organizations** — id, name, stripeCustomerId, plan (free|pro|team), subscriptionStatus
- **memberships** — userId, orgId, role (owner|admin|member)  ← multi-tenancy backbone
- **boards** — id, orgId, name, isPublic
- **posts** — id, boardId, authorId, title, body, status (open|planned|done)
- **votes** — id, postId, userId (unique per pair)
- **invites** — token, orgId, email, role, expiresAt  (added in Phase 3)

Everything scopes by `orgId`. Tenant isolation is a hard requirement, not a
nice-to-have.

## Build plan — work top to bottom, one slice at a time

### Phase 0 — Setup (Day 1)
- [ ] Init monorepo, git, this CLAUDE.md
- [ ] Set up /apps/api Express + TS skeleton, /apps/web Vite + React + TS
- [ ] Prisma init, connect to Neon Postgres, first migration (users, organizations)
- [ ] GitHub repo + Actions workflow (lint only for now)
- [ ] Deploy empty-but-running skeleton to Vercel + Render — verify the live URL works

### Phase 1 — Auth & orgs (Week 1)
- [ ] Register (bcrypt hash) → creates user + their organization + owner membership
- [ ] Login → issues access token (memory) + refresh cookie (httpOnly)
- [ ] Refresh + logout endpoints
- [ ] Auth middleware: verify access token, load user + org + role onto request
- [ ] Frontend: auth context, login/register pages, protected dashboard shell
- [ ] Tests: register, login, protected-route rejection
- [ ] Deploy + verify auth works in production

### Phase 2 — Core domain (Week 2)
- [ ] CRUD: boards, posts, comments (all org-scoped)
- [ ] Voting (one vote per user per post)
- [ ] Role-based permissions (members post; admins change status)
- [ ] Frontend: board list, board detail, post/vote UI via TanStack Query
- [ ] Loading / empty / error states everywhere
- [ ] Tests: permission boundaries (member cannot do admin actions)

### Phase 3 — Billing (Week 3) ← the resume gold
- [ ] Stripe products + prices for Pro and Team
- [ ] Set up Stripe CLI FIRST: `stripe listen --forward-to localhost:PORT/webhooks/stripe`
- [ ] Checkout session endpoint for upgrades
- [ ] Webhook handler: checkout.session.completed, customer.subscription.updated/deleted
- [ ] Customer Portal link for managing subscriptions
- [ ] Feature-gate by organization.plan (block board #2 on Free, etc.)
- [ ] Team invites: tokenized email links, join flow
- [ ] Tests: webhook updates DB state correctly

### Phase 4 — Polish & proof (Week 4) ← shortlisted vs ignored
- [ ] Redis rate limiting on auth routes
- [ ] Fill out test coverage on auth + permissions
- [ ] Seed script with demo data
- [ ] README: architecture diagram, screenshots, live demo link, run instructions
- [ ] 30-second demo GIF
- [ ] Final deploy, verify the whole flow end to end on the live URL

## Useful commands

```bash
# dev
npm run dev            # both apps (set up with a root script / turbo / concurrently)
# db
npx prisma migrate dev
npx prisma studio
# stripe (during Phase 3)
stripe listen --forward-to localhost:4000/webhooks/stripe
stripe trigger checkout.session.completed
# tests
npm test
```

## Resume bullets this project earns

- Built a multi-tenant SaaS platform (React, TypeScript, Node/Express, PostgreSQL)
  with organization-scoped data isolation and role-based access control.
- Integrated Stripe subscription billing (Checkout, Customer Portal, webhook-driven
  state syncing) with feature-gating across three pricing tiers.
- Implemented JWT access/refresh auth with httpOnly cookies, Redis rate limiting,
  and Zod validation; covered auth and permission paths with Jest/Supertest.
- Deployed a CI/CD pipeline (GitHub Actions → Vercel + Render) with a live demo.
