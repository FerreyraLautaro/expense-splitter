# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**Splitr** — Expense splitter app. Divide expenses among people, supports per-expense exclusions, and computes the minimum number of transfers to settle all debts. MVP-first, iterative approach.

## Stack

| Layer | Technology |
|---|---|
| Frontend | Vue 3 + Vite + Pinia + Vue Router |
| Backend | Node.js + Express + TypeScript (`tsx watch`) |
| ORM | Drizzle ORM |
| DB (local) | SQLite via `@libsql/client` |
| DB (prod) | Turso (libSQL cloud) |
| Auth | Guest sessions only — `guest_<uuid>` token, 6h TTL in localStorage |

## Commands

```bash
# Backend
cd backend
cp .env.example .env        # fill JWT_SECRET and RESEND_API_KEY
npm install
npm run db:generate         # generate migration from schema changes
npm run db:migrate          # apply migrations (run after generate)
npm run dev                 # tsx watch — hot reload on :3000

# Frontend
cd frontend
npm install
npm run dev                 # Vite dev server on :5173 (proxies /api → :3000)
npm run build               # type-check + production build
```

> **Important:** `DATABASE_URL` in `.env` must have `file:` prefix → `file:./data/db.sqlite`

## Project Structure

```
expense-splitter/
├── backend/
│   ├── drizzle/                 # Auto-generated SQL migrations
│   ├── data/                    # SQLite database file (gitignored)
│   ├── src/
│   │   ├── db/
│   │   │   ├── schema.ts        # Drizzle table definitions (source of truth)
│   │   │   └── index.ts         # libSQL client + drizzle instance
│   │   ├── middleware/
│   │   │   └── auth.ts          # parseAuth — sets req.guestToken from Bearer header
│   │   ├── routes/
│   │   │   ├── divisions.ts     # CRUD + participants (with PATCH alias) + GET /settlement
│   │   │   ├── expenses.ts      # POST/DELETE on /divisions/:id/expenses
│   │   │   └── categories.ts    # GET /categories (seeded, kept for future use)
│   │   ├── services/
│   │   │   └── settlement.ts    # computeBalances + computeSettlement (greedy debt minimization)
│   │   └── index.ts             # Express app, migrations on startup, category seed
│   └── drizzle.config.ts
└── frontend/
    └── src/
        ├── api/index.ts         # Axios instance + typed API wrappers + shared TS types
        ├── stores/
        │   ├── auth.ts          # Guest session (6h localStorage TTL)
        │   └── division.ts      # Active division state + all mutations
        ├── views/
        │   ├── HomeView.vue     # Landing + create division form
        │   ├── DivisionView.vue # Single-screen: participant cards with inline expense forms
        │   └── ResultView.vue   # Settlement + alias display + WhatsApp copy button
        └── components/
            └── ParticipantCard.vue  # Collapsible card: alias field + inline expense form + exclusions
```

## Authentication

Guest-only. `parseAuth` middleware reads `Authorization: Bearer guest_<uuid>` and sets `req.guestToken`.

- Token generated client-side (`crypto.randomUUID()`), stored in localStorage with 6h TTL.
- Divisions store `guestToken` to scope access. No server-side session table.

## Key Design Decisions

### Expenses — no categories, just description + alias
- Each expense has a `description` (free text, optional) and `amount`
- Categories were removed from the UI. The `categories` table still exists in DB for future use.
- **Alias** is a per-participant field (not per-expense). It stores the CBU alias for receiving transfers. Set inline in the participant card, saved on blur via `PATCH /api/divisions/:id/participants/:pid`.

### Expense splits
`expense_splits` table stores only included participants. Excluded participants have no row. `amountOwed = expense.amount / included_count` (pre-calculated, equal split).

### Debt minimization (`services/settlement.ts`)
1. Net balance per participant: `total_paid − total_owed`
2. Separate into creditors (net > 0) and debtors (net < 0)
3. Greedy match: largest creditor ↔ largest debtor, record transfer, repeat
4. Result: minimum (or near-minimum) number of transfers

### Critical bug fix — always use `inArray()` for multi-expense queries
The old `reduce` with `or()` from Drizzle caused only the first expense's splits to be fetched. Always use:
```typescript
import { inArray } from 'drizzle-orm'
db.select().from(expenseSplits).where(inArray(expenseSplits.expenseId, expenseIds))
```

### WhatsApp copy
`ResultView.vue` generates bold-formatted text (`*text*`) with transfer list and creditor aliases. Uses `navigator.clipboard.writeText()`. Button shows "✓ Copiado" feedback for 2.5s.

## Design System — "The Ledger"

Dark forest green (`#0F1C17`), warm cream text (`#EDE8D8`), gold accents (`#D4A84B`), red/green for debt/credit. Fonts: Cormorant Garamond (display), DM Sans (body), DM Mono (numbers/labels/code). All tokens in `frontend/src/assets/main.css`.

## Deploy

- **Frontend**: Vercel — https://frontend-opal-nine-49.vercel.app
- **Backend**: Render — https://expense-splitter-4ry1.onrender.com
- **DB**: Turso (libSQL cloud)
