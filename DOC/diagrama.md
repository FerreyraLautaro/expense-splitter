# Splitr — Diagramas

## Flujo de usuario (happy path)

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USUARIO ABRE LA APP                         │
└─────────────────────────────────┬───────────────────────────────────┘
                                  │
              ┌───────────────────▼──────────────────┐
              │              index.vue (/)            │
              │                                       │
              │   Ingresa nombre de división          │
              │   → click "Crear →"                   │
              │   → crypto.randomUUID() como id       │
              │   → guarda en localStorage            │
              │   → navega a /division/:id            │
              └───────────────────┬───────────────────┘
                                  │
              ┌───────────────────▼──────────────────┐
              │     division/[id]/index.vue           │
              │                                       │
              │  1. Agregar participantes             │
              │     → input name + Enter             │
              │     → store.addParticipant()          │
              │     → guarda en localStorage          │
              │                                       │
              │  2. Expandir card de participante    │
              │     → ingresar alias CBU (blur save) │
              │     → click "+" para agregar gasto   │
              │                                       │
              │  3. Inline expense form              │
              │     → monto + descripción            │
              │     → excluir participantes (chips)  │
              │     → preview: $X c/u × N pers.     │
              │     → "✓ Guardar"                    │
              │     → store.addExpense()              │
              │     → guarda en localStorage          │
              │                                       │
              └───────────────────┬───────────────────┘
                                  │ click "Ver resultado →"
                                  ▼
              ┌──────────────────────────────────────┐
              │   division/[id]/result.vue           │
              │                                      │
              │  computeBalances() client-side        │
              │  computeSettlement() client-side      │
              │                                      │
              │  ┌────────────────────────────────┐  │
              │  │   TRANSFERENCIAS MÍNIMAS       │  │
              │  │                                │  │
              │  │  Pela →$300→ Luis              │  │
              │  │           alias: luis.gonzalez │  │
              │  │  Joaco →$150→ Luis             │  │
              │  │           alias: luis.gonzalez │  │
              │  └────────────────────────────────┘  │
              │                                      │
              │  [📋 Copiar para WhatsApp]           │
              │   → genera texto con formato *bold*  │
              │   → incluye alias del acreedor       │
              │                                      │
              │  BALANCE POR PERSONA                 │
              │  Luis  +$450  │ Joaco -$150 │ ...    │
              └──────────────────────────────────────┘
```

---

## Modelo de relaciones

```
DivisionFull (localStorage)
  │ 1
  │ N
  ├── participants ──── alias (CBU alias, opcional)
  │     │ 1
  │     │ N (paidBy)
  │     └── expenses
  │               │ 1
  │               │ N
  │               └── expense_splits (solo incluidos)
  │                     │ N
  │                     └──── participants
```

---

## Algoritmo de deudas — ejemplo visual

```
Gastos:
  Primer vino  $14.500  → Luis paga  → incluye: todos (7)
  Segundo vino $14.500  → Lauta paga → incluye: sin Pela (6)
  Ultimo vino  $ 8.000  → Elias paga → incluye: sin Pela (6)

Balances netos:
  Luis   +$8.678  ████████████████░░░░  ACREEDOR
  Lauta  +$8.678  ████████████████░░░░  ACREEDOR
  Elias  +$2.178  ████░░░░░░░░░░░░░░░░  ACREEDOR
  Joa    -$5.821  ████████████░░░░░░░░  DEUDOR
  Pablo  -$5.821  ████████████░░░░░░░░  DEUDOR
  Fabri  -$5.821  ████████████░░░░░░░░  DEUDOR
  Pela   -$2.071  ████░░░░░░░░░░░░░░░░  DEUDOR

Greedy matching (6 transferencias):
  1. Joa   →$5.821→ Luis   (Luis: +2.857 restante)
  2. Pablo →$2.857→ Luis   (Luis: saldado ✓)
  3. Pablo →$2.964→ Lauta  (Lauta: +5.714 restante)
  4. Fabri →$5.714→ Lauta  (Lauta: saldado ✓)
  5. Fabri →$0.107→ Elias  (Fabri: saldado ✓)
  6. Pela  →$2.071→ Elias  (Elias: saldado ✓)

Resultado: 6 transferencias para saldar $37.000 entre 7 personas
```

---

## Diseño visual — "The Ledger"

```
Paleta:
  --bg:           #0F1C17  ← fondo principal (verde oscuro)
  --surface:      #162820  ← cards
  --surface-2:    #1E2E29  ← inputs, filas
  --border:       #2A3F38  ← bordes sutiles
  --accent:       #D4A84B  ← dorado (acciones, montos)
  --text-primary: #EDE8D8  ← crema cálido
  --text-secondary:#7A9E93 ← sage muted
  --red:          #E05C3A  ← deudas
  --green:        #4AB87A  ← créditos

Tipografía:
  Display: Cormorant Garamond (serif, editorial)
  Body:    DM Sans (sans-serif, limpio)
  Mono:    DM Mono (números, labels, código)
```
