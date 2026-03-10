import { c as defineEventHandler, g as getRouterParam, e as createError, f as setResponseStatus } from '../../../_/nitro.mjs';
import { g as getDivision } from '../../../_/getDivision.mjs';
import { d as db, b as divisions } from '../../../_/index.mjs';
import { eq } from 'drizzle-orm';
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

const index_delete = defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");
  const division = await getDivision(id, event.context.guestToken);
  if (!division) throw createError({ statusCode: 404, statusMessage: "Divisi\xF3n no encontrada" });
  await db.delete(divisions).where(eq(divisions.id, id));
  setResponseStatus(event, 204);
  return null;
});

export { index_delete as default };
//# sourceMappingURL=index.delete.mjs.map
