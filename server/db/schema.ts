import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core'

// ─── Categories ───────────────────────────────────────────────────────────────
// Seeded on startup, not user-editable.

export const categories = sqliteTable('categories', {
  id: text('id').primaryKey(),
  name: text('name').notNull().unique(),
  icon: text('icon').notNull().default('🧾'),
})

// ─── Divisions ────────────────────────────────────────────────────────────────
// Access is scoped by guestToken (UUID generated client-side).

export const divisions = sqliteTable('divisions', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  guestToken: text('guest_token'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  closedAt: integer('closed_at', { mode: 'timestamp' }),
})

// ─── Participants ─────────────────────────────────────────────────────────────

export const participants = sqliteTable('participants', {
  id: text('id').primaryKey(),
  divisionId: text('division_id').notNull().references(() => divisions.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  alias: text('alias'),
})

// ─── Expenses ─────────────────────────────────────────────────────────────────

export const expenses = sqliteTable('expenses', {
  id: text('id').primaryKey(),
  divisionId: text('division_id').notNull().references(() => divisions.id, { onDelete: 'cascade' }),
  categoryId: text('category_id').references(() => categories.id),
  description: text('description'),
  amount: real('amount').notNull(),
  paidBy: text('paid_by').notNull().references(() => participants.id, { onDelete: 'cascade' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
})

// ─── Expense splits ───────────────────────────────────────────────────────────
// Only included participants get a row. amountOwed = expense.amount / included_count.

export const expenseSplits = sqliteTable('expense_splits', {
  id: text('id').primaryKey(),
  expenseId: text('expense_id').notNull().references(() => expenses.id, { onDelete: 'cascade' }),
  participantId: text('participant_id').notNull().references(() => participants.id, { onDelete: 'cascade' }),
  amountOwed: real('amount_owed').notNull(),
})
