<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useDivisionStore } from '@/stores/division.js'
import { useAuthStore } from '@/stores/auth.js'
import { contactsApi } from '@/api/index.js'
import type { ParticipantBalance } from '@/api/index.js'

const route = useRoute()
const store = useDivisionStore()
const auth = useAuthStore()

const savedContacts = ref<Set<string>>(new Set())
const copied = ref(false)

onMounted(async () => {
  const id = route.params.id as string
  if (!store.division) await store.load(id)
  await store.loadSettlement(id)
})

async function saveContact(balance: ParticipantBalance) {
  try {
    await contactsApi.create(balance.name)
    savedContacts.value.add(balance.id)
  } catch { /* ignore */ }
}

// Helper: get alias for a participant id
function aliasOf(participantId: string): string | null {
  return store.division?.participants.find((p) => p.id === participantId)?.alias ?? null
}

// Generate WhatsApp-ready text
const whatsappText = computed(() => {
  if (!store.settlement || !store.division) return ''
  const div = store.division
  const { transfers } = store.settlement
  const total = div.expenses.reduce((s, e) => s + e.amount, 0)

  const fmt = (n: number) =>
    n.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  let text = `✦ *Splitr — ${div.title}*\n\n`
  text += `💸 *Transferencias:*\n`

  if (transfers.length === 0) {
    text += `_¡Todo está saldado! No hay deudas pendientes._\n`
  } else {
    for (const t of transfers) {
      const alias = aliasOf(t.toId)
      text += `• *${t.fromName}* le debe *$${fmt(t.amount)}* a *${t.toName}*`
      if (alias) text += ` → alias: \`${alias}\``
      text += `\n`
    }
  }

  text += `\n💰 Total gastado: *$${fmt(total)}*\n`
  text += `\n—\n`
  text += `_¡Espero que disfrutes la app! Si querés colaborar, mi alias es: *mi.alias* ✨_`

  return text
})

async function copyWhatsApp() {
  try {
    await navigator.clipboard.writeText(whatsappText.value)
    copied.value = true
    setTimeout(() => (copied.value = false), 2500)
  } catch {
    // fallback: select a hidden textarea
  }
}

const formatAmount = (n: number) => `$${Math.abs(n).toFixed(2)}`
</script>

<template>
  <div class="page result-page">
    <div class="container">
      <header class="result-header fade-up">
        <RouterLink :to="`/division/${route.params.id}`" class="back-link muted">
          ← volver
        </RouterLink>
        <RouterLink to="/" class="logo-link">
          <span class="accent">✦</span>
          <span class="logo-text">splitr</span>
        </RouterLink>
      </header>

      <div v-if="!store.settlement" class="state-msg muted mono">Calculando…</div>

      <template v-else>
        <div class="result-title-row fade-up fade-up-1">
          <h1>Resultado</h1>
          <span v-if="store.division" class="badge badge-gold">{{ store.division.title }}</span>
        </div>

        <!-- Transfers -->
        <section class="section fade-up fade-up-2">
          <div class="section-header">
            <h2 class="section-title">
              Transferencias mínimas
              <span class="mono muted">({{ store.settlement.transfers.length }})</span>
            </h2>
            <!-- Copy button -->
            <button
              v-if="store.settlement.transfers.length > 0 || store.division"
              class="btn-copy"
              :class="{ copied }"
              @click="copyWhatsApp"
            >
              <span v-if="copied">✓ Copiado</span>
              <span v-else>📋 Copiar para WhatsApp</span>
            </button>
          </div>

          <div v-if="store.settlement.transfers.length === 0" class="zero-state card">
            <span class="zero-icon">✓</span>
            <p>¡Todo está saldado! No hay transferencias necesarias.</p>
          </div>

          <ul v-else class="transfer-list">
            <li
              v-for="(t, i) in store.settlement.transfers"
              :key="i"
              class="transfer-card card fade-up"
              :style="{ animationDelay: `${i * 60}ms` }"
            >
              <div class="transfer-from">
                <span class="t-name">{{ t.fromName }}</span>
                <span class="mono muted t-label">paga</span>
              </div>
              <div class="transfer-arrow">
                <span class="t-amount mono accent">${{ t.amount.toFixed(2) }}</span>
                <span class="arrow">→</span>
              </div>
              <div class="transfer-to">
                <span class="mono muted t-label">recibe</span>
                <span class="t-name">{{ t.toName }}</span>
                <span v-if="aliasOf(t.toId)" class="t-alias mono">{{ aliasOf(t.toId) }}</span>
              </div>
            </li>
          </ul>
        </section>

        <!-- Balances -->
        <section class="section fade-up fade-up-3">
          <h2 class="section-title">Balance por persona</h2>
          <div class="balances-grid">
            <div v-for="b in store.settlement.balances" :key="b.id" class="balance-card card">
              <div class="balance-header">
                <span class="b-name">{{ b.name }}</span>
                <span
                  class="b-net mono"
                  :class="{
                    'amount-positive': b.net > 0,
                    'amount-negative': b.net < 0,
                    'amount-neutral': b.net === 0,
                  }"
                >
                  {{ b.net > 0 ? '+' : '' }}{{ formatAmount(b.net) }}
                </span>
              </div>
              <div class="balance-detail">
                <div class="b-row">
                  <span class="mono muted" style="font-size: 11px;">PAGÓ</span>
                  <span class="mono" style="font-size: 12px;">{{ formatAmount(b.totalPaid) }}</span>
                </div>
                <div class="b-row">
                  <span class="mono muted" style="font-size: 11px;">DEBE</span>
                  <span class="mono" style="font-size: 12px;">{{ formatAmount(b.totalOwed) }}</span>
                </div>
              </div>

              <template v-if="auth.isLoggedIn">
                <button v-if="!savedContacts.has(b.id)" class="btn btn-ghost save-contact-btn" @click="saveContact(b)">
                  + Guardar contacto
                </button>
                <span v-else class="saved-label mono">✓ Guardado</span>
              </template>
              <template v-else>
                <RouterLink to="/auth" class="save-prompt muted">Iniciá sesión para guardar contacto</RouterLink>
              </template>
            </div>
          </div>
        </section>

        <!-- Actions -->
        <div class="result-actions fade-up">
          <RouterLink :to="`/division/${route.params.id}`" class="btn btn-ghost">← Editar</RouterLink>
          <RouterLink to="/" class="btn btn-primary">Nueva división →</RouterLink>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.result-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 32px 0 48px;
}
.back-link {
  font-size: 13px; font-family: var(--font-mono); text-decoration: none;
  transition: color var(--transition);
}
.back-link:hover { color: var(--text-primary); }
.logo-link { display: flex; align-items: center; gap: 8px; text-decoration: none; }
.logo-text { font-family: var(--font-display); font-size: 18px; font-weight: 600; color: var(--text-primary); }

.state-msg { padding: 48px 0; font-size: 14px; }

.result-title-row {
  display: flex; align-items: center; gap: 16px; flex-wrap: wrap; margin-bottom: 40px;
}

.section { margin-bottom: 48px; }

.section-header {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 16px; gap: 16px; flex-wrap: wrap;
}

.section-title {
  font-family: var(--font-mono); font-size: 11px; letter-spacing: 3px;
  text-transform: uppercase; color: var(--text-secondary);
  display: flex; align-items: center; gap: 8px; margin: 0;
}

/* Copy button */
.btn-copy {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 8px 16px; border-radius: var(--radius);
  border: 1px solid var(--border-light);
  background: transparent; color: var(--text-secondary);
  font-family: var(--font-mono); font-size: 11px; letter-spacing: 0.5px;
  cursor: pointer; transition: all var(--transition);
}
.btn-copy:hover { border-color: var(--accent-dim); color: var(--accent); background: var(--accent-glow); }
.btn-copy.copied { border-color: var(--green); color: var(--green); background: rgba(74,184,122,0.08); }

/* Zero state */
.zero-state { display: flex; align-items: center; gap: 16px; padding: 24px; }
.zero-icon { font-size: 24px; color: var(--green); }
.zero-state p { color: var(--text-secondary); font-size: 15px; }

/* Transfers */
.transfer-list { list-style: none; display: flex; flex-direction: column; gap: 10px; }

.transfer-card {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 16px; padding: 20px 24px;
}
.transfer-from { display: flex; flex-direction: column; gap: 2px; }
.transfer-arrow { display: flex; flex-direction: column; align-items: center; gap: 4px; }
.t-amount { font-size: 16px; font-weight: 500; }
.arrow { color: var(--text-muted); font-size: 18px; }
.transfer-to { display: flex; flex-direction: column; gap: 2px; text-align: right; }
.t-name { font-size: 16px; }
.t-label { font-size: 10px; letter-spacing: 1px; }
.t-alias {
  font-size: 11px; color: var(--accent);
  letter-spacing: 0.5px; margin-top: 2px;
}

/* Balances */
.balances-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 12px; }
.balance-card { display: flex; flex-direction: column; gap: 12px; padding: 20px; }
.balance-header { display: flex; justify-content: space-between; align-items: flex-start; }
.b-name { font-size: 15px; }
.b-net { font-size: 16px; font-weight: 500; }
.balance-detail { display: flex; flex-direction: column; gap: 6px; padding-top: 8px; border-top: 1px solid var(--border); }
.b-row { display: flex; justify-content: space-between; }
.save-contact-btn { padding: 6px 12px; font-size: 11px; margin-top: 4px; }
.saved-label { font-size: 11px; color: var(--green); letter-spacing: 1px; }
.save-prompt { font-size: 11px; text-decoration: none; font-family: var(--font-mono); transition: color var(--transition); }
.save-prompt:hover { color: var(--accent); }

/* Actions */
.result-actions {
  display: flex; gap: 12px; justify-content: flex-end;
  padding-top: 16px; border-top: 1px solid var(--border);
}

@media (max-width: 480px) {
  .transfer-card { grid-template-columns: 1fr; text-align: center; }
  .transfer-to { text-align: center; }
  .result-actions { flex-direction: column; }
  .result-actions .btn { width: 100%; }
}
</style>
