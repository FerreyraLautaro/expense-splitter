<script setup lang="ts">
import { computed } from 'vue'
import { useDivisionStore } from '@/stores/division.js'

const store = useDivisionStore()

const expenses = computed(() => store.division?.expenses ?? [])
const participants = computed(() => store.division?.participants ?? [])
const categories = computed(() => store.categories)

function participantName(id: string) {
  return participants.value.find((p) => p.id === id)?.name ?? '?'
}

function categoryLabel(id: string | null) {
  if (!id) return null
  const cat = categories.value.find((c) => c.id === id)
  return cat ? `${cat.icon} ${cat.name}` : null
}

function splitNames(expenseId: string) {
  const splits = store.division?.splits.filter((s) => s.expenseId === expenseId) ?? []
  return splits.map((s) => participantName(s.participantId)).join(', ')
}
</script>

<template>
  <div class="expense-list">
    <div v-if="expenses.length === 0" class="empty-state muted">
      Todavía no hay gastos. Agregá el primero arriba.
    </div>

    <ul v-else class="list">
      <li
        v-for="expense in expenses"
        :key="expense.id"
        class="expense-item card"
      >
        <div class="expense-main">
          <div class="expense-left">
            <div class="expense-top">
              <span v-if="categoryLabel(expense.categoryId)" class="cat-badge badge badge-gold">
                {{ categoryLabel(expense.categoryId) }}
              </span>
              <span class="expense-desc">
                {{ expense.description || 'Sin descripción' }}
              </span>
            </div>
            <div class="expense-meta muted">
              <span>Pagó <strong>{{ participantName(expense.paidBy) }}</strong></span>
              <span class="sep">·</span>
              <span>Incluye: {{ splitNames(expense.id) }}</span>
            </div>
          </div>
          <div class="expense-right">
            <span class="expense-amount mono accent">${{ expense.amount.toFixed(2) }}</span>
            <button
              class="btn btn-danger del-btn"
              @click="store.removeExpense(expense.id)"
              title="Eliminar gasto"
            >
              ✕
            </button>
          </div>
        </div>
      </li>
    </ul>

    <!-- Total -->
    <div v-if="expenses.length > 0" class="total-row">
      <span class="mono muted" style="font-size: 12px; letter-spacing: 2px;">TOTAL</span>
      <span class="mono accent" style="font-size: 18px; font-weight: 500;">
        ${{ expenses.reduce((s, e) => s + e.amount, 0).toFixed(2) }}
      </span>
    </div>
  </div>
</template>

<style scoped>
.expense-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.empty-state {
  font-size: 14px;
  padding: 32px 0;
  text-align: center;
}

.list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.expense-item {
  padding: 16px 20px;
}

.expense-main {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.expense-left {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.expense-top {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.cat-badge {
  font-size: 10px;
  padding: 3px 8px;
  white-space: nowrap;
}

.expense-desc {
  font-size: 15px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.expense-meta {
  font-size: 12px;
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.sep { opacity: 0.4; }

.expense-right {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.expense-amount { font-size: 16px; }

.del-btn {
  padding: 5px 10px;
  font-size: 11px;
}

.total-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-top: 1px solid var(--border);
  margin-top: 4px;
}
</style>
