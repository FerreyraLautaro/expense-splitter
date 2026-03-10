import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { DivisionFull, ParticipantBalance, Transfer, CreateExpenseDto } from '~/types/index'
import { computeBalances, computeSettlement } from '~/utils/settlement'

const STORAGE_PREFIX = 'splitr_div_'

export const useDivisionStore = defineStore('division', () => {
  const division = ref<DivisionFull | null>(null)
  const settlement = ref<{ balances: ParticipantBalance[]; transfers: Transfer[] } | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  function save() {
    if (division.value) {
      localStorage.setItem(STORAGE_PREFIX + division.value.id, JSON.stringify(division.value))
    }
  }

  function load(id: string) {
    loading.value = true
    error.value = null
    try {
      const raw = localStorage.getItem(STORAGE_PREFIX + id)
      if (!raw) {
        error.value = 'División no encontrada'
        return
      }
      division.value = JSON.parse(raw)
    } catch {
      error.value = 'Error al cargar la división'
    } finally {
      loading.value = false
    }
  }

  function loadSettlement() {
    if (!division.value) return
    const { participants, expenses, splits } = division.value
    const balances = computeBalances(participants, expenses, splits)
    const transfers = computeSettlement(balances)
    settlement.value = { balances, transfers }
  }

  function addParticipant(name: string) {
    if (!division.value) return
    division.value.participants.push({
      id: crypto.randomUUID(),
      divisionId: division.value.id,
      name,
      alias: null,
    })
    save()
  }

  function updateAlias(participantId: string, alias: string | null) {
    if (!division.value) return
    const p = division.value.participants.find((p) => p.id === participantId)
    if (p) p.alias = alias
    save()
  }

  function removeParticipant(participantId: string) {
    if (!division.value) return
    const removedExpenseIds = new Set(
      division.value.expenses.filter((e) => e.paidBy === participantId).map((e) => e.id),
    )
    division.value.participants = division.value.participants.filter((p) => p.id !== participantId)
    division.value.expenses = division.value.expenses.filter((e) => e.paidBy !== participantId)
    division.value.splits = division.value.splits.filter(
      (s) => !removedExpenseIds.has(s.expenseId) && s.participantId !== participantId,
    )
    save()
  }

  function addExpense(data: CreateExpenseDto) {
    if (!division.value) return
    const expenseId = crypto.randomUUID()
    const amountOwed = data.amount / data.includedParticipantIds.length

    division.value.expenses.push({
      id: expenseId,
      divisionId: division.value.id,
      categoryId: null,
      description: data.description ?? null,
      amount: data.amount,
      paidBy: data.paidBy,
      createdAt: new Date().toISOString(),
      splits: [],
    })

    for (const participantId of data.includedParticipantIds) {
      division.value.splits.push({
        id: crypto.randomUUID(),
        expenseId,
        participantId,
        amountOwed,
      })
    }

    save()
  }

  function removeExpense(expenseId: string) {
    if (!division.value) return
    division.value.expenses = division.value.expenses.filter((e) => e.id !== expenseId)
    division.value.splits = division.value.splits.filter((s) => s.expenseId !== expenseId)
    save()
  }

  function reset() {
    division.value = null
    settlement.value = null
    error.value = null
  }

  return { division, settlement, loading, error, load, loadSettlement, addParticipant, updateAlias, removeParticipant, addExpense, removeExpense, reset }
})
