import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import * as schema from './schema.js'

const url = process.env.DATABASE_URL ?? 'file:./data/db.sqlite'
const authToken = process.env.TURSO_AUTH_TOKEN

const client = createClient(authToken ? { url, authToken } : { url })
export const db = drizzle(client, { schema })
export type DB = typeof db
