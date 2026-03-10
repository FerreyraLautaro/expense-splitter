import { Router, Request } from 'express'
import { z } from 'zod'
import { randomUUID } from 'crypto'
import { db } from '../db/index.js'
import { divisions, participants, expenses, expenseSplits } from '../db/schema.js'
import { eq, and } from 'drizzle-orm'

const router = Router({ mergeParams: true })

// Helper: check division ownership
async function getDivision(id: string, req: { auth?: { userId: string }; guestToken?: string }) {
  const [division] = await db.select().from(divisions).where(eq(divisions.id, id)).limit(1)
  if (!division) return null
  const isOwner =
    (req.auth && division.ownerUserId === req.auth.userId) ||
    (req.guestToken && division.guestToken === req.guestToken)
  return isOwner ? division : null
}

// POST /api/divisions/:id/expenses
// Body: { description, amount, categoryId, paidBy (participantId), includedParticipantIds[] }
router.post('/', async (req: Request<{ id: string }>, res) => {
  const division = await getDivision(req.params.id, req)
  if (!division) {
    res.status(404).json({ error: 'División no encontrada' })
    return
  }

  const schema = z.object({
    description: z.string().max(200).optional(),
    amount: z.number().positive(),
    categoryId: z.string().optional(),
    paidBy: z.string().uuid(),
    includedParticipantIds: z.array(z.string().uuid()).min(1),
  })

  const parsed = schema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Datos inválidos', details: parsed.error.flatten() })
    return
  }

  const { description, amount, categoryId, paidBy, includedParticipantIds } = parsed.data

  // Validate paidBy belongs to this division
  const [payer] = await db
    .select()
    .from(participants)
    .where(and(eq(participants.id, paidBy), eq(participants.divisionId, division.id)))
    .limit(1)

  if (!payer) {
    res.status(400).json({ error: 'El participante que paga no existe en esta división' })
    return
  }

  // Validate all included participants belong to this division
  const divParticipants = await db
    .select()
    .from(participants)
    .where(eq(participants.divisionId, division.id))

  const validIds = new Set(divParticipants.map((p) => p.id))
  const invalid = includedParticipantIds.filter((id) => !validIds.has(id))
  if (invalid.length > 0) {
    res.status(400).json({ error: 'Algunos participantes no pertenecen a esta división' })
    return
  }

  // Create expense
  const expenseId = randomUUID()
  await db.insert(expenses).values({
    id: expenseId,
    divisionId: division.id,
    categoryId: categoryId ?? null,
    description: description ?? null,
    amount,
    paidBy,
    createdAt: new Date(),
  })

  // Create splits — equal share among included participants
  const shareAmount = Math.round((amount / includedParticipantIds.length) * 100) / 100
  const splitValues = includedParticipantIds.map((participantId) => ({
    id: randomUUID(),
    expenseId,
    participantId,
    amountOwed: shareAmount,
  }))

  await db.insert(expenseSplits).values(splitValues)

  const expense = await db.select().from(expenses).where(eq(expenses.id, expenseId)).limit(1)
  const splits = await db.select().from(expenseSplits).where(eq(expenseSplits.expenseId, expenseId))

  res.status(201).json({ ...expense[0], splits })
})

// DELETE /api/divisions/:id/expenses/:eid
router.delete('/:eid', async (req: Request<{ id: string; eid: string }>, res) => {
  const division = await getDivision(req.params.id, req)
  if (!division) {
    res.status(404).json({ error: 'División no encontrada' })
    return
  }

  await db
    .delete(expenses)
    .where(and(eq(expenses.id, req.params.eid), eq(expenses.divisionId, division.id)))

  res.status(204).end()
})

export default router
