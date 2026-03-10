<script setup lang="ts">
import { ref } from 'vue'
import { useDivisionStore } from '@/stores/division.js'

const store = useDivisionStore()

const name = ref('')
const loading = ref(false)
const error = ref('')

async function submit() {
  if (!name.value.trim()) return
  loading.value = true
  error.value = ''
  try {
    await store.addParticipant(name.value.trim())
    name.value = ''
  } catch (e: any) {
    error.value = e.response?.data?.error ?? 'Error al agregar'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <form class="participant-form" @submit.prevent="submit">
    <div class="field">
      <label>nombre del participante</label>
      <div class="input-row">
        <input
          v-model="name"
          type="text"
          placeholder="ej: María, Juan…"
          maxlength="80"
          autocomplete="off"
        />
        <button class="btn btn-primary" type="submit" :disabled="loading || !name.trim()">
          {{ loading ? '…' : '+ Agregar' }}
        </button>
      </div>
      <p v-if="error" class="form-error">{{ error }}</p>
    </div>
  </form>
</template>

<style scoped>
.participant-form { margin-bottom: 8px; }

.input-row {
  display: flex;
  gap: 10px;
}

.input-row input { flex: 1; }

.form-error {
  color: var(--red);
  font-size: 12px;
  font-family: var(--font-mono);
}
</style>
