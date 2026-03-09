import { Router } from 'express'
import { z } from 'zod'
import { randomUUID } from 'crypto'
import { db } from '../db/index.js'
import { contacts } from '../db/schema.js'
import { eq, and } from 'drizzle-orm'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

// All contacts routes require a registered user
router.use(requireAuth)

// GET /api/contacts
router.get('/', async (req, res) => {
  const list = await db
    .select()
    .from(contacts)
    .where(eq(contacts.ownerUserId, req.auth!.userId))
    .orderBy(contacts.name)

  res.json(list)
})

// POST /api/contacts
router.post('/', async (req, res) => {
  const schema = z.object({ name: z.string().min(1).max(80) })
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Nombre requerido' })
    return
  }

  const id = randomUUID()
  await db.insert(contacts).values({
    id,
    ownerUserId: req.auth!.userId,
    name: parsed.data.name,
    createdAt: new Date(),
  })

  const [contact] = await db.select().from(contacts).where(eq(contacts.id, id)).limit(1)
  res.status(201).json(contact)
})

// DELETE /api/contacts/:id
router.delete('/:id', async (req, res) => {
  await db
    .delete(contacts)
    .where(and(eq(contacts.id, req.params.id), eq(contacts.ownerUserId, req.auth!.userId)))

  res.status(204).end()
})

export default router
