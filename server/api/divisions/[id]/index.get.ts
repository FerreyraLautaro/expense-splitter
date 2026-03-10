import { db } from '../../../db/index'
import { participants, expenses, expenseSplits } from '../../../db/schema'
import { eq, inArray } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!
  const division = await getDivision(id, event.context.guestToken)
  if (!division) throw createError({ statusCode: 404, statusMessage: 'División no encontrada' })

  const divParticipants = await db.select().from(participants).where(eq(participants.divisionId, id))
  const divExpenses = await db.select().from(expenses).where(eq(expenses.divisionId, id))
  const expenseIds = divExpenses.map((e) => e.id)
  const splits = expenseIds.length > 0
    ? await db.select().from(expenseSplits).where(inArray(expenseSplits.expenseId, expenseIds))
    : []

  return { ...division, participants: divParticipants, expenses: divExpenses, splits }
})
