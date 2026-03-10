import { c as defineEventHandler, g as getRouterParam, e as createError } from '../../../../_/nitro.mjs';
import { g as getDivision } from '../../../../_/getDivision.mjs';
import { d as db, p as participants, e as expenses, a as expenseSplits } from '../../../../_/index.mjs';
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

function computeBalances(participants, expenses, splits) {
  var _a, _b;
  const paid = {};
  const owed = {};
  for (const p of participants) {
    paid[p.id] = 0;
    owed[p.id] = 0;
  }
  for (const e of expenses) {
    paid[e.paidBy] = ((_a = paid[e.paidBy]) != null ? _a : 0) + e.amount;
  }
  for (const s of splits) {
    owed[s.participantId] = ((_b = owed[s.participantId]) != null ? _b : 0) + s.amountOwed;
  }
  return participants.map((p) => {
    var _a2, _b2, _c, _d;
    return {
      id: p.id,
      name: p.name,
      totalPaid: round((_a2 = paid[p.id]) != null ? _a2 : 0),
      totalOwed: round((_b2 = owed[p.id]) != null ? _b2 : 0),
      net: round(((_c = paid[p.id]) != null ? _c : 0) - ((_d = owed[p.id]) != null ? _d : 0))
    };
  });
}
function computeSettlement(balances) {
  const creditors = balances.filter((b) => b.net > 0.01).map((b) => ({ ...b, remaining: b.net })).sort((a, b) => b.remaining - a.remaining);
  const debtors = balances.filter((b) => b.net < -0.01).map((b) => ({ ...b, remaining: -b.net })).sort((a, b) => b.remaining - a.remaining);
  const transfers = [];
  let i = 0;
  let j = 0;
  while (i < creditors.length && j < debtors.length) {
    const creditor = creditors[i];
    const debtor = debtors[j];
    const amount = round(Math.min(creditor.remaining, debtor.remaining));
    transfers.push({
      fromId: debtor.id,
      fromName: debtor.name,
      toId: creditor.id,
      toName: creditor.name,
      amount
    });
    creditor.remaining = round(creditor.remaining - amount);
    debtor.remaining = round(debtor.remaining - amount);
    if (creditor.remaining < 0.01) i++;
    if (debtor.remaining < 0.01) j++;
  }
  return transfers;
}
function round(n) {
  return Math.round(n * 100) / 100;
}

const settlement_get = defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");
  const division = await getDivision(id, event.context.guestToken);
  if (!division) throw createError({ statusCode: 404, statusMessage: "Divisi\xF3n no encontrada" });
  const divParticipants = await db.select().from(participants).where(eq(participants.divisionId, id));
  const divExpenses = await db.select().from(expenses).where(eq(expenses.divisionId, id));
  const expenseIds = divExpenses.map((e) => e.id);
  const splits = expenseIds.length > 0 ? await db.select().from(expenseSplits).where(inArray(expenseSplits.expenseId, expenseIds)) : [];
  const balances = computeBalances(divParticipants, divExpenses, splits);
  const transfers = computeSettlement(balances);
  return { balances, transfers };
});

export { settlement_get as default };
//# sourceMappingURL=settlement.get.mjs.map
