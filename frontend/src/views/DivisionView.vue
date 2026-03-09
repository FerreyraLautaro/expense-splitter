<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useDivisionStore } from '@/stores/division.js'
import ParticipantCard from '@/components/ParticipantCard.vue'

const route = useRoute()
const router = useRouter()
const store = useDivisionStore()

const newName = ref('')
const addingParticipant = ref(false)
const addError = ref('')

onMounted(() => {
  store.load(route.params.id as string)
})

async function addParticipant() {
  if (!newName.value.trim()) return
  addingParticipant.value = true
  addError.value = ''
  try {
    await store.addParticipant(newName.value.trim())
    newName.value = ''
  } catch (e: any) {
    addError.value = e.response?.data?.error ?? 'Error al agregar'
  } finally {
    addingParticipant.value = false
  }
}

function expensesFor(participantId: string) {
  return store.division?.expenses.filter((e) => e.paidBy === participantId) ?? []
}

function goToResult() {
  router.push(`/division/${route.params.id}/result`)
}
</script>

<template>
  <div class="page">
    <div class="container">

      <!-- Header -->
      <header class="div-header fade-up">
        <RouterLink to="/" class="back-link muted">← splitr</RouterLink>
        <button class="btn btn-primary settle-btn" @click="goToResult">
          Ver resultado →
        </button>
      </header>

      <!-- Loading / Error -->
      <div v-if="store.loading" class="state-msg muted mono">Cargando…</div>
      <div v-else-if="store.error" class="state-msg" style="color: var(--red)">{{ store.error }}</div>

      <template v-else-if="store.division">

        <!-- Title + summary -->
        <div class="div-title-row fade-up fade-up-1">
          <h1 class="div-title">{{ store.division.title }}</h1>
        </div>

        <div class="summary-bar card fade-up fade-up-2">
          <div class="summary-item">
            <span class="mono muted">total</span>
            <span class="mono accent">
              ${{ store.division.expenses.reduce((s, e) => s + e.amount, 0).toFixed(2) }}
            </span>
          </div>
          <div class="summary-sep"></div>
          <div class="summary-item">
            <span class="mono muted">gastos</span>
            <span class="mono">{{ store.division.expenses.length }}</span>
          </div>
          <div class="summary-sep"></div>
          <div class="summary-item">
            <span class="mono muted">personas</span>
            <span class="mono">{{ store.division.participants.length }}</span>
          </div>
        </div>

        <!-- Add participant form -->
        <div class="add-participant-form fade-up fade-up-3">
          <div class="field-inline">
            <div class="field">
              <label>agregar participante</label>
              <div class="input-row">
                <input
                  v-model="newName"
                  type="text"
                  placeholder="ej: Joaco, Lauti, Pela…"
                  maxlength="80"
                  autocomplete="off"
                  @keyup.enter="addParticipant"
                />
                <button
                  class="btn btn-primary"
                  :disabled="addingParticipant || !newName.trim()"
                  @click="addParticipant"
                >
                  {{ addingParticipant ? '…' : '+ Agregar' }}
                </button>
              </div>
              <p v-if="addError" class="form-error">{{ addError }}</p>
            </div>
          </div>
        </div>

        <!-- Participant cards -->
        <div class="participants-list fade-up fade-up-4">
          <div v-if="store.division.participants.length === 0" class="empty-state muted">
            Agregá participantes para comenzar.
          </div>

          <ParticipantCard
            v-for="p in store.division.participants"
            :key="p.id"
            :participant="p"
            :expenses="expensesFor(p.id)"
            :splits="store.division.splits"
            :all-participants="store.division.participants"
              @add-expense="(data) => store.addExpense({ ...data, paidBy: p.id })"
            @remove-expense="store.removeExpense"
            @remove-participant="store.removeParticipant(p.id)"
            @update-alias="(alias) => store.updateAlias(p.id, alias)"
          />
        </div>

        <!-- Bottom CTA -->
        <div
          v-if="store.division.expenses.length > 0"
          class="bottom-cta fade-up"
        >
          <button class="btn btn-primary btn-full" @click="goToResult">
            Ver resultado →
          </button>
        </div>

      </template>
    </div>
  </div>
</template>

<style scoped>
.div-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 32px 0 40px;
}

.back-link {
  font-size: 13px;
  font-family: var(--font-mono);
  text-decoration: none;
  transition: color var(--transition);
}
.back-link:hover { color: var(--text-primary); }

.settle-btn { padding: 10px 20px; }

.state-msg { padding: 48px 0; font-size: 14px; }

.div-title-row {
  margin-bottom: 20px;
}
.div-title { font-size: clamp(1.6rem, 4vw, 2.4rem); }

/* Summary bar */
.summary-bar {
  display: flex;
  align-items: center;
  padding: 14px 24px;
  margin-bottom: 28px;
}
.summary-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
  text-align: center;
}
.summary-item .mono { font-size: 13px; }
.summary-item .accent { font-size: 16px; font-weight: 500; }
.summary-sep { width: 1px; height: 32px; background: var(--border); }

/* Add participant */
.add-participant-form {
  margin-bottom: 24px;
}

.field label {
  display: block;
  font-size: 11px;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: var(--text-secondary);
  font-family: var(--font-mono);
  margin-bottom: 8px;
}

.input-row {
  display: flex;
  gap: 10px;
}

.input-row input { flex: 1; }

.form-error {
  color: var(--red);
  font-size: 12px;
  font-family: var(--font-mono);
  margin-top: 6px;
}

/* Cards list */
.participants-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.empty-state {
  font-size: 14px;
  padding: 32px 0;
  text-align: center;
}

/* Bottom CTA */
.bottom-cta {
  margin-top: 28px;
  padding-top: 24px;
  border-top: 1px solid var(--border);
}

@media (max-width: 480px) {
  .input-row { flex-direction: column; }
}
</style>
