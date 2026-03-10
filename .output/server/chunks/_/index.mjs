import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

const categories = sqliteTable("categories", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(),
  icon: text("icon").notNull().default("\u{1F9FE}")
});
const divisions = sqliteTable("divisions", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  guestToken: text("guest_token"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  closedAt: integer("closed_at", { mode: "timestamp" })
});
const participants = sqliteTable("participants", {
  id: text("id").primaryKey(),
  divisionId: text("division_id").notNull().references(() => divisions.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  alias: text("alias")
});
const expenses = sqliteTable("expenses", {
  id: text("id").primaryKey(),
  divisionId: text("division_id").notNull().references(() => divisions.id, { onDelete: "cascade" }),
  categoryId: text("category_id").references(() => categories.id),
  description: text("description"),
  amount: real("amount").notNull(),
  paidBy: text("paid_by").notNull().references(() => participants.id, { onDelete: "cascade" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull()
});
const expenseSplits = sqliteTable("expense_splits", {
  id: text("id").primaryKey(),
  expenseId: text("expense_id").notNull().references(() => expenses.id, { onDelete: "cascade" }),
  participantId: text("participant_id").notNull().references(() => participants.id, { onDelete: "cascade" }),
  amountOwed: real("amount_owed").notNull()
});

const schema = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  categories: categories,
  divisions: divisions,
  expenseSplits: expenseSplits,
  expenses: expenses,
  participants: participants
}, Symbol.toStringTag, { value: 'Module' }));

var _a;
const url = (_a = process.env.DATABASE_URL) != null ? _a : "file:./data/db.sqlite";
const authToken = process.env.TURSO_AUTH_TOKEN;
const client = createClient(authToken ? { url, authToken } : { url });
const db = drizzle(client, { schema });

export { expenseSplits as a, divisions as b, categories as c, db as d, expenses as e, participants as p };
//# sourceMappingURL=index.mjs.map
