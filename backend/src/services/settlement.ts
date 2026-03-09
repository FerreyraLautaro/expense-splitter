/**
 * Debt minimization (settlement) algorithm.
 *
 * Given a map of participantId → net balance (positive = owed money, negative = owes money),
 * returns the minimum set of transfers to settle all debts.
 *
 * Uses a greedy approach: repeatedly match the largest creditor with the largest debtor.
 * This is optimal for the common case and runs in O(n log n).
 */

export interface Transfer {
  fromId: string
  fromName: string
  toId: string
  toName: string
  amount: number
}

export interface ParticipantBalance {
  id: string
  name: string
  totalPaid: number
  totalOwed: number
  net: number // positive = is owed; negative = owes
}

export function computeBalances(
  participants: { id: string; name: string }[],
  expenses: { amount: number; paidBy: string }[],
  splits: { expenseId: string; participantId: string; amountOwed: number }[],
): ParticipantBalance[] {
  const paid: Record<string, number> = {}
  const owed: Record<string, number> = {}

  for (const p of participants) {
    paid[p.id] = 0
    owed[p.id] = 0
  }

  for (const e of expenses) {
    paid[e.paidBy] = (paid[e.paidBy] ?? 0) + e.amount
  }

  for (const s of splits) {
    owed[s.participantId] = (owed[s.participantId] ?? 0) + s.amountOwed
  }

  return participants.map((p) => ({
    id: p.id,
    name: p.name,
    totalPaid: round(paid[p.id] ?? 0),
    totalOwed: round(owed[p.id] ?? 0),
    net: round((paid[p.id] ?? 0) - (owed[p.id] ?? 0)),
  }))
}

export function computeSettlement(balances: ParticipantBalance[]): Transfer[] {
  const creditors = balances
    .filter((b) => b.net > 0.01)
    .map((b) => ({ ...b, remaining: b.net }))
    .sort((a, b) => b.remaining - a.remaining)

  const debtors = balances
    .filter((b) => b.net < -0.01)
    .map((b) => ({ ...b, remaining: -b.net }))
    .sort((a, b) => b.remaining - a.remaining)

  const transfers: Transfer[] = []
  let i = 0
  let j = 0

  while (i < creditors.length && j < debtors.length) {
    const creditor = creditors[i]
    const debtor = debtors[j]
    const amount = round(Math.min(creditor.remaining, debtor.remaining))

    transfers.push({
      fromId: debtor.id,
      fromName: debtor.name,
      toId: creditor.id,
      toName: creditor.name,
      amount,
    })

    creditor.remaining = round(creditor.remaining - amount)
    debtor.remaining = round(debtor.remaining - amount)

    if (creditor.remaining < 0.01) i++
    if (debtor.remaining < 0.01) j++
  }

  return transfers
}

function round(n: number): number {
  return Math.round(n * 100) / 100
}
