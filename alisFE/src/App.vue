<template>
  <ToastContainer />
  <div v-if="!auth.initialized" class="app-loading">
    <div class="spinner" />
    <p>Loading...</p>
  </div>
  <router-view v-else />
</template>

<script setup>
import ToastContainer from '@/components/ui/ToastContainer.vue'
import { useAuthStore } from '@/stores/auth'
import { onMounted } from 'vue'
const auth = useAuthStore()
onMounted(() => {
  auth.init()
})
</script>

<style scoped>
/* Global shell styles can be added here */
:deep(#app) {
  display: block;
  padding: 0;
  max-width: 100%;
}
.app-loading {
  position: fixed;
  inset: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background: #ffffff;
  z-index: 1000;
  font-family: system-ui, sans-serif;
  gap: 12px;
}
.spinner {
  width: 48px;
  height: 48px;
  border: 5px solid #e3e7ef;
  border-top-color: #2b64f3;
  border-radius: 50%;
  animation: spin 0.9s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
