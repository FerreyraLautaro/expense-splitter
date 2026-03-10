import { d as db, b as divisions } from './index.mjs';
import { eq } from 'drizzle-orm';

async function getDivision(id, guestToken) {
  const [division] = await db.select().from(divisions).where(eq(divisions.id, id)).limit(1);
  if (!division) return null;
  return division.guestToken === guestToken ? division : null;
}

export { getDivision as g };
//# sourceMappingURL=getDivision.mjs.map
