<template>
  <aside class="admin-sidebar" role="navigation" aria-label="Admin Navigation">
    <div class="brand">
      <img :src="librarianLogo" alt="ALIS Librarian Logo" class="brand-logo" />
      <span class="sr-only">ALIS</span>
    </div>
    <nav class="nav-block">
      <ul>
        <li v-for="item in items" :key="item.id" :class="{ active: active === item.id }">
          <button type="button" @click="setActive(item.id)">
            <span class="icon" v-html="item.icon" aria-hidden="true"></span>
            <span class="label">{{ item.label }}</span>
          </button>
        </li>
      </ul>
    </nav>
    <div class="flex-spacer" />
    <div class="footer">&copy; {{ year }} Library</div>
  </aside>
</template>
<script setup>
import { ref, computed } from 'vue'
import librarianLogo from '@/assets/ALIS Librarian Logo.png'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const active = ref('dashboard')
const auth = useAuthStore()
const items = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>`,
  },
  {
    id: 'books',
    label: 'Books',
    icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M4 4.5A2.5 2.5 0 0 1 6.5 7H20"/><path d="M6.5 2A2.5 2.5 0 0 0 4 4.5v15A2.5 2.5 0 0 0 6.5 22"/><path d="M6.5 2H20v20H6.5"/></svg>`,
  },
  {
    id: 'borrowed',
    label: 'Borrowed',
    icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 8h14"/><path d="M5 16h14"/><path d="M11 4h2v16h-2z"/></svg>`,
  },
  {
    id: 'borrowers',
    label: 'Borrowers',
    icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
  },
  {
    id: 'reports',
    label: 'Reports',
    icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3h18v4H3z"/><path d="M8 11h13v4H8z"/><path d="M3 19h18v2H3z"/></svg>`,
  },
  {
    id: 'signout',
    label: 'Sign out',
    icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 16l4-4m0 0l-4-4m4 4H7"/><path d="M9 20H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h4"/></svg>`,
  },
]
function setActive(id) {
  active.value = id
  switch (id) {
    case 'dashboard':
      router.push({ name: 'dashboard' })
      break
    case 'borrowers':
      router.push({ name: 'borrowers-admin' })
      break
    case 'books':
      router.push({ name: 'books-admin' })
      break
    case 'signout':
      auth.logout()
      router.push({ name: 'login' })
      break
    // books / borrowed / reports can be implemented later
    default:
      break
  }
}
const year = computed(() => new Date().getFullYear())
</script>
<style scoped>
.admin-sidebar {
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
  width: 260px;
  background: linear-gradient(200deg, #5b99f5 0%, #568fe9 55%, #1b6ed6 100%);
  color: #fff;
  display: flex;
  flex-direction: column;
  padding: 28px 22px 18px;
  box-sizing: border-box;
  font-family: Poppins, sans-serif;
}
.brand {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 34px; /*
  padding: 18px 12px;
  background: rgb(103, 125, 253);
  border: 1px solid rgba(58, 40, 223, 0.842);
  border-radius: 24px;
  box-shadow:
    0 6px 18px -4px rgba(0, 0, 0, 0.35),
    inset 0 0 12px rgba(255, 255, 255, 0.15);*/
}
.brand-logo {
  width: 150px;
  height: auto;
  display: block;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
}
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  border: 0;
}
.nav-block ul {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.nav-block li button {
  width: 100%;
  background: rgba(255, 255, 255, 0.08);
  border: none;
  color: #fff;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px 10px 14px;
  border-radius: 12px;
  font-size: 14px;
  cursor: pointer;
  text-align: left;
  font-weight: 500;
  transition: background 0.15s;
}
.nav-block li.active button {
  background: #ffffff;
  color: #0d3369;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
}
.nav-block li button:hover {
  background: rgba(255, 255, 255, 0.3);
}
.icon svg {
  display: block;
}
.flex-spacer {
  flex: 1;
}
.footer {
  font-size: 11px;
  opacity: 0.7;
}
@media (max-width: 900px) {
  .admin-sidebar {
    position: relative;
    width: 100%;
    flex-direction: row;
    height: auto;
    padding: 16px 20px;
  }
  .brand {
    margin: 0 24px 0 0;
  }
  .nav-block ul {
    flex-direction: row;
    flex-wrap: wrap;
  }
  .flex-spacer {
    display: none;
  }
}
</style>
