import { db } from '../../../../db/index'
import { expenses } from '../../../../db/schema'
import { eq, and } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!
  const eid = getRouterParam(event, 'eid')!
  const division = await getDivision(id, event.context.guestToken)
  if (!division) throw createError({ statusCode: 404, statusMessage: 'División no encontrada' })

  await db.delete(expenses).where(and(eq(expenses.id, eid), eq(expenses.divisionId, id)))
  setResponseStatus(event, 204)
  return null
})
