# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**Splitr** — Expense splitter app. Divide expenses among people, supports per-expense exclusions, and computes the minimum number of transfers to settle all debts.

## Stack

| Layer | Technology |
|---|---|
| Framework | Nuxt 3 (SPA mode + Nitro API routes) |
| State | Pinia (`@pinia/nuxt`) |
| ORM | Drizzle ORM |
| DB (local) | SQLite via `@libsql/client` |
| DB (prod) | Turso (libSQL cloud) |
| Auth | Guest sessions only — `guest_<uuid>` token, 6h TTL in localStorage |

## Commands

```bash
cp .env.example .env        # fill DATABASE_URL and TURSO_AUTH_TOKEN
npm install
npm run db:migrate          # apply migrations (run once before dev)
npm run dev                 # Nuxt dev server on :3000
npm run build               # production build
npm run db:generate         # generate migration from schema changes
```

> **Local DB:** `DATABASE_URL=file:./data/db.sqlite` — no auth token needed.

## Project Structure

```
expense-splitter/
├── app.vue                      # Root — restores guest session on mount
├── nuxt.config.ts               # ssr: false, @pinia/nuxt, global CSS
├── drizzle.config.ts            # Points to server/db/schema.ts
├── drizzle/                     # Auto-generated SQL migrations
├── assets/main.css              # Design system tokens + global styles
├── types/index.ts               # Shared TypeScript interfaces
├── stores/
│   ├── auth.ts                  # Guest session (6h localStorage TTL)
│   └── division.ts              # Active division state + $fetch mutations
├── pages/
│   ├── index.vue                # Landing + create division form
│   └── division/[id]/
│       ├── index.vue            # Participant cards + inline expense forms
│       └── result.vue           # Settlement + alias + WhatsApp copy
├── components/
│   └── ParticipantCard.vue      # Collapsible: alias + expense form + exclusions
└── server/
    ├── middleware/auth.ts       # Sets event.context.guestToken
    ├── utils/getDivision.ts     # Ownership check helper (auto-imported)
    ├── db/
    │   ├── schema.ts            # Drizzle table definitions (source of truth)
    │   └── index.ts             # libSQL client + drizzle instance
    ├── services/
    │   └── settlement.ts        # computeBalances + computeSettlement
    └── api/
        ├── health.get.ts
        ├── categories.get.ts
        └── divisions/
            ├── index.post.ts
            └── [id]/
                ├── index.get.ts / index.patch.ts / index.delete.ts
                ├── settlement.get.ts
                ├── participants/
                │   ├── index.post.ts
                │   └── [pid]/ index.patch.ts / index.delete.ts
                └── expenses/
                    ├── index.post.ts
                    └── [eid].delete.ts
```

## Authentication

Guest-only. Server middleware (`server/middleware/auth.ts`) reads `Authorization: Bearer guest_<uuid>` and sets `event.context.guestToken`.

- Token generated client-side (`crypto.randomUUID()`), stored in localStorage with 6h TTL.
- Divisions store `guestToken` to scope access. No server-side session table.
- Stores attach token via `authHeaders()` helper on every `$fetch` call.

## Key Design Decisions

### API calls — `$fetch` not axios
All API calls use Nuxt's global `$fetch` (ofetch). Error format: `e.data?.statusMessage`.
The `authHeaders()` function in `stores/division.ts` injects the guest token.

### Expenses — description + alias only
Each expense has `description` (optional) and `amount`. No categories in UI.
**Alias** is per-participant, saved on blur via `PATCH /api/divisions/:id/participants/:pid`.

### Expense splits
`expense_splits` stores only included participants. `amountOwed = expense.amount / included_count`.

### Debt minimization (`server/services/settlement.ts`)
1. Net balance = `total_paid − total_owed`
2. Greedy: largest creditor ↔ largest debtor, repeat
3. Result: minimum (or near-minimum) transfers

### Critical — always use `inArray()` for multi-expense queries
```typescript
import { inArray } from 'drizzle-orm'
db.select().from(expenseSplits).where(inArray(expenseSplits.expenseId, expenseIds))
```

### WhatsApp copy
`pages/division/[id]/result.vue` generates `*bold*` formatted text with transfers and aliases.

## Design System — "The Ledger"

Dark forest green (`#0F1C17`), warm cream text (`#EDE8D8`), gold accents (`#D4A84B`). Fonts: Cormorant Garamond (display), DM Sans (body), DM Mono (numbers). Tokens in `assets/main.css`.

## Deploy

- **App**: Vercel (Nuxt 3 auto-detected) — build command: `npm run db:migrate && nuxt build`
- **DB**: Turso (libSQL cloud)
- Env vars needed on Vercel: `DATABASE_URL`, `TURSO_AUTH_TOKEN`
