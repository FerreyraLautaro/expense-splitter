<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.js'
import { authApi } from '@/api/index.js'

const router = useRouter()
const auth = useAuthStore()

const step = ref<'email' | 'otp'>('email')
const email = ref('')
const code = ref('')
const loading = ref(false)
const error = ref('')

async function sendOtp() {
  loading.value = true
  error.value = ''
  try {
    await authApi.sendOtp(email.value)
    step.value = 'otp'
  } catch (e: any) {
    error.value = e.response?.data?.error ?? 'No se pudo enviar el código'
  } finally {
    loading.value = false
  }
}

async function verifyOtp() {
  loading.value = true
  error.value = ''
  try {
    const { data } = await authApi.verifyOtp(email.value, code.value)
    await auth.login(data.token, data.user)
    router.push('/')
  } catch (e: any) {
    error.value = e.response?.data?.error ?? 'Código inválido'
    code.value = ''
  } finally {
    loading.value = false
  }
}

function handleCodeInput(e: Event) {
  const val = (e.target as HTMLInputElement).value.replace(/\D/g, '').slice(0, 6)
  code.value = val
  if (val.length === 6) verifyOtp()
}
</script>

<template>
  <div class="page auth-page">
    <div class="container">
      <RouterLink to="/" class="back-link muted">← volver</RouterLink>

      <div class="auth-card card fade-up">
        <!-- Logo -->
        <div class="auth-logo">
          <span class="logo-mark accent">✦</span>
          <span class="logo-text">splitr</span>
        </div>

        <!-- Step: Email -->
        <template v-if="step === 'email'">
          <h2 class="auth-title">Iniciar sesión</h2>
          <p class="auth-sub muted">
            Te enviamos un código de 6 dígitos a tu mail. Sin contraseña.
          </p>

          <form @submit.prevent="sendOtp">
            <div class="field">
              <label>correo electrónico</label>
              <input
                v-model="email"
                type="email"
                placeholder="tu@mail.com"
                required
                autofocus
              />
            </div>

            <p v-if="error" class="form-error">{{ error }}</p>

            <button class="btn btn-primary btn-full" type="submit" :disabled="loading">
              {{ loading ? 'Enviando…' : 'Enviar código →' }}
            </button>
          </form>

          <hr class="divider" />
          <p class="guest-link muted">
            ¿Solo por ahora?
            <RouterLink to="/" class="accent">Continuá como invitado</RouterLink>
          </p>
        </template>

        <!-- Step: OTP -->
        <template v-else>
          <h2 class="auth-title">Revisá tu mail</h2>
          <p class="auth-sub muted">
            Enviamos un código a <strong class="accent">{{ email }}</strong>.<br />
            Ingresalo acá:
          </p>

          <form @submit.prevent="verifyOtp">
            <div class="field">
              <label>código de verificación</label>
              <input
                :value="code"
                type="text"
                inputmode="numeric"
                autocomplete="one-time-code"
                placeholder="000000"
                class="otp-input"
                maxlength="6"
                @input="handleCodeInput"
                autofocus
              />
            </div>

            <p v-if="error" class="form-error">{{ error }}</p>

            <button class="btn btn-primary btn-full" type="submit" :disabled="loading || code.length < 6">
              {{ loading ? 'Verificando…' : 'Verificar →' }}
            </button>
          </form>

          <button class="btn btn-ghost btn-full resend-btn" :disabled="loading" @click="step = 'email'">
            Cambiar email o reenviar
          </button>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
.auth-page {
  display: flex;
  align-items: flex-start;
  padding-top: 48px;
}

.back-link {
  display: inline-block;
  margin-bottom: 32px;
  font-size: 13px;
  font-family: var(--font-mono);
  text-decoration: none;
  transition: color var(--transition);
}
.back-link:hover { color: var(--text-primary); }

.auth-card {
  max-width: 420px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.auth-logo {
  display: flex;
  align-items: center;
  gap: 10px;
}

.logo-mark { font-size: 18px; }

.logo-text {
  font-family: var(--font-display);
  font-size: 20px;
  font-weight: 600;
  letter-spacing: 2px;
}

.auth-title {
  font-size: 1.8rem;
  margin-bottom: -8px;
}

.auth-sub {
  font-size: 14px;
  line-height: 1.7;
}

form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-error {
  color: var(--red);
  font-size: 12px;
  font-family: var(--font-mono);
  margin-top: -8px;
}

.guest-link {
  font-size: 13px;
  text-align: center;
}

.resend-btn {
  margin-top: -8px;
}
</style>
