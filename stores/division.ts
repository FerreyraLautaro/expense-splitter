import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useAuthStore } from './auth'
import type { DivisionFull, Category, ParticipantBalance, Transfer, CreateExpenseDto } from '~/types/index'

export const useDivisionStore = defineStore('division', () => {
  const division = ref<DivisionFull | null>(null)
  const categories = ref<Category[]>([])
  const settlement = ref<{ balances: ParticipantBalance[]; transfers: Transfer[] } | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  function authHeaders(): Record<string, string> {
    const auth = useAuthStore()
    return auth.guestToken ? { Authorization: `Bearer ${auth.guestToken}` } : {}
  }

  async function load(id: string) {
    loading.value = true
    error.value = null
    try {
      const [div, cats] = await Promise.all([
        $fetch<DivisionFull>(`/api/divisions/${id}`, { headers: authHeaders() }),
        $fetch<Category[]>('/api/categories'),
      ])
      division.value = div
      categories.value = cats
    } catch (e: any) {
      error.value = e.data?.statusMessage ?? e.data?.error ?? 'Error al cargar la división'
    } finally {
      loading.value = false
    }
  }

  async function loadSettlement(id: string) {
    const data = await $fetch<{ balances: ParticipantBalance[]; transfers: Transfer[] }>(
      `/api/divisions/${id}/settlement`,
      { headers: authHeaders() }
    )
    settlement.value = data
  }

  async function addParticipant(name: string) {
    if (!division.value) return
    const participant = await $fetch<{ id: string; divisionId: string; name: string; alias: string | null }>(
      `/api/divisions/${division.value.id}/participants`,
      { method: 'POST', body: { name }, headers: authHeaders() }
    )
    division.value.participants.push(participant)
  }

  async function updateAlias(participantId: string, alias: string | null) {
    if (!division.value) return
    await $fetch(
      `/api/divisions/${division.value.id}/participants/${participantId}`,
      { method: 'PATCH', body: { alias }, headers: authHeaders() }
    )
    const p = division.value.participants.find((p) => p.id === participantId)
    if (p) p.alias = alias
  }

  async function removeParticipant(participantId: string) {
    if (!division.value) return
    await $fetch(
      `/api/divisions/${division.value.id}/participants/${participantId}`,
      { method: 'DELETE', headers: authHeaders() }
    )
    division.value.participants = division.value.participants.filter((p) => p.id !== participantId)
    division.value.expenses = division.value.expenses.filter((e) => e.paidBy !== participantId)
  }

  async function addExpense(data: CreateExpenseDto) {
    if (!division.value) return
    const expense = await $fetch<{ id: string; divisionId: string; categoryId: string | null; description: string | null; amount: number; paidBy: string; createdAt: string; splits: any[] }>(
      `/api/divisions/${division.value.id}/expenses`,
      { method: 'POST', body: data, headers: authHeaders() }
    )
    division.value.expenses.push(expense)
    if (expense.splits) {
      division.value.splits.push(...expense.splits)
    }
  }

  async function removeExpense(expenseId: string) {
    if (!division.value) return
    await $fetch(
      `/api/divisions/${division.value.id}/expenses/${expenseId}`,
      { method: 'DELETE', headers: authHeaders() }
    )
    division.value.expenses = division.value.expenses.filter((e) => e.id !== expenseId)
    division.value.splits = division.value.splits.filter((s) => s.expenseId !== expenseId)
  }

  function reset() {
    division.value = null
    settlement.value = null
    error.value = null
  }

  return { division, categories, settlement, loading, error, load, loadSettlement, addParticipant, updateAlias, removeParticipant, addExpense, removeExpense, reset }
})
