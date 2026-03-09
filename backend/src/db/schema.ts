import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core'

// ─── Users ────────────────────────────────────────────────────────────────────

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),               // UUID
  email: text('email').notNull().unique(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
})

// ─── OTP codes ────────────────────────────────────────────────────────────────
// Code is stored hashed. TTL enforced by expiresAt.

export const otpCodes = sqliteTable('otp_codes', {
  id: text('id').primaryKey(),
  email: text('email').notNull(),
  codeHash: text('code_hash').notNull(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  used: integer('used', { mode: 'boolean' }).notNull().default(false),
})

// ─── Categories ───────────────────────────────────────────────────────────────
// Seeded on startup, not user-editable in MVP.

export const categories = sqliteTable('categories', {
  id: text('id').primaryKey(),
  name: text('name').notNull().unique(),
  icon: text('icon').notNull().default('🧾'),
})

// ─── Divisions ────────────────────────────────────────────────────────────────
// ownerUserId is null for guest sessions.

export const divisions = sqliteTable('divisions', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  ownerUserId: text('owner_user_id').references(() => users.id, { onDelete: 'cascade' }),
  guestToken: text('guest_token'),    // set when created by a guest
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  closedAt: integer('closed_at', { mode: 'timestamp' }), // null = open
})

// ─── Participants ─────────────────────────────────────────────────────────────

export const participants = sqliteTable('participants', {
  id: text('id').primaryKey(),
  divisionId: text('division_id').notNull().references(() => divisions.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  alias: text('alias'),               // transfer alias (CBU alias) — optional, for receiving payments
  contactId: text('contact_id').references(() => contacts.id, { onDelete: 'set null' }),
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
// Only included participants get a row. Excluded participants have no entry.
// amountOwed is pre-calculated: expense.amount / number_of_included_participants.

export const expenseSplits = sqliteTable('expense_splits', {
  id: text('id').primaryKey(),
  expenseId: text('expense_id').notNull().references(() => expenses.id, { onDelete: 'cascade' }),
  participantId: text('participant_id').notNull().references(() => participants.id, { onDelete: 'cascade' }),
  amountOwed: real('amount_owed').notNull(),
})

// ─── Contacts ─────────────────────────────────────────────────────────────────
// Personal directory per registered user. Populated voluntarily after a division.

export const contacts = sqliteTable('contacts', {
  id: text('id').primaryKey(),
  ownerUserId: text('owner_user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
})
