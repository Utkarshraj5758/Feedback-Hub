# FeedbackHub

A multi-tenant SaaS customer-feedback and feature-request tool (Canny-style).
Teams create boards, users post and upvote requests, and admins triage them.
Organizations are the tenant boundary; billing is tiered so feature-gating and
seat-based billing are meaningful.

Pricing tiers:
- **Free** — 1 board, 50 posts
- **Pro** — unlimited boards, custom branding
- **Team** — multiple seats, member roles

## Tech stack

- **Frontend:** React + Vite + TypeScript, TailwindCSS, React Router, TanStack Query
- **Backend:** Node + Express + TypeScript, Prisma ORM
- **Database:** PostgreSQL (Neon)
- **Cache / rate limiting:** Redis (Upstash)
- **Payments:** Stripe (Checkout + Customer Portal + webhooks)
- **Validation:** Zod (shared schemas in `packages/shared` where reused across apps)
- **Testing:** Jest + Supertest (backend), Vitest (frontend)
- **CI:** GitHub Actions (typecheck on every push/PR)
- **Deploy:** Frontend → Vercel, Backend → Render, Postgres → Neon, Redis → Upstash

## Repo layout

```
/apps
  /web        # React frontend
  /api        # Express backend
/packages
  /shared     # shared Zod schemas + types (dual: TS source in dev, built JS in prod)
```

## Conventions

- TypeScript everywhere, `strict` mode on. No `any` unless justified in a comment.
- Every backend route: validate input with Zod, scope all DB queries by `orgId`,
  check the user's role before mutating. Tenant isolation is enforced in the query
  layer (org scope in the `where` clause), not just via pre-checks.
- Never return password hashes or Stripe secrets to the client.
- Auth: short-lived JWT **access token** held in memory on the client; long-lived
  **refresh token** in an httpOnly cookie. Access-token middleware loads the
  user's org + role onto the request.
- Write tests alongside features. Prefer small, focused files.

## Data model

- **users** — id, email, passwordHash, name, createdAt
- **organizations** — id, name, stripeCustomerId, plan (free|pro|team), subscriptionStatus
- **memberships** — userId, orgId, role (owner|admin|member)  ← multi-tenancy backbone
- **boards** — id, orgId, name, isPublic
- **posts** — id, boardId, authorId, title, body, status (open|planned|done)
- **votes** — id, postId, userId (unique per pair)
- **comments** — id, postId, authorId, body

Everything scopes by `orgId`.

## Useful commands

```bash
# dev (both apps)
pnpm dev
# build all (topological: shared → api/web)
pnpm build
# typecheck / test
pnpm -r typecheck
pnpm --filter @feedbackhub/api test
# database (Prisma) — run from apps/api
pnpm db:migrate
pnpm db:generate
# stripe (local webhooks)
stripe listen --forward-to localhost:4000/webhooks/stripe
```
