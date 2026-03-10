import { c as defineEventHandler, g as getRouterParam, e as createError, r as readBody, f as setResponseStatus } from '../../../../_/nitro.mjs';
import { g as getDivision } from '../../../../_/getDivision.mjs';
import { randomUUID } from 'crypto';
import { z } from 'zod';
import { d as db, p as participants, e as expenses, a as expenseSplits } from '../../../../_/index.mjs';
import { and, eq } from 'drizzle-orm';
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

const index_post = defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");
  const division = await getDivision(id, event.context.guestToken);
  if (!division) throw createError({ statusCode: 404, statusMessage: "Divisi\xF3n no encontrada" });
  const body = await readBody(event);
  const schema = z.object({
    description: z.string().max(200).optional(),
    amount: z.number().positive(),
    categoryId: z.string().optional(),
    paidBy: z.string().uuid(),
    includedParticipantIds: z.array(z.string().uuid()).min(1)
  });
  const parsed = schema.safeParse(body);
  if (!parsed.success) throw createError({ statusCode: 400, statusMessage: "Datos inv\xE1lidos" });
  const { description, amount, categoryId, paidBy, includedParticipantIds } = parsed.data;
  const [payer] = await db.select().from(participants).where(and(eq(participants.id, paidBy), eq(participants.divisionId, id))).limit(1);
  if (!payer) throw createError({ statusCode: 400, statusMessage: "El participante que paga no existe" });
  const divParticipants = await db.select().from(participants).where(eq(participants.divisionId, id));
  const validIds = new Set(divParticipants.map((p) => p.id));
  const invalid = includedParticipantIds.filter((pid) => !validIds.has(pid));
  if (invalid.length > 0) throw createError({ statusCode: 400, statusMessage: "Participante inv\xE1lido" });
  const expenseId = randomUUID();
  await db.insert(expenses).values({
    id: expenseId,
    divisionId: id,
    categoryId: categoryId != null ? categoryId : null,
    description: description != null ? description : null,
    amount,
    paidBy,
    createdAt: /* @__PURE__ */ new Date()
  });
  const shareAmount = Math.round(amount / includedParticipantIds.length * 100) / 100;
  await db.insert(expenseSplits).values(
    includedParticipantIds.map((participantId) => ({
      id: randomUUID(),
      expenseId,
      participantId,
      amountOwed: shareAmount
    }))
  );
  const [expense] = await db.select().from(expenses).where(eq(expenses.id, expenseId)).limit(1);
  const splits = await db.select().from(expenseSplits).where(eq(expenseSplits.expenseId, expenseId));
  setResponseStatus(event, 201);
  return { ...expense, splits };
});

export { index_post as default };
//# sourceMappingURL=index.post.mjs.map
