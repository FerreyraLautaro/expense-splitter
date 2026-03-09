<script setup lang="ts">
import { onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth.js'
import { RouterView } from 'vue-router'

const auth = useAuthStore()
onMounted(() => auth.restore())
</script>

<template>
  <RouterView />
</template>
