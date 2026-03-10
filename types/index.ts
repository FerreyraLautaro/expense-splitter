export interface Division {
  id: string
  title: string
  guestToken: string | null
  createdAt: string
  closedAt: string | null
}

export interface Participant {
  id: string
  divisionId: string
  name: string
  alias: string | null
}

export interface ExpenseSplit {
  id: string
  expenseId: string
  participantId: string
  amountOwed: number
}

export interface Expense {
  id: string
  divisionId: string
  categoryId: string | null
  description: string | null
  amount: number
  paidBy: string
  createdAt: string
  splits: ExpenseSplit[]
}

export interface DivisionFull extends Division {
  participants: Participant[]
  expenses: Expense[]
  splits: ExpenseSplit[]
}

export interface ParticipantBalance {
  id: string
  name: string
  totalPaid: number
  totalOwed: number
  net: number
}

export interface Transfer {
  fromId: string
  fromName: string
  toId: string
  toName: string
  amount: number
}

export interface Category {
  id: string
  name: string
  icon: string
}

export interface CreateExpenseDto {
  description?: string
  amount: number
  categoryId?: string
  paidBy: string
  includedParticipantIds: string[]
}
