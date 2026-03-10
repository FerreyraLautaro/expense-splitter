import { db } from '../db/index'
import { categories } from '../db/schema'
import { asc } from 'drizzle-orm'

export default defineEventHandler(async () => {
  return db.select().from(categories).orderBy(asc(categories.name))
})
