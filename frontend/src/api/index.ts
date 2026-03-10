import axios from 'axios'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api',
})

// Attach auth token on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token') ?? localStorage.getItem('guest_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authApi = {
  sendOtp: (email: string) => api.post('/auth/send-otp', { email }),
  verifyOtp: (email: string, code: string) =>
    api.post<{ token: string; user: { id: string; email: string } }>('/auth/verify-otp', {
      email,
      code,
    }),
  me: () => api.get<{ id: string; email: string }>('/auth/me'),
}

// ─── Categories ───────────────────────────────────────────────────────────────
export const categoriesApi = {
  list: () => api.get<Category[]>('/categories'),
}

// ─── Divisions ────────────────────────────────────────────────────────────────
export const divisionsApi = {
  create: (title: string) => api.post<Division>('/divisions', { title }),
  list: () => api.get<Division[]>('/divisions'),
  get: (id: string) => api.get<DivisionFull>(`/divisions/${id}`),
  update: (id: string, title: string) => api.patch<Division>(`/divisions/${id}`, { title }),
  delete: (id: string) => api.delete(`/divisions/${id}`),
  settlement: (id: string) =>
    api.get<{ balances: ParticipantBalance[]; transfers: Transfer[] }>(
      `/divisions/${id}/settlement`,
    ),

  addParticipant: (divisionId: string, name: string) =>
    api.post<Participant>(`/divisions/${divisionId}/participants`, { name }),
  updateParticipantAlias: (divisionId: string, participantId: string, alias: string | null) =>
    api.patch<Participant>(`/divisions/${divisionId}/participants/${participantId}`, { alias }),
  removeParticipant: (divisionId: string, participantId: string) =>
    api.delete(`/divisions/${divisionId}/participants/${participantId}`),

  addExpense: (divisionId: string, data: CreateExpenseDto) =>
    api.post<Expense>(`/divisions/${divisionId}/expenses`, data),
  removeExpense: (divisionId: string, expenseId: string) =>
    api.delete(`/divisions/${divisionId}/expenses/${expenseId}`),
}

// ─── Contacts ─────────────────────────────────────────────────────────────────
export const contactsApi = {
  list: () => api.get<Contact[]>('/contacts'),
  create: (name: string) => api.post<Contact>('/contacts', { name }),
  delete: (id: string) => api.delete(`/contacts/${id}`),
}

// ─── Types ────────────────────────────────────────────────────────────────────
export interface Category {
  id: string
  name: string
  icon: string
}

export interface Division {
  id: string
  title: string
  ownerUserId: string | null
  createdAt: string
  closedAt: string | null
}

export interface Participant {
  id: string
  divisionId: string
  name: string
  alias: string | null
  contactId: string | null
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

export interface Contact {
  id: string
  ownerUserId: string
  name: string
  createdAt: string
}

export interface CreateExpenseDto {
  description?: string
  amount: number
  categoryId?: string
  paidBy: string
  includedParticipantIds: string[]
}
