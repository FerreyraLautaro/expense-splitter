import { db } from '../../../../../db/index'
import { participants } from '../../../../../db/schema'
import { eq, and } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!
  const pid = getRouterParam(event, 'pid')!
  const division = await getDivision(id, event.context.guestToken)
  if (!division) throw createError({ statusCode: 404, statusMessage: 'División no encontrada' })

  await db.delete(participants).where(and(eq(participants.id, pid), eq(participants.divisionId, id)))
  setResponseStatus(event, 204)
  return null
})
