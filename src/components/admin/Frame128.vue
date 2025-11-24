<template>
  <div class="admin-topbar">
    <div class="right-stack">
      <div class="user-pill" v-if="auth.user">
        <span class="role-icon">{{ roleInitial }}</span>
        <span class="role">{{ auth.role }}</span>
      </div>
      <div class="date-block">
        <span class="date-part">{{ monthDay }}</span>
        <span class="sep">|</span>
        <span class="date-part">{{ weekday }}</span>
      </div>
    </div>
  </div>
</template>
<script setup>
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
const auth = useAuthStore()
const now = new Date()
const monthDay = computed(() =>
  now.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' }),
)
const weekday = computed(() => now.toLocaleDateString(undefined, { weekday: 'long' }))
const roleInitial = computed(() => (auth.role ? auth.role.charAt(0) : ''))
// Logo moved to sidebar; import removed
defineOptions({ name: 'AdminTopBar' })
</script>
<style scoped>
.admin-topbar {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 24px;
  font-family: Poppins, sans-serif;
}
.right-stack {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
}
.date-block {
  background: #e8edfb;
  padding: 12px 24px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  gap: 14px;
  font-size: 14px;
  font-weight: 500;
  color: #112b56;
}
.sep {
  opacity: 0.6;
}
.user-pill {
  background: #ffffff;
  border: 1px solid #d1d9e6;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border-radius: 12px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
}
.role-icon {
  background: #1967d2;
  color: #fff;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  font-weight: 600;
}
.role {
  font-size: 12px;
  font-weight: 500;
  color: #334155;
}
.date-block {
  background: #eef3ff;
  padding: 12px 24px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  gap: 14px;
  font-size: 14px;
  font-weight: 500;
  color: #0e3e81;
  box-shadow: 5px 2px 6px rgba(0, 0, 0, 0.04);
}
/* Logo */
@media (max-width: 900px) {
  .admin-topbar {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
}
</style>
