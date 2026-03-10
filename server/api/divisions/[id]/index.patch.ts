import { z } from 'zod'
import { db } from '../../../db/index'
import { divisions } from '../../../db/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!
  const division = await getDivision(id, event.context.guestToken)
  if (!division) throw createError({ statusCode: 404, statusMessage: 'División no encontrada' })

  const body = await readBody(event)
  const schema = z.object({ title: z.string().min(1).max(100).optional() })
  const parsed = schema.safeParse(body)
  if (!parsed.success) throw createError({ statusCode: 400, statusMessage: 'Datos inválidos' })

  await db.update(divisions).set(parsed.data).where(eq(divisions.id, id))
  return { ...division, ...parsed.data }
})
