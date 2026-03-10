import { z } from 'zod'
import { db } from '../../../../../db/index'
import { participants } from '../../../../../db/schema'
import { eq, and } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!
  const pid = getRouterParam(event, 'pid')!
  const division = await getDivision(id, event.context.guestToken)
  if (!division) throw createError({ statusCode: 404, statusMessage: 'División no encontrada' })

  const body = await readBody(event)
  const schema = z.object({ alias: z.string().max(100).nullable() })
  const parsed = schema.safeParse(body)
  if (!parsed.success) throw createError({ statusCode: 400, statusMessage: 'Datos inválidos' })

  await db.update(participants).set({ alias: parsed.data.alias })
    .where(and(eq(participants.id, pid), eq(participants.divisionId, id)))

  const [participant] = await db.select().from(participants).where(eq(participants.id, pid)).limit(1)
  return participant
})
