import { c as defineEventHandler, g as getRouterParam, e as createError, r as readBody } from '../../../_/nitro.mjs';
import { g as getDivision } from '../../../_/getDivision.mjs';
import { z } from 'zod';
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

const index_patch = defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");
  const division = await getDivision(id, event.context.guestToken);
  if (!division) throw createError({ statusCode: 404, statusMessage: "Divisi\xF3n no encontrada" });
  const body = await readBody(event);
  const schema = z.object({ title: z.string().min(1).max(100).optional() });
  const parsed = schema.safeParse(body);
  if (!parsed.success) throw createError({ statusCode: 400, statusMessage: "Datos inv\xE1lidos" });
  await db.update(divisions).set(parsed.data).where(eq(divisions.id, id));
  return { ...division, ...parsed.data };
});

export { index_patch as default };
//# sourceMappingURL=index.patch.mjs.map
