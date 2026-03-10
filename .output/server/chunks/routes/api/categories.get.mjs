import { c as defineEventHandler } from '../../_/nitro.mjs';
import { d as db, c as categories } from '../../_/index.mjs';
import { asc } from 'drizzle-orm';
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

const categories_get = defineEventHandler(async () => {
  return db.select().from(categories).orderBy(asc(categories.name));
});

export { categories_get as default };
//# sourceMappingURL=categories.get.mjs.map
