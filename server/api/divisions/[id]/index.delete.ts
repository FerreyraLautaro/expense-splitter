import { db } from '../../../db/index'
import { divisions } from '../../../db/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!
  const division = await getDivision(id, event.context.guestToken)
  if (!division) throw createError({ statusCode: 404, statusMessage: 'División no encontrada' })

  await db.delete(divisions).where(eq(divisions.id, id))
  setResponseStatus(event, 204)
  return null
})
