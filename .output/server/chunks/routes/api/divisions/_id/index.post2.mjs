import { c as defineEventHandler, g as getRouterParam, e as createError, r as readBody, f as setResponseStatus } from '../../../../_/nitro.mjs';
import { g as getDivision } from '../../../../_/getDivision.mjs';
import { randomUUID } from 'crypto';
import { z } from 'zod';
import { d as db, p as participants } from '../../../../_/index.mjs';
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

const index_post = defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");
  const division = await getDivision(id, event.context.guestToken);
  if (!division) throw createError({ statusCode: 404, statusMessage: "Divisi\xF3n no encontrada" });
  const body = await readBody(event);
  const schema = z.object({ name: z.string().min(1).max(80) });
  const parsed = schema.safeParse(body);
  if (!parsed.success) throw createError({ statusCode: 400, statusMessage: "Nombre requerido" });
  const pid = randomUUID();
  await db.insert(participants).values({ id: pid, divisionId: id, name: parsed.data.name });
  const [participant] = await db.select().from(participants).where(eq(participants.id, pid)).limit(1);
  setResponseStatus(event, 201);
  return participant;
});

export { index_post as default };
//# sourceMappingURL=index.post2.mjs.map
