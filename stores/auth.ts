import { defineStore } from 'pinia'
import { ref } from 'vue'

const GUEST_SESSION_KEY = 'guest_token'
const GUEST_EXPIRY_KEY = 'guest_expiry'
const GUEST_SESSION_HOURS = 6

export const useAuthStore = defineStore('auth', () => {
  const guestToken = ref<string | null>(null)

  function initGuestSession(): string {
    const existing = localStorage.getItem(GUEST_SESSION_KEY)
    const expiry = localStorage.getItem(GUEST_EXPIRY_KEY)

    if (existing && expiry && Date.now() < parseInt(expiry)) {
      guestToken.value = existing
      return existing
    }

    const token = `guest_${crypto.randomUUID()}`
    const expiresAt = Date.now() + GUEST_SESSION_HOURS * 60 * 60 * 1000
    localStorage.setItem(GUEST_SESSION_KEY, token)
    localStorage.setItem(GUEST_EXPIRY_KEY, String(expiresAt))
    guestToken.value = token
    return token
  }

  function restore() {
    const token = localStorage.getItem(GUEST_SESSION_KEY)
    const expiry = localStorage.getItem(GUEST_EXPIRY_KEY)
    if (token && expiry && Date.now() < parseInt(expiry)) {
      guestToken.value = token
    }
  }

  return { guestToken, initGuestSession, restore }
})
