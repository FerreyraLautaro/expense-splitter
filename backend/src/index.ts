import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { parseAuth } from './middleware/auth.js'
import authRouter from './routes/auth.js'
import divisionsRouter from './routes/divisions.js'
import expensesRouter from './routes/expenses.js'
import contactsRouter from './routes/contacts.js'
import categoriesRouter from './routes/categories.js'
import { db } from './db/index.js'
import { categories } from './db/schema.js'
import { migrate } from 'drizzle-orm/libsql/migrator'

const app = express()
const PORT = parseInt(process.env.PORT ?? '3000')

app.use(cors({ origin: process.env.FRONTEND_URL ?? 'http://localhost:5173' }))
app.use(express.json())
app.use(parseAuth)

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth', authRouter)
app.use('/api/divisions', divisionsRouter)
app.use('/api/divisions/:id/expenses', expensesRouter)
app.use('/api/contacts', contactsRouter)
app.use('/api/categories', categoriesRouter)

app.get('/api/health', (_req, res) => res.json({ ok: true }))

// ─── Startup ──────────────────────────────────────────────────────────────────
async function start() {
  // Run migrations
  await migrate(db, { migrationsFolder: './drizzle' })

  // Seed categories if empty
  const existing = await db.select().from(categories).limit(1)
  if (existing.length === 0) {
    await db.insert(categories).values([
      { id: '1', name: 'Comida', icon: '🍽️' },
      { id: '2', name: 'Bebida', icon: '🥤' },
      { id: '3', name: 'Postre', icon: '🍰' },
      { id: '4', name: 'Transporte', icon: '🚗' },
      { id: '5', name: 'Alojamiento', icon: '🏨' },
      { id: '6', name: 'Entretenimiento', icon: '🎉' },
      { id: '7', name: 'Compras', icon: '🛍️' },
      { id: '8', name: 'Otro', icon: '🧾' },
    ])
    console.log('✓ Categorías inicializadas')
  }

  app.listen(PORT, () => {
    console.log(`✓ Backend corriendo en http://localhost:${PORT}`)
  })
}

start().catch((err) => {
  console.error('Error al iniciar:', err)
  process.exit(1)
})
