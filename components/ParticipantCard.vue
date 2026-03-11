<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Participant, Expense, ExpenseSplit } from '~/types/index'

const props = defineProps<{
  participant: Participant
  expenses: Expense[]
  splits: ExpenseSplit[]
  allParticipants: Participant[]
}>()

const emit = defineEmits<{
  addExpense: [data: { amount: number; includedParticipantIds: string[]; description?: string }]
  removeExpense: [expenseId: string]
  removeParticipant: []
  updateAlias: [alias: string | null]
}>()

const expanded = ref(false)
const showExclude = ref(false)
const addingExpense = ref(false)

// Alias editing
const aliasValue = ref(props.participant.alias ?? '')
const aliasSaving = ref(false)

async function saveAlias() {
  const val = aliasValue.value.trim() || null
  if (val === props.participant.alias) return
  aliasSaving.value = true
  try {
    await emit('updateAlias', val)
  } finally {
    aliasSaving.value = false
  }
}

// Draft expense form
const draftAmount = ref<number | ''>('')
const draftDescription = ref('')
const draftExcluded = ref<Set<string>>(new Set())
const draftLoading = ref(false)
const draftError = ref('')

const includedIds = computed(() =>
  props.allParticipants.filter((p) => !draftExcluded.value.has(p.id)).map((p) => p.id)
)

const splitPreview = computed(() => {
  if (!draftAmount.value || includedIds.value.length === 0) return null
  return (Number(draftAmount.value) / includedIds.value.length).toFixed(2)
})

function toggleExclude(id: string) {
  const s = new Set(draftExcluded.value)
  s.has(id) ? s.delete(id) : s.add(id)
  draftExcluded.value = s
}

function includedNames(expenseId: string): string {
  const expSplits = props.splits.filter((s) => s.expenseId === expenseId)
  if (expSplits.length === props.allParticipants.length) return 'Todos'
  const excluded = props.allParticipants
    .filter((p) => !expSplits.some((s) => s.participantId === p.id))
    .map((p) => p.name)
  return `Excluye: ${excluded.join(', ')}`
}

function openAdd() {
  addingExpense.value = true
  expanded.value = true
  draftAmount.value = ''
  draftDescription.value = ''
  draftExcluded.value = new Set()
  draftError.value = ''
  showExclude.value = false
}

function cancelAdd() {
  addingExpense.value = false
  draftError.value = ''
}

async function submitAdd() {
  if (!draftAmount.value) { draftError.value = 'Ingresá un monto'; return }
  if (includedIds.value.length === 0) { draftError.value = 'Al menos un participante incluido'; return }
  draftLoading.value = true
  draftError.value = ''
  try {
    await emit('addExpense', {
      amount: Number(draftAmount.value),
      includedParticipantIds: includedIds.value,
      description: draftDescription.value.trim() || undefined,
    })
    addingExpense.value = false
    draftAmount.value = ''
    draftDescription.value = ''
    draftExcluded.value = new Set()
  } catch (e: any) {
    draftError.value = e.data?.statusMessage ?? 'Error al guardar'
  } finally {
    draftLoading.value = false
  }
}

const totalPaid = computed(() => props.expenses.reduce((s, e) => s + e.amount, 0))
</script>

<template>
  <div class="p-card" :class="{ 'is-expanded': expanded || addingExpense }">

    <!-- Card header -->
    <div class="p-header" @click="expanded = !expanded">
      <div class="p-header-left">
        <span class="p-chevron" :class="{ rotated: expanded || addingExpense }">›</span>
        <span class="p-name">{{ participant.name }}</span>
        <span v-if="participant.alias" class="p-alias muted mono">{{ participant.alias }}</span>
        <span v-if="expenses.length > 0" class="p-expense-count badge badge-gold">
          {{ expenses.length }} gasto{{ expenses.length !== 1 ? 's' : '' }} ·
          <span class="mono">${{ totalPaid.toFixed(2) }}</span>
        </span>
      </div>
      <div class="p-header-right" @click.stop>
        <button class="btn-icon add-btn" title="Agregar gasto" @click="openAdd">+</button>
        <button class="btn-icon del-btn" title="Quitar participante" @click="emit('removeParticipant')">✕</button>
      </div>
    </div>

    <!-- Expanded body -->
    <div v-if="expanded || addingExpense" class="p-body">

      <!-- Alias input -->
      <div class="alias-row">
        <label class="alias-label">alias de transferencia</label>
        <input
          v-model="aliasValue"
          type="text"
          class="alias-input"
          placeholder="ej: juan.garcia (opcional)"
          maxlength="100"
          @blur="saveAlias"
          @keyup.enter="($event.target as HTMLInputElement).blur()"
        />
      </div>

      <!-- Existing expenses -->
      <div v-if="expenses.length > 0" class="expense-rows">
        <div v-for="exp in expenses" :key="exp.id" class="expense-row">
          <div class="expense-row-left">
            <span class="exp-amount mono">${{ exp.amount.toFixed(2) }}</span>
            <span v-if="exp.description" class="exp-desc">{{ exp.description }}</span>
            <span class="exp-included muted">{{ includedNames(exp.id) }}</span>
          </div>
          <button class="btn-icon del-btn sm" @click="emit('removeExpense', exp.id)">✕</button>
        </div>
      </div>

      <!-- Inline add form -->
      <div v-if="addingExpense" class="add-form">
        <div class="add-form-row">
          <div class="add-field">
            <label>monto</label>
            <input
              v-model="draftAmount"
              type="number"
              placeholder="0.00"
              step="0.01"
              min="0.01"
              class="mono amount-input"
              autofocus
              @keyup.enter="submitAdd"
              @keyup.escape="cancelAdd"
            />
          </div>
          <div class="add-field add-field-desc">
            <label>descripción (opcional)</label>
            <input
              v-model="draftDescription"
              type="text"
              placeholder="ej: Carne y chorizos"
              maxlength="200"
              @keyup.enter="submitAdd"
              @keyup.escape="cancelAdd"
            />
          </div>
        </div>

        <!-- Exclude participants -->
        <div class="exclude-section">
          <button type="button" class="exclude-toggle muted" @click="showExclude = !showExclude">
            <span>{{ showExclude ? '▴' : '▾' }} Excluir participantes</span>
            <span v-if="draftExcluded.size > 0" class="exclude-count">
              ({{ draftExcluded.size }} excluido{{ draftExcluded.size !== 1 ? 's' : '' }})
            </span>
          </button>
          <div v-if="showExclude" class="chips-row">
            <button
              v-for="p in allParticipants"
              :key="p.id"
              type="button"
              class="chip"
              :class="{ excluded: draftExcluded.has(p.id), self: p.id === participant.id }"
              :disabled="p.id === participant.id"
              @click="toggleExclude(p.id)"
            >
              {{ p.name }}
              <span class="chip-mark">{{ draftExcluded.has(p.id) ? '✕' : '✓' }}</span>
            </button>
          </div>
        </div>

        <!-- Footer -->
        <div class="add-form-footer">
          <span v-if="splitPreview" class="split-preview mono">
            <span class="accent">${{ splitPreview }}</span>
            <span class="muted"> c/u × {{ includedIds.length }} pers.</span>
          </span>
          <span v-if="draftError" class="form-error">{{ draftError }}</span>
          <div class="add-actions">
            <button class="btn btn-ghost btn-sm" type="button" @click="cancelAdd">Cancelar</button>
            <button
              class="btn btn-primary btn-sm"
              type="button"
              :disabled="draftLoading || !draftAmount"
              @click="submitAdd"
            >
              {{ draftLoading ? '…' : '✓ Guardar' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Empty hint -->
      <div v-if="!addingExpense && expenses.length === 0" class="empty-hint muted">
        <button class="btn btn-ghost btn-sm" @click="openAdd">+ Agregar primer gasto</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.p-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  transition: border-color var(--transition);
}
.p-card.is-expanded { border-color: var(--border-light); }

.p-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 20px;
  cursor: pointer;
  user-select: none;
  transition: background var(--transition);
}
.p-header:hover { background: rgba(255,255,255,0.02); }

.p-header-left {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  min-width: 0;
}

.p-chevron {
  color: var(--text-secondary);
  font-size: 20px;
  transition: transform var(--transition), color var(--transition);
  line-height: 1;
  width: 18px;
  flex-shrink: 0;
}
.p-chevron.rotated { transform: rotate(90deg); color: var(--accent); }

.p-name {
  font-size: 16px;
  font-weight: 500;
  flex-shrink: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.p-alias {
  font-size: 12px;
  letter-spacing: 0.5px;
  border: 1px solid var(--border);
  border-radius: 4px;
  padding: 2px 8px;
  flex-shrink: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 130px;
}

.p-expense-count { font-size: 11px; padding: 3px 8px; }

.p-header-right {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.btn-icon {
  width: 28px; height: 28px;
  border-radius: 6px;
  border: 1px solid var(--border);
  background: transparent;
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  font-size: 13px;
  transition: all var(--transition);
}
.add-btn { color: var(--accent); border-color: var(--accent-dim); font-size: 18px; font-weight: 300; }
.add-btn:hover { background: var(--accent-glow); }
.del-btn { color: var(--text-muted); }
.del-btn:hover { color: var(--red); border-color: rgba(224,92,58,0.4); background: rgba(224,92,58,0.06); }
.del-btn.sm { width: 24px; height: 24px; font-size: 11px; }

/* Body */
.p-body {
  border-top: 1px solid var(--border);
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* Alias */
.alias-row {
  display: flex;
  align-items: center;
  gap: 12px;
}
.alias-label {
  font-size: 10px;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: var(--text-secondary);
  font-family: var(--font-mono);
  white-space: nowrap;
  flex-shrink: 0;
}
.alias-input {
  flex: 1;
  padding: 7px 12px;
  font-size: 13px;
  font-family: var(--font-mono);
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  color: var(--text-primary);
  outline: none;
  transition: border-color var(--transition), box-shadow var(--transition);
}
.alias-input:focus {
  border-color: var(--accent-dim);
  box-shadow: 0 0 0 3px var(--accent-glow);
}
.alias-input::placeholder { color: var(--text-muted); font-style: italic; }

/* Expenses */
.expense-rows { display: flex; flex-direction: column; gap: 8px; }

.expense-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 14px;
  background: var(--surface-2);
  border-radius: var(--radius);
  border: 1px solid var(--border);
}
.expense-row-left {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  min-width: 0;
}
.exp-amount { font-size: 15px; font-weight: 500; color: var(--accent); }
.exp-desc { font-size: 13px; }
.exp-included { font-size: 11px; }

/* Add form */
.add-form {
  background: var(--surface-2);
  border: 1px solid var(--border-light);
  border-radius: var(--radius);
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.add-form-row { display: flex; gap: 14px; align-items: flex-end; }
.add-field { display: flex; flex-direction: column; gap: 8px; }
.add-field label {
  font-size: 11px;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: var(--text-secondary);
  font-family: var(--font-mono);
}
.add-field input { padding: 9px 12px; font-size: 14px; }
.amount-input { width: 110px; font-size: 16px; }
.add-field-desc { flex: 1; }
.add-field-desc input { width: 100%; }

/* Exclude */
.exclude-section { display: flex; flex-direction: column; gap: 10px; }
.exclude-toggle {
  background: none; border: none; cursor: pointer;
  font-size: 12px; font-family: var(--font-mono); letter-spacing: 0.5px;
  display: flex; align-items: center; gap: 8px; padding: 0;
  transition: color var(--transition);
}
.exclude-toggle:hover { color: var(--text-primary); }
.exclude-count { color: var(--accent); }
.chips-row { display: flex; flex-wrap: wrap; gap: 6px; }
.chip {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 5px 10px; border-radius: 20px;
  border: 1px solid var(--border-light);
  background: var(--surface); color: var(--text-primary);
  font-size: 12px; cursor: pointer;
  transition: all var(--transition);
}
.chip:hover:not(:disabled) { border-color: var(--accent-dim); }
.chip.excluded { background: rgba(224,92,58,0.08); border-color: rgba(224,92,58,0.3); color: var(--text-muted); text-decoration: line-through; }
.chip.self { opacity: 0.5; cursor: not-allowed; border-style: dashed; }
.chip-mark { font-size: 9px; opacity: 0.7; }
.chip.excluded .chip-mark { color: var(--red); }
.chip:not(.excluded) .chip-mark { color: var(--green); }

/* Footer */
.add-form-footer { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.split-preview { font-size: 13px; }
.form-error { color: var(--red); font-size: 12px; font-family: var(--font-mono); flex: 1; }
.add-actions { display: flex; gap: 8px; margin-left: auto; }
.btn-sm { padding: 9px 18px; font-size: 12px; }

.empty-hint { text-align: center; padding: 8px 0; }

@media (max-width: 520px) {
  .p-header     { padding: 14px 14px; }
  .p-body       { padding: 14px; gap: 12px; }
  .p-header-left { flex-wrap: wrap; gap: 6px; }
  .p-expense-count { flex-shrink: 0; }

  /* Increase touch targets for icon buttons */
  .btn-icon { width: 36px; height: 36px; }

  /* Stack alias row */
  .alias-row   { flex-direction: column; align-items: flex-start; gap: 6px; }
  .alias-input { width: 100%; }

  .add-form     { padding: 12px; }
  .add-form-row { flex-direction: column; }
  .amount-input { width: 100%; }

  /* Footer stacks cancel/save below preview */
  .add-form-footer { flex-direction: column; align-items: stretch; gap: 10px; }
  .add-actions     { margin-left: 0; justify-content: flex-end; }
  .split-preview   { text-align: center; }
}
</style>
