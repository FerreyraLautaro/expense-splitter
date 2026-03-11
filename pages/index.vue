<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import type { DivisionFull } from '~/types/index'

const router = useRouter()

const title = ref('')
const loading = ref(false)

function start() {
  if (!title.value.trim()) return
  loading.value = true
  const id = crypto.randomUUID()
  const division: DivisionFull = {
    id,
    title: title.value.trim(),
    guestToken: null,
    createdAt: new Date().toISOString(),
    closedAt: null,
    participants: [],
    expenses: [],
    splits: [],
  }
  localStorage.setItem(`splitr_div_${id}`, JSON.stringify(division))
  router.push(`/division/${id}`)
}
</script>

<template>
  <div class="page">
    <div class="container">
      <!-- Header -->
      <header class="header fade-up">
        <div class="logo">
          <span class="logo-mark">✦</span>
          <span class="logo-text">splitr</span>
        </div>
        <nav class="nav"></nav>
      </header>

      <!-- Hero -->
      <section class="hero">
        <div class="hero-eyebrow fade-up fade-up-1">
          <!-- <span class="badge badge-gold">División de gastos</span> -->
        </div>
        <h1 class="hero-title fade-up fade-up-2">
          Divide lo que<br />
          <em>corresponde.</em>
        </h1>
        <p class="hero-sub fade-up fade-up-3 muted">
          Sin cuentas pendientes. Sin awkward moments.<br />
          Solo la math exacta.
        </p>

        <!-- Create division form -->
        <form class="create-form fade-up fade-up-" @submit.prevent="start">
          <div class="create-input-wrap">
            <input
              v-model="title"
              type="text"
              placeholder="Nombre de la división… ej: Cena del viernes"
              maxlength="100"
              required
            />
            <button class="btn btn-primary" type="submit" :disabled="loading || !title.trim()">
              {{ loading ? '…' : 'Crear →' }}
            </button>
          </div>
        </form>

      </section>

      <!-- How it works -->
      <section class="how-section fade-up">
        <hr class="divider" />
        <div class="steps">
          <div class="step">
            <span class="step-num mono accent">01</span>
            <span class="step-text">Creás la división y sumás participantes</span>
          </div>
          <div class="step">
            <span class="step-num mono accent">02</span>
            <span class="step-text">Cargás cada gasto con su categoría e incluidos</span>
          </div>
          <div class="step">
            <span class="step-num mono accent">03</span>
            <span class="step-text">El algoritmo calcula el mínimo de transferencias</span>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 32px 0 64px;
}

.logo {
  display: flex;
  align-items: center;
  gap: 10px;
}

.logo-mark {
  color: var(--accent);
  font-size: 20px;
}

.logo-text {
  font-family: var(--font-display);
  font-size: 22px;
  font-weight: 600;
  letter-spacing: 2px;
  color: var(--text-primary);
}

.nav {
  display: flex;
  align-items: center;
  gap: 16px;
}

.nav-email {
  font-size: 12px;
}

.btn-sm {
  padding: 8px 16px;
  font-size: 11px;
}

/* Hero */
.hero {
  padding-bottom: 64px;
}

.hero-eyebrow {
  margin-bottom: 20px;
}

.hero-title {
  font-size: clamp(2.8rem, 7vw, 4.5rem);
  line-height: 1.1;
  margin-bottom: 20px;
}

.hero-title em {
  font-style: italic;
  color: var(--accent);
}

.hero-sub {
  font-size: 17px;
  line-height: 1.7;
  margin-bottom: 48px;
}

/* Create form */
.create-form {
  max-width: 560px;
}

.create-input-wrap {
  display: flex;
  gap: 12px;
}

.create-input-wrap input {
  flex: 1;
  font-size: 16px;
}

.form-error {
  color: var(--red);
  font-size: 13px;
  margin-top: 8px;
  font-family: var(--font-mono);
}

.guest-notice {
  margin-top: 20px;
  font-size: 13px;
  max-width: 480px;
  line-height: 1.7;
}

/* How it works */
.how-section {
  padding-top: 16px;
}

.steps {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.step {
  display: flex;
  align-items: flex-start;
  gap: 24px;
}

.step-num {
  font-size: 12px;
  letter-spacing: 2px;
  min-width: 28px;
  padding-top: 3px;
}

.step-text {
  color: var(--text-secondary);
  font-size: 16px;
  line-height: 1.5;
}

@media (max-width: 520px) {
  .header { padding: 20px 0 36px; }
  .hero   { padding-bottom: 40px; }
  .hero-sub { font-size: 15px; }
  .create-input-wrap { flex-direction: column; }
  .create-input-wrap .btn { width: 100%; }
  .step { gap: 16px; }
}
</style>
