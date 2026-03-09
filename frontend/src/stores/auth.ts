import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi } from '@/api/index.js'

const GUEST_SESSION_KEY = 'guest_token'
const GUEST_EXPIRY_KEY = 'guest_expiry'
const AUTH_TOKEN_KEY = 'auth_token'
const GUEST_SESSION_HOURS = 6

export const useAuthStore = defineStore('auth', () => {
  const user = ref<{ id: string; email: string } | null>(null)
  const guestToken = ref<string | null>(null)

  const isLoggedIn = computed(() => !!user.value)
  const isGuest = computed(() => !!guestToken.value && !user.value)

  function initGuestSession(): string {
    // Check for valid existing session
    const existing = localStorage.getItem(GUEST_SESSION_KEY)
    const expiry = localStorage.getItem(GUEST_EXPIRY_KEY)

    if (existing && expiry && Date.now() < parseInt(expiry)) {
      guestToken.value = existing
      return existing
    }

    // Create new guest session
    const token = `guest_${crypto.randomUUID()}`
    const expiresAt = Date.now() + GUEST_SESSION_HOURS * 60 * 60 * 1000
    localStorage.setItem(GUEST_SESSION_KEY, token)
    localStorage.setItem(GUEST_EXPIRY_KEY, String(expiresAt))
    guestToken.value = token
    return token
  }

  function clearGuestSession() {
    localStorage.removeItem(GUEST_SESSION_KEY)
    localStorage.removeItem(GUEST_EXPIRY_KEY)
    guestToken.value = null
  }

  async function login(token: string, userData: { id: string; email: string }) {
    localStorage.setItem(AUTH_TOKEN_KEY, token)
    user.value = userData
    clearGuestSession()
  }

  function logout() {
    localStorage.removeItem(AUTH_TOKEN_KEY)
    user.value = null
  }

  async function restore() {
    const token = localStorage.getItem(AUTH_TOKEN_KEY)
    if (token) {
      try {
        const { data } = await authApi.me()
        user.value = data
        return
      } catch {
        localStorage.removeItem(AUTH_TOKEN_KEY)
      }
    }

    // Restore guest session if still valid
    const guestTok = localStorage.getItem(GUEST_SESSION_KEY)
    const expiry = localStorage.getItem(GUEST_EXPIRY_KEY)
    if (guestTok && expiry && Date.now() < parseInt(expiry)) {
      guestToken.value = guestTok
    }
  }

  return {
    user,
    guestToken,
    isLoggedIn,
    isGuest,
    initGuestSession,
    clearGuestSession,
    login,
    logout,
    restore,
  }
})
