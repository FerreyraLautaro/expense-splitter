import { Router } from 'express'
import { z } from 'zod'
import { randomUUID } from 'crypto'
import { db } from '../db/index.js'
import { divisions, participants, expenses, expenseSplits } from '../db/schema.js'
import { eq, and, inArray } from 'drizzle-orm'
import { computeBalances, computeSettlement } from '../services/settlement.js'

const router = Router()

// Helper: check ownership by guestToken
async function getDivision(id: string, req: { guestToken?: string }) {
  const [division] = await db.select().from(divisions).where(eq(divisions.id, id)).limit(1)
  if (!division) return null
  return division.guestToken === req.guestToken ? division : null
}

// POST /api/divisions
router.post('/', async (req, res) => {
  const schema = z.object({ title: z.string().min(1).max(100) })
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Título requerido' })
    return
  }

  const id = randomUUID()
  await db.insert(divisions).values({
    id,
    title: parsed.data.title,
    guestToken: req.guestToken ?? null,
    createdAt: new Date(),
  })

  const [division] = await db.select().from(divisions).where(eq(divisions.id, id)).limit(1)
  res.status(201).json(division)
})

// GET /api/divisions/:id — full division with participants, expenses and splits
router.get('/:id', async (req, res) => {
  const division = await getDivision(req.params.id, req)
  if (!division) {
    res.status(404).json({ error: 'División no encontrada' })
    return
  }

  const divParticipants = await db
    .select()
    .from(participants)
    .where(eq(participants.divisionId, division.id))

  const divExpenses = await db
    .select()
    .from(expenses)
    .where(eq(expenses.divisionId, division.id))

  const expenseIds = divExpenses.map((e) => e.id)
  const splits =
    expenseIds.length > 0
      ? await db.select().from(expenseSplits).where(inArray(expenseSplits.expenseId, expenseIds))
      : []

  res.json({ ...division, participants: divParticipants, expenses: divExpenses, splits })
})

// PATCH /api/divisions/:id
router.patch('/:id', async (req, res) => {
  const division = await getDivision(req.params.id, req)
  if (!division) {
    res.status(404).json({ error: 'División no encontrada' })
    return
  }

  const schema = z.object({ title: z.string().min(1).max(100).optional() })
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Datos inválidos' })
    return
  }

  await db.update(divisions).set(parsed.data).where(eq(divisions.id, division.id))
  res.json({ ...division, ...parsed.data })
})

// DELETE /api/divisions/:id
router.delete('/:id', async (req, res) => {
  const division = await getDivision(req.params.id, req)
  if (!division) {
    res.status(404).json({ error: 'División no encontrada' })
    return
  }

  await db.delete(divisions).where(eq(divisions.id, division.id))
  res.status(204).end()
})

// ─── Participants ──────────────────────────────────────────────────────────────

// POST /api/divisions/:id/participants
router.post('/:id/participants', async (req, res) => {
  const division = await getDivision(req.params.id, req)
  if (!division) {
    res.status(404).json({ error: 'División no encontrada' })
    return
  }

  const schema = z.object({ name: z.string().min(1).max(80) })
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Nombre requerido' })
    return
  }

  const id = randomUUID()
  await db.insert(participants).values({ id, divisionId: division.id, name: parsed.data.name })

  const [participant] = await db.select().from(participants).where(eq(participants.id, id)).limit(1)
  res.status(201).json(participant)
})

// PATCH /api/divisions/:id/participants/:pid — update alias
router.patch('/:id/participants/:pid', async (req, res) => {
  const division = await getDivision(req.params.id, req)
  if (!division) {
    res.status(404).json({ error: 'División no encontrada' })
    return
  }

  const schema = z.object({ alias: z.string().max(100).nullable() })
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Datos inválidos' })
    return
  }

  await db
    .update(participants)
    .set({ alias: parsed.data.alias })
    .where(and(eq(participants.id, req.params.pid), eq(participants.divisionId, division.id)))

  const [participant] = await db
    .select()
    .from(participants)
    .where(eq(participants.id, req.params.pid))
    .limit(1)
  res.json(participant)
})

// DELETE /api/divisions/:id/participants/:pid
router.delete('/:id/participants/:pid', async (req, res) => {
  const division = await getDivision(req.params.id, req)
  if (!division) {
    res.status(404).json({ error: 'División no encontrada' })
    return
  }

  await db
    .delete(participants)
    .where(and(eq(participants.id, req.params.pid), eq(participants.divisionId, division.id)))

  res.status(204).end()
})

// ─── Settlement ────────────────────────────────────────────────────────────────

// GET /api/divisions/:id/settlement
router.get('/:id/settlement', async (req, res) => {
  const division = await getDivision(req.params.id, req)
  if (!division) {
    res.status(404).json({ error: 'División no encontrada' })
    return
  }

  const divParticipants = await db
    .select()
    .from(participants)
    .where(eq(participants.divisionId, division.id))

  const divExpenses = await db
    .select()
    .from(expenses)
    .where(eq(expenses.divisionId, division.id))

  const expenseIds = divExpenses.map((e) => e.id)
  const splits =
    expenseIds.length > 0
      ? await db.select().from(expenseSplits).where(inArray(expenseSplits.expenseId, expenseIds))
      : []

  const balances = computeBalances(divParticipants, divExpenses, splits)
  const transfers = computeSettlement(balances)

  res.json({ balances, transfers })
})

export default router
