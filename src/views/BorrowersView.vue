<template>
  <div class="borrowers-view">
    <div class="top-bar">
      <button
        class="close-page"
        type="button"
        @click="goDashboard"
        aria-label="Close Borrowers Page"
      >
        ×
      </button>
      <h1>Borrowers</h1>
    </div>
    <p class="hint">Placeholder list. Integrate real borrower fetch later.</p>
    <ul class="list" v-if="borrowers.length">
      <li v-for="b in borrowers" :key="b.id">
        <strong>{{ b.name }}</strong>
        <span class="email">{{ b.email }}</span>
      </li>
    </ul>
    <p v-else class="empty">No borrowers loaded.</p>
  </div>
</template>
<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
const router = useRouter()
function goDashboard() {
  router.push({ name: 'dashboard' })
}
// Placeholder static data; replace with API call later
const borrowers = ref([
  { id: 1, name: 'Jane Doe', email: 'jane@example.com' },
  { id: 2, name: 'John Smith', email: 'john@example.com' },
])
</script>
<style scoped>
.borrowers-view {
  padding: 40px 48px 64px 300px;
  .top-bar {
    display: flex;
    align-items: center;
    gap: 16px;
    color: #1e293b;
  }
  .close-page {
    background: #fff;
    color: #1e293b;
    border: 1px solid #cbd5e1;
    font-size: 20px;
    line-height: 1;
    width: 44px;
    height: 44px;
    border-radius: 12px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
  }
  .close-page:hover {
    background: #f1f5f9;
  }
  min-height: 1024px;
  font-family: Poppins, sans-serif;
  background: #fff;
  box-sizing: border-box;
}
.hint {
  font-size: 13px;
  color: #64748b;
  margin-top: 4px;
}
.list {
  list-style: none;
  margin: 24px 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.list li {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  padding: 14px 16px;
  border-radius: 12px;
  font-size: 14px;
  display: flex;
  flex-direction: column;
}
.email {
  font-size: 12px;
  color: #475569;
}
.empty {
  font-size: 14px;
  color: #64748b;
  margin-top: 28px;
}
@media (max-width: 900px) {
  .borrowers-view {
    padding: 24px 20px 60px 20px;
  }
}
</style>
