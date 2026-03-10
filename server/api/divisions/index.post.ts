import { randomUUID } from 'crypto'
import { z } from 'zod'
import { db } from '../../db/index'
import { divisions } from '../../db/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const schema = z.object({ title: z.string().min(1).max(100) })
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'Título requerido' })
  }

  const id = randomUUID()
  await db.insert(divisions).values({
    id,
    title: parsed.data.title,
    guestToken: event.context.guestToken ?? null,
    createdAt: new Date(),
  })

  const [division] = await db.select().from(divisions).where(eq(divisions.id, id)).limit(1)
  setResponseStatus(event, 201)
  return division
})
