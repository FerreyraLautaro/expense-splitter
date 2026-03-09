import { createHash, randomInt } from 'crypto'
import { db } from '../db/index.js'
import { otpCodes } from '../db/schema.js'
import { eq, and, gt } from 'drizzle-orm'
import { randomUUID } from 'crypto'

const TTL_MINUTES = parseInt(process.env.OTP_TTL_MINUTES ?? '10')

/** Generates a 6-digit OTP, stores it hashed, returns the plain code. */
export async function createOtp(email: string): Promise<string> {
  const code = String(randomInt(100000, 999999))
  const codeHash = hashCode(code)
  const expiresAt = new Date(Date.now() + TTL_MINUTES * 60 * 1000)

  // Invalidate any existing unused codes for this email
  await db
    .update(otpCodes)
    .set({ used: true })
    .where(eq(otpCodes.email, email))

  await db.insert(otpCodes).values({
    id: randomUUID(),
    email,
    codeHash,
    expiresAt,
    used: false,
  })

  return code
}

/** Verifies a code. Returns true and marks it used, or returns false. */
export async function verifyOtp(email: string, code: string): Promise<boolean> {
  const now = new Date()
  const codeHash = hashCode(code)

  const [record] = await db
    .select()
    .from(otpCodes)
    .where(
      and(
        eq(otpCodes.email, email),
        eq(otpCodes.codeHash, codeHash),
        eq(otpCodes.used, false),
        gt(otpCodes.expiresAt, now),
      ),
    )
    .limit(1)

  if (!record) return false

  await db.update(otpCodes).set({ used: true }).where(eq(otpCodes.id, record.id))
  return true
}

function hashCode(code: string): string {
  return createHash('sha256').update(code).digest('hex')
}
