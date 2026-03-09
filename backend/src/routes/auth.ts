import { Router } from 'express'
import { z } from 'zod'
import { SignJWT } from 'jose'
import { randomUUID } from 'crypto'
import { db } from '../db/index.js'
import { users } from '../db/schema.js'
import { eq } from 'drizzle-orm'
import { createOtp, verifyOtp } from '../services/otp.js'
import { sendOtpEmail } from '../services/email.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()
const secret = new TextEncoder().encode(process.env.JWT_SECRET ?? 'dev-secret')

// POST /api/auth/send-otp
router.post('/send-otp', async (req, res) => {
  const schema = z.object({ email: z.string().email() })
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Email inválido' })
    return
  }

  const { email } = parsed.data
  const code = await createOtp(email)

  try {
    await sendOtpEmail(email, code)
  } catch (err) {
    console.error('Error sending OTP email:', err)
    res.status(500).json({ error: 'No se pudo enviar el email' })
    return
  }

  res.json({ message: 'Código enviado' })
})

// POST /api/auth/verify-otp
router.post('/verify-otp', async (req, res) => {
  const schema = z.object({
    email: z.string().email(),
    code: z.string().length(6),
  })
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Datos inválidos' })
    return
  }

  const { email, code } = parsed.data
  const valid = await verifyOtp(email, code)
  if (!valid) {
    res.status(401).json({ error: 'Código inválido o expirado' })
    return
  }

  // Find or create user
  let [user] = await db.select().from(users).where(eq(users.email, email)).limit(1)
  if (!user) {
    const newUser = { id: randomUUID(), email, createdAt: new Date() }
    await db.insert(users).values(newUser)
    user = newUser
  }

  const token = await new SignJWT({ email })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(secret)

  res.json({ token, user: { id: user.id, email: user.email } })
})

// GET /api/auth/me
router.get('/me', requireAuth, async (req, res) => {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, req.auth!.userId))
    .limit(1)

  if (!user) {
    res.status(404).json({ error: 'Usuario no encontrado' })
    return
  }

  res.json({ id: user.id, email: user.email })
})

export default router
