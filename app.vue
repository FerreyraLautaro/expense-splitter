<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'

const auth = useAuthStore()
if (import.meta.client) auth.restore()
</script>

<template>
  <NuxtPage />
</template>
