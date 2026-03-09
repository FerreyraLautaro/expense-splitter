import { Router } from 'express'
import { db } from '../db/index.js'
import { categories } from '../db/schema.js'
import { asc } from 'drizzle-orm'

const router = Router()

// GET /api/categories
router.get('/', async (_req, res) => {
  const list = await db.select().from(categories).orderBy(asc(categories.name))
  res.json(list)
})

export default router
