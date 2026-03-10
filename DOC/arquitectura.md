# Splitr — Arquitectura del sistema

## Visión general

Splitr es una aplicación web de división de gastos. Permite crear una "división", agregar participantes, registrar gastos (con exclusiones por persona), y calcular el mínimo de transferencias necesarias para saldar todas las deudas.

**Todo corre en el browser — sin backend, sin base de datos, sin autenticación.**

---

## Stack tecnológico

```
┌─────────────────────────────────────────────────────┐
│                    BROWSER (SPA)                    │
│                                                     │
│  Nuxt 3 (ssr: false)  │  Pinia (estado global)     │
│  Vue Router           │  localStorage (datos)       │
│  utils/settlement.ts  ← algoritmo greedy            │
└─────────────────────────────────────────────────────┘
```

No hay servidor de aplicación ni base de datos. Todo el estado se persiste en `localStorage` del navegador bajo la clave `splitr_div_<uuid>`.

---

## Modelo de datos (en memoria / localStorage)

```
DivisionFull
  id          (UUID, generado en cliente)
  title
  createdAt
  closedAt    (nullable)
  guestToken  (nullable, legacy — actualmente sin uso)
  participants[]
  expenses[]
  splits[]

Participant
  id          (UUID)
  divisionId
  name
  alias       (CBU alias para transferencias, opcional)

Expense
  id          (UUID)
  divisionId
  description (nullable)
  amount
  paidBy      (participantId)
  createdAt

ExpenseSplit                    ← solo participantes INCLUIDOS
  id          (UUID)
  expenseId
  participantId
  amountOwed  ← precalculado: amount / cantidad_incluidos
```

---

## Flujo de datos

```
Usuario crea división
  → crypto.randomUUID() como id
  → guarda DivisionFull en localStorage

Usuario agrega participante / gasto
  → store muta el objeto en memoria
  → llama save() → localStorage.setItem(...)

Usuario navega a /result
  → store llama loadSettlement()
  → computeBalances() + computeSettlement() (client-side)
  → renderiza transferencias
```

---

## Algoritmo de settlement (utils/settlement.ts)

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

COMPLEJIDAD: O(n log n)
```

---

## Estructura de archivos

```
expense-splitter/
├── CLAUDE.md                    ← guía para Claude Code
├── DOC/                         ← esta documentación
│   ├── arquitectura.md
│   └── diagrama.md
├── nuxt.config.ts               ← ssr: false, @pinia/nuxt, global CSS
├── app.vue                      ← root de la app
├── assets/main.css              ← design tokens "The Ledger"
├── types/index.ts               ← interfaces TypeScript compartidas
├── utils/
│   └── settlement.ts            ← computeBalances + computeSettlement
├── stores/
│   └── division.ts              ← estado + mutaciones + localStorage I/O
├── pages/
│   ├── index.vue                ← landing + crear división
│   └── division/[id]/
│       ├── index.vue            ← participantes + formulario de gastos
│       └── result.vue           ← settlement + alias + copy WhatsApp
└── components/
    └── ParticipantCard.vue      ← card expandible: alias + expense form + exclusiones
```

---

## Deploy

- **Plataforma**: Vercel (Nuxt 3 auto-detectado)
- **Build**: `nuxt build` (SPA estático)
- **Sin variables de entorno requeridas** — todo es client-side
