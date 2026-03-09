<script setup lang="ts">
import { ref } from 'vue'
import { useDivisionStore } from '@/stores/division.js'
import { useAuthStore } from '@/stores/auth.js'
import { contactsApi } from '@/api/index.js'
import type { Contact } from '@/api/index.js'

const store = useDivisionStore()
const auth = useAuthStore()

const name = ref('')
const loading = ref(false)
const error = ref('')
const contacts = ref<Contact[]>([])
const showSuggestions = ref(false)

// Load contacts for autocomplete (registered users only)
async function loadContacts() {
  if (!auth.isLoggedIn) return
  try {
    const { data } = await contactsApi.list()
    contacts.value = data
  } catch { /* ignore */ }
}

loadContacts()

const suggestions = () =>
  name.value.length >= 1
    ? contacts.value.filter((c) =>
        c.name.toLowerCase().includes(name.value.toLowerCase()),
      )
    : []

function selectSuggestion(c: Contact) {
  name.value = c.name
  showSuggestions.value = false
}

function hideSuggestions() {
  setTimeout(() => (showSuggestions.value = false), 150)
}

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
    <div class="field autocomplete-wrap">
      <label>nombre del participante</label>
      <div class="input-row">
        <div class="input-autocomplete">
          <input
            v-model="name"
            type="text"
            placeholder="ej: María, Juan…"
            maxlength="80"
            autocomplete="off"
            @focus="showSuggestions = true"
            @blur="hideSuggestions"
          />
          <!-- Suggestions dropdown -->
          <ul v-if="showSuggestions && suggestions().length > 0" class="suggestions">
            <li
              v-for="c in suggestions()"
              :key="c.id"
              class="suggestion-item"
              @mousedown.prevent="selectSuggestion(c)"
            >
              <span class="s-icon">◎</span>
              {{ c.name }}
            </li>
          </ul>
        </div>
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

.input-autocomplete {
  flex: 1;
  position: relative;
}

.input-autocomplete input { width: 100%; }

.suggestions {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  list-style: none;
  z-index: 10;
  overflow: hidden;
}

.suggestion-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  font-size: 14px;
  cursor: pointer;
  transition: background var(--transition);
}

.suggestion-item:hover { background: var(--border); }

.s-icon {
  color: var(--accent);
  font-size: 12px;
}

.form-error {
  color: var(--red);
  font-size: 12px;
  font-family: var(--font-mono);
}
</style>
