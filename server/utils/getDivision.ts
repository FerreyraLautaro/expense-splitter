import { db } from '../db/index'
import { divisions } from '../db/schema'
import { eq } from 'drizzle-orm'

export async function getDivision(id: string, guestToken?: string) {
  const [division] = await db.select().from(divisions).where(eq(divisions.id, id)).limit(1)
  if (!division) return null
  return division.guestToken === guestToken ? division : null
}
