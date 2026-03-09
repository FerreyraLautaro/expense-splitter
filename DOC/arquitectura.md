# Splitr — Arquitectura del sistema

## Visión general

Splitr es una aplicación web de división de gastos. Permite crear una "división", agregar participantes, registrar gastos (con exclusiones por persona), y calcular el mínimo de transferencias necesarias para saldar todas las deudas.

---

## Stack tecnológico

```
┌─────────────────────────────────────────────────────┐
│                    CLIENTE (Browser)                │
│                                                     │
│  Vue 3 + Vite  │  Pinia (estado)  │  Vue Router    │
│  Axios (HTTP)  │  localStorage (guest/auth token)  │
└──────────────────────────┬──────────────────────────┘
                           │ HTTP/JSON  (/api/*)
                           │ Proxy Vite en dev
                           │ (5173 → 3000)
┌──────────────────────────▼──────────────────────────┐
│                   BACKEND (Node.js)                 │
│                                                     │
│  Express 4  │  TypeScript (tsx)  │  Drizzle ORM    │
│  jose (JWT)  │  Zod (validación) │  Resend (email) │
└──────────────────────────┬──────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────┐
│                    BASE DE DATOS                    │
│                                                     │
│  SQLite (MVP)  →  Turso/libSQL (producción)        │
│  Driver: @libsql/client (sin compilación nativa)   │
└─────────────────────────────────────────────────────┘
```

---

## Modelo de datos

```
users
  id (PK, UUID)
  email (unique)
  created_at

otp_codes
  id (PK)
  email
  code_hash (SHA-256)
  expires_at (~10 min)
  used (bool)

divisions
  id (PK, UUID)
  title
  owner_user_id (FK users, nullable — null = invitado)
  guest_token   (nullable — token del invitado)
  created_at
  closed_at

participants
  id (PK, UUID)
  division_id (FK divisions)
  name
  alias         ← CBU alias para recibir transferencias (opcional)
  contact_id (FK contacts, nullable)

expenses
  id (PK, UUID)
  division_id (FK divisions)
  description (nullable)
  amount
  paid_by (FK participants)
  created_at

expense_splits                        ← solo participantes INCLUIDOS
  id (PK)
  expense_id (FK expenses)
  participant_id (FK participants)
  amount_owed   ← precalculado: amount / cantidad_incluidos

contacts                              ← directorio personal (usuarios registrados)
  id (PK)
  owner_user_id (FK users)
  name
  created_at

categories                            ← tabla seed, mantenida para uso futuro
  id, name, icon
```

---

## Flujo de autenticación

```
USUARIO REGISTRADO
──────────────────
1. POST /api/auth/send-otp  { email }
   → genera código 6 dígitos, lo hashea (SHA-256), lo guarda con TTL 10min
   → envía email vía Resend

2. POST /api/auth/verify-otp  { email, code }
   → verifica hash, marca como usado
   → crea usuario si no existe
   → retorna JWT (30 días, HS256)

3. Requests siguientes: Authorization: Bearer <jwt>
   → middleware parseAuth verifica JWT y setea req.auth

INVITADO
────────
1. Frontend genera guest_<uuid> localmente
2. Lo guarda en localStorage con timestamp de expiración (6h)
3. Authorization: Bearer guest_<uuid>
   → middleware parseAuth detecta el prefijo "guest_"
   → setea req.guestToken
4. Divisiones creadas por invitado almacenan el guest_token
   → acceso scoped: solo quien tenga ese token puede ver/editar
```

---

## Algoritmo de settlement (minimización de deudas)

```
ENTRADA: lista de participantes con sus balances netos
         balance_neto = total_pagado - total_debido

PROCESO:
  1. Separar en:
     - acreedores: balance > 0  (se les debe dinero)
     - deudores:   balance < 0  (deben dinero)

  2. Ordenar ambas listas de mayor a menor (por valor absoluto)

  3. Greedy matching:
     MIENTRAS queden acreedores Y deudores:
       a. tomar mayor acreedor y mayor deudor
       b. transferencia = min(acreedor.restante, deudor.restante)
       c. registrar: deudor → acreedor : transferencia
       d. reducir ambos restantes
       e. si restante < 0.01 → pasar al siguiente

SALIDA: lista mínima (o near-mínima) de transferencias

COMPLEJIDAD: O(n log n) — óptimo para el caso promedio
```

---

## Endpoints REST

```
AUTH
  POST /api/auth/send-otp          → envía OTP al email
  POST /api/auth/verify-otp        → verifica OTP, retorna JWT
  GET  /api/auth/me                → info del usuario (auth required)

DIVISIONS
  POST   /api/divisions            → crear división (user o guest)
  GET    /api/divisions            → listar divisiones del usuario (auth required)
  GET    /api/divisions/:id        → división completa (participants + expenses + splits)
  PATCH  /api/divisions/:id        → actualizar título
  DELETE /api/divisions/:id        → eliminar

PARTICIPANTS
  POST   /api/divisions/:id/participants       → agregar participante
  PATCH  /api/divisions/:id/participants/:pid  → actualizar alias
  DELETE /api/divisions/:id/participants/:pid  → quitar participante

EXPENSES
  POST   /api/divisions/:id/expenses/:eid  → agregar gasto con splits
  DELETE /api/divisions/:id/expenses/:eid  → eliminar gasto

SETTLEMENT
  GET /api/divisions/:id/settlement  → balances + transferencias mínimas

CONTACTS (auth required)
  GET    /api/contacts     → listar contactos del usuario
  POST   /api/contacts     → guardar contacto
  DELETE /api/contacts/:id → eliminar contacto

MISC
  GET /api/categories      → lista de categorías (seed)
  GET /api/health          → health check
```

---

## Estructura de archivos

```
expense-splitter/
├── CLAUDE.md                    ← guía para Claude Code
├── DOC/                         ← esta documentación
│   ├── arquitectura.md
│   └── diagrama.md
├── backend/
│   ├── .env.example
│   ├── drizzle.config.ts
│   ├── drizzle/                 ← migraciones SQL auto-generadas
│   ├── data/                    ← db.sqlite (gitignored)
│   └── src/
│       ├── index.ts             ← entry point: Express + migrations + seed
│       ├── db/
│       │   ├── schema.ts        ← fuente de verdad del modelo de datos
│       │   └── index.ts         ← conexión libSQL + instancia Drizzle
│       ├── middleware/auth.ts   ← parseAuth + requireAuth
│       ├── routes/              ← un archivo por dominio
│       └── services/
│           ├── settlement.ts    ← algoritmo greedy
│           ├── otp.ts           ← generación y verificación de códigos
│           └── email.ts         ← Resend
└── frontend/
    ├── index.html               ← imports Google Fonts (Cormorant Garamond, DM Sans, DM Mono)
    ├── vite.config.ts           ← proxy /api → :3000
    └── src/
        ├── assets/main.css      ← design tokens "The Ledger"
        ├── api/index.ts         ← Axios + tipos TypeScript compartidos
        ├── router/index.ts
        ├── stores/
        │   ├── auth.ts          ← sesión usuario + guest (localStorage)
        │   └── division.ts      ← estado división activa
        ├── views/
        │   ├── HomeView.vue     ← landing + crear división
        │   ├── AuthView.vue     ← email → OTP
        │   ├── DivisionView.vue ← vista principal (cards sin tabs)
        │   └── ResultView.vue   ← resultado + copy WhatsApp
        └── components/
            └── ParticipantCard.vue ← card expandible con alias + gastos inline
```
