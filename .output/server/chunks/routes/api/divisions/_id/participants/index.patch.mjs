import { c as defineEventHandler, g as getRouterParam, e as createError, r as readBody } from '../../../../../_/nitro.mjs';
import { g as getDivision } from '../../../../../_/getDivision.mjs';
import { z } from 'zod';
import { d as db, p as participants } from '../../../../../_/index.mjs';
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

const index_patch = defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");
  const pid = getRouterParam(event, "pid");
  const division = await getDivision(id, event.context.guestToken);
  if (!division) throw createError({ statusCode: 404, statusMessage: "Divisi\xF3n no encontrada" });
  const body = await readBody(event);
  const schema = z.object({ alias: z.string().max(100).nullable() });
  const parsed = schema.safeParse(body);
  if (!parsed.success) throw createError({ statusCode: 400, statusMessage: "Datos inv\xE1lidos" });
  await db.update(participants).set({ alias: parsed.data.alias }).where(and(eq(participants.id, pid), eq(participants.divisionId, id)));
  const [participant] = await db.select().from(participants).where(eq(participants.id, pid)).limit(1);
  return participant;
});

export { index_patch as default };
//# sourceMappingURL=index.patch.mjs.map
