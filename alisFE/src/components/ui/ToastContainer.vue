<template>
  <div class="toast-container" aria-live="polite" aria-atomic="true">
    <transition-group name="toast-fade" tag="div">
      <div v-for="n in notes" :key="n.id" class="toast" :class="'toast--' + n.type" role="status">
        <span class="toast__msg">{{ n.message }}</span>
        <button class="toast__close" @click="remove(n.id)" aria-label="Close">×</button>
      </div>
    </transition-group>
  </div>
</template>

<script setup>
import { storeToRefs } from 'pinia'
import { useNotificationsStore } from '@/stores/notifications'
const store = useNotificationsStore()
const { items: notes } = storeToRefs(store)
const remove = store.remove
</script>

<style scoped>
.toast-container {
  position: fixed;
  top: 16px;
  right: 16px;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-width: min(360px, 90vw);
}
.toast {
  background: #1f2937;
  color: #fff;
  padding: 10px 14px;
  border-radius: 6px;
  font-size: 14px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-left: 4px solid #4b5563;
  animation: fade-in 0.2s ease-out;
}
.toast-fade-enter-active {
  transition:
    opacity 0.25s ease,
    transform 0.25s ease;
}
.toast-fade-leave-active {
  transition:
    opacity 0.25s ease,
    transform 0.25s ease;
}
.toast-fade-enter-from,
.toast-fade-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
.toast-fade-enter-to,
.toast-fade-leave-from {
  opacity: 1;
  transform: translateY(0);
}
.toast--success {
  border-color: #059669;
}
.toast--error {
  border-color: #dc2626;
}
.toast--info {
  border-color: #2563eb;
}
.toast__msg {
  flex: 1;
  line-height: 1.3;
}
.toast__close {
  background: transparent;
  border: none;
  color: #fff;
  font-size: 18px;
  cursor: pointer;
  padding: 0 4px;
  line-height: 1;
}
.toast__close:hover {
  color: #e5e7eb;
}
@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(-6px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
