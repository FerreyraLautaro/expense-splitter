import { defineStore } from 'pinia'
import { ref } from 'vue'
import { divisionsApi, categoriesApi } from '@/api/index.js'
import type { DivisionFull, Category, ParticipantBalance, Transfer } from '@/api/index.js'

export const useDivisionStore = defineStore('division', () => {
  const division = ref<DivisionFull | null>(null)
  const categories = ref<Category[]>([])
  const settlement = ref<{ balances: ParticipantBalance[]; transfers: Transfer[] } | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function load(id: string) {
    loading.value = true
    error.value = null
    try {
      const [divRes, catRes] = await Promise.all([
        divisionsApi.get(id),
        categoriesApi.list(),
      ])
      division.value = divRes.data
      categories.value = catRes.data
    } catch (e: any) {
      error.value = e.response?.data?.error ?? 'Error al cargar la división'
    } finally {
      loading.value = false
    }
  }

  async function loadSettlement(id: string) {
    const { data } = await divisionsApi.settlement(id)
    settlement.value = data
  }

  async function addParticipant(name: string) {
    if (!division.value) return
    const { data } = await divisionsApi.addParticipant(division.value.id, name)
    division.value.participants.push(data)
  }

  async function updateAlias(participantId: string, alias: string | null) {
    if (!division.value) return
    await divisionsApi.updateParticipantAlias(division.value.id, participantId, alias)
    const p = division.value.participants.find((p) => p.id === participantId)
    if (p) p.alias = alias
  }

  async function removeParticipant(participantId: string) {
    if (!division.value) return
    await divisionsApi.removeParticipant(division.value.id, participantId)
    division.value.participants = division.value.participants.filter((p) => p.id !== participantId)
    // Also remove expenses paid by this participant
    division.value.expenses = division.value.expenses.filter((e) => e.paidBy !== participantId)
  }

  async function addExpense(data: {
    description?: string
    amount: number
    categoryId?: string
    paidBy: string
    includedParticipantIds: string[]
  }) {
    if (!division.value) return
    const { data: expense } = await divisionsApi.addExpense(division.value.id, data)
    division.value.expenses.push(expense)
    if (expense.splits) {
      division.value.splits.push(...expense.splits)
    }
  }

  async function removeExpense(expenseId: string) {
    if (!division.value) return
    await divisionsApi.removeExpense(division.value.id, expenseId)
    division.value.expenses = division.value.expenses.filter((e) => e.id !== expenseId)
    division.value.splits = division.value.splits.filter((s) => s.expenseId !== expenseId)
  }

  function reset() {
    division.value = null
    settlement.value = null
    error.value = null
  }

  return {
    division,
    categories,
    settlement,
    loading,
    error,
    load,
    loadSettlement,
    addParticipant,
    updateAlias,
    removeParticipant,
    addExpense,
    removeExpense,
    reset,
  }
})
