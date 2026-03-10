import { c as defineEventHandler, g as getRouterParam, e as createError, f as setResponseStatus } from '../../../../../_/nitro.mjs';
import { g as getDivision } from '../../../../../_/getDivision.mjs';
import { d as db, e as expenses } from '../../../../../_/index.mjs';
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

const _eid__delete = defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");
  const eid = getRouterParam(event, "eid");
  const division = await getDivision(id, event.context.guestToken);
  if (!division) throw createError({ statusCode: 404, statusMessage: "Divisi\xF3n no encontrada" });
  await db.delete(expenses).where(and(eq(expenses.id, eid), eq(expenses.divisionId, id)));
  setResponseStatus(event, 204);
  return null;
});

export { _eid__delete as default };
//# sourceMappingURL=_eid_.delete.mjs.map
