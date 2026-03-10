import { c as defineEventHandler, r as readBody, e as createError, f as setResponseStatus } from '../../_/nitro.mjs';
import { randomUUID } from 'crypto';
import { z } from 'zod';
import { d as db, b as divisions } from '../../_/index.mjs';
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
  var _a;
  const body = await readBody(event);
  const schema = z.object({ title: z.string().min(1).max(100) });
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: "T\xEDtulo requerido" });
  }
  const id = randomUUID();
  await db.insert(divisions).values({
    id,
    title: parsed.data.title,
    guestToken: (_a = event.context.guestToken) != null ? _a : null,
    createdAt: /* @__PURE__ */ new Date()
  });
  const [division] = await db.select().from(divisions).where(eq(divisions.id, id)).limit(1);
  setResponseStatus(event, 201);
  return division;
});

export { index_post as default };
//# sourceMappingURL=index.post.mjs.map
