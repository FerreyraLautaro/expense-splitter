import { randomUUID } from 'crypto'
import { z } from 'zod'
import { db } from '../../../../db/index'
import { participants } from '../../../../db/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!
  const division = await getDivision(id, event.context.guestToken)
  if (!division) throw createError({ statusCode: 404, statusMessage: 'División no encontrada' })

  const body = await readBody(event)
  const schema = z.object({ name: z.string().min(1).max(80) })
  const parsed = schema.safeParse(body)
  if (!parsed.success) throw createError({ statusCode: 400, statusMessage: 'Nombre requerido' })

  const pid = randomUUID()
  await db.insert(participants).values({ id: pid, divisionId: id, name: parsed.data.name })

  const [participant] = await db.select().from(participants).where(eq(participants.id, pid)).limit(1)
  setResponseStatus(event, 201)
  return participant
})
