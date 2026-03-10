import { c as defineEventHandler, g as getRouterParam, e as createError } from '../../../_/nitro.mjs';
import { g as getDivision } from '../../../_/getDivision.mjs';
import { d as db, p as participants, e as expenses, a as expenseSplits } from '../../../_/index.mjs';
import { eq, inArray } from 'drizzle-orm';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'node:url';
import '@libsql/client';
import 'drizzle-orm/libsql';
import 'drizzle-orm/sqlite-core';

const index_get = defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");
  const division = await getDivision(id, event.context.guestToken);
  if (!division) throw createError({ statusCode: 404, statusMessage: "Divisi\xF3n no encontrada" });
  const divParticipants = await db.select().from(participants).where(eq(participants.divisionId, id));
  const divExpenses = await db.select().from(expenses).where(eq(expenses.divisionId, id));
  const expenseIds = divExpenses.map((e) => e.id);
  const splits = expenseIds.length > 0 ? await db.select().from(expenseSplits).where(inArray(expenseSplits.expenseId, expenseIds)) : [];
  return { ...division, participants: divParticipants, expenses: divExpenses, splits };
});

export { index_get as default };
//# sourceMappingURL=index.get.mjs.map
