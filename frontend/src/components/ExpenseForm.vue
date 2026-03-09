<script setup lang="ts">
import { ref, computed } from 'vue'
import { useDivisionStore } from '@/stores/division.js'

const store = useDivisionStore()

const description = ref('')
const amount = ref<number | ''>('')
const categoryId = ref('')
const paidBy = ref('')
const excluded = ref<Set<string>>(new Set())
const loading = ref(false)
const error = ref('')

const participants = computed(() => store.division?.participants ?? [])
const categories = computed(() => store.categories)

const includedIds = computed(() =>
  participants.value.filter((p) => !excluded.value.has(p.id)).map((p) => p.id),
)

function toggleExclude(id: string) {
  if (excluded.value.has(id)) {
    excluded.value.delete(id)
  } else {
    excluded.value.add(id)
  }
}

const splitPreview = computed(() => {
  if (!amount.value || includedIds.value.length === 0) return null
  return (Number(amount.value) / includedIds.value.length).toFixed(2)
})

async function submit() {
  error.value = ''
  if (!amount.value || !paidBy.value) {
    error.value = 'Completá el monto y quién pagó'
    return
  }
  if (includedIds.value.length === 0) {
    error.value = 'Debe haber al menos un participante incluido'
    return
  }

  loading.value = true
  try {
    await store.addExpense({
      description: description.value || undefined,
      amount: Number(amount.value),
      categoryId: categoryId.value || undefined,
      paidBy: paidBy.value,
      includedParticipantIds: includedIds.value,
    })
    // Reset form
    description.value = ''
    amount.value = ''
    categoryId.value = ''
    paidBy.value = ''
    excluded.value = new Set()
  } catch (e: any) {
    error.value = e.response?.data?.error ?? 'Error al guardar'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="expense-form card">
    <h3 class="form-title">Nuevo gasto</h3>

    <form @submit.prevent="submit">
      <div class="form-grid">
        <!-- Amount -->
        <div class="field">
          <label>monto</label>
          <input
            v-model="amount"
            type="number"
            placeholder="0.00"
            step="0.01"
            min="0.01"
            class="mono"
            style="font-size: 18px;"
          />
        </div>

        <!-- Category -->
        <div class="field">
          <label>categoría</label>
          <select v-model="categoryId">
            <option value="">Sin categoría</option>
            <option v-for="c in categories" :key="c.id" :value="c.id">
              {{ c.icon }} {{ c.name }}
            </option>
          </select>
        </div>
      </div>

      <!-- Description -->
      <div class="field">
        <label>descripción (opcional)</label>
        <input
          v-model="description"
          type="text"
          placeholder="ej: Pizza en La Madeleine"
          maxlength="200"
        />
      </div>

      <!-- Paid by -->
      <div class="field">
        <label>pagó</label>
        <select v-model="paidBy" required>
          <option value="" disabled>Seleccioná quién pagó</option>
          <option v-for="p in participants" :key="p.id" :value="p.id">
            {{ p.name }}
          </option>
        </select>
      </div>

      <!-- Included / Excluded -->
      <div class="field">
        <label>excluir participantes</label>
        <p class="field-hint muted">Marcá quiénes NO participan en este gasto.</p>
        <div class="participant-chips">
          <button
            v-for="p in participants"
            :key="p.id"
            type="button"
            class="chip"
            :class="{ excluded: excluded.has(p.id) }"
            @click="toggleExclude(p.id)"
          >
            <span>{{ p.name }}</span>
            <span class="chip-icon">{{ excluded.has(p.id) ? '✕' : '✓' }}</span>
          </button>
        </div>
      </div>

      <!-- Split preview -->
      <div v-if="splitPreview" class="split-preview">
        <span class="mono muted" style="font-size: 12px; letter-spacing: 1px;">DIVISIÓN</span>
        <span class="mono accent" style="font-size: 15px;">
          ${{ splitPreview }} c/u
          <span class="muted" style="font-size: 11px;">× {{ includedIds.length }} personas</span>
        </span>
      </div>

      <p v-if="error" class="form-error">{{ error }}</p>

      <button class="btn btn-primary btn-full" type="submit" :disabled="loading">
        {{ loading ? 'Guardando…' : 'Agregar gasto →' }}
      </button>
    </form>
  </div>
</template>

<style scoped>
.expense-form { margin-bottom: 8px; }

.form-title {
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 3px;
  text-transform: uppercase;
  color: var(--text-secondary);
  margin-bottom: 20px;
}

form {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.field-hint {
  font-size: 12px;
  margin-bottom: 8px;
  margin-top: -4px;
}

/* Participant chips */
.participant-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  border-radius: 24px;
  border: 1px solid var(--border-light);
  background: var(--surface-2);
  color: var(--text-primary);
  font-size: 13px;
  cursor: pointer;
  transition: all var(--transition);
}

.chip:hover { border-color: var(--accent-dim); }

.chip.excluded {
  background: rgba(224, 92, 58, 0.08);
  border-color: rgba(224, 92, 58, 0.3);
  color: var(--text-muted);
  text-decoration: line-through;
}

.chip-icon {
  font-size: 10px;
  opacity: 0.7;
}

.chip.excluded .chip-icon { color: var(--red); }
.chip:not(.excluded) .chip-icon { color: var(--green); }

/* Split preview */
.split-preview {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: var(--accent-glow);
  border: 1px solid var(--accent-dim);
  border-radius: var(--radius);
}

.form-error {
  color: var(--red);
  font-size: 12px;
  font-family: var(--font-mono);
}

@media (max-width: 480px) {
  .form-grid { grid-template-columns: 1fr; }
}
</style>
