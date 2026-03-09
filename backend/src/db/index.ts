import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import * as schema from './schema.js'

const url = process.env.DATABASE_URL ?? 'file:./data/db.sqlite'

const client = createClient({ url })
export const db = drizzle(client, { schema })
export type DB = typeof db
