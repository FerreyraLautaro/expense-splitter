# ✦ splitr

> Divide gastos entre amigos con el mínimo de transferencias posibles.

![Home](home.png)

## ¿Qué hace?

1. **Creás una división** (ej: "Cena del viernes")
2. **Sumás participantes** y cargás gastos inline en la card de cada uno
3. **Excluís personas** por gasto si alguien no participó 
4. **El algoritmo calcula** el set mínimo de transferencias para saldar todo

![División](division.png)

![Resultado](result.png) 

## Stack

| Capa | Tecnología |
|---|---|
| Framework | Nuxt 3 (SPA mode) |
| Estado | Pinia |
| Persistencia | localStorage (sin backend) |
| Settlement | Algoritmo greedy client-side |
| Tipografía | Cormorant Garamond + DM Sans + DM Mono |

Todo corre en el browser — sin servidor, sin DB, sin cuenta.

## Levantar localmente

```bash
npm install
npm run dev       # http://localhost:3000
```

## Build

```bash
npm run build
```

Deploy estático a Vercel (Nuxt auto-detectado, `ssr: false`).

## Algoritmo de settlement

```
balance_neto = total_pagado − total_debido

Greedy:
  1. Separar acreedores (balance > 0) y deudores (balance < 0)
  2. Ordenar por valor absoluto descendente
  3. Emparejar mayor acreedor ↔ mayor deudor hasta saldar todo

Complejidad: O(n log n)
```

## Resultado y WhatsApp

La vista de resultado muestra las transferencias con el **alias CBU** del acreedor y genera un texto listo para pegar en WhatsApp con formato `*negrita*`.

![Resultado con alias](result_alias_copy.png)

## Diseño — "The Ledger"

Verde oscuro `#0F1C17` · crema `#EDE8D8` · dorado `#D4A84B`

Fonts: Cormorant Garamond (display), DM Sans (body), DM Mono (números).

---

Hecho con Nuxt 3 + Pinia. Sin backend, sin login, sin drama.
