import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes = [
  { path: '/', redirect: '/login' },
  {
    path: '/login',
    name: 'login',
    meta: { guestOnly: true },
    component: () => import('../components/auth/BorrowerLogin.vue'),
  },
  {
    path: '/forgot-password',
    name: 'forgot-password',
    meta: { guestOnly: true },
    component: () => import('../views/ForgotPasswordView.vue'),
  },
  {
    path: '/register',
    name: 'register',
    meta: { guestOnly: true },
    component: () => import('../views/RegisterView.vue'),
  },
  {
    path: '/dashboard',
    name: 'dashboard',
    meta: { requiresAuth: true, roles: ['Admin', 'Librarian'] },
    component: () => import('../views/DashboardView.vue'),
  },
  {
    path: '/borrowers',
    name: 'borrowers-admin',
    meta: { requiresAuth: true, roles: ['Admin', 'Librarian'] },
    component: () => import('../views/BorrowersView.vue'),
  },
  {
    path: '/books-admin',
    name: 'books-admin',
    meta: { requiresAuth: true, roles: ['Admin', 'Librarian'] },
    component: () => import('../views/BooksAdminView.vue'),
  },
  {
    path: '/borrowed',
    name: 'borrowed-admin',
    meta: { requiresAuth: true, roles: ['Admin', 'Librarian'] },
    component: () => import('../views/BorrowedView.vue'),
  },
  {
    path: '/reports',
    name: 'reports',
    meta: { requiresAuth: true, roles: ['Admin', 'Librarian'] },
    component: () => import('../views/ReportsView.vue'),
  },
  {
    path: '/reports/:id',
    name: 'report-detail',
    meta: { requiresAuth: true, roles: ['Admin', 'Librarian'] },
    component: () => import('../views/ReportDetailView.vue'),
    props: true,
  },
  {
    path: '/borrower',
    name: 'borrower-menu',
    meta: { requiresAuth: true, roles: ['Borrower'] },
    component: () => import('../views/BorrowerMenuView.vue'),
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

function roleHome(role) {
  if (!role) return { name: 'login' }
  return /borrower/i.test(role) ? { name: 'borrower-menu' } : { name: 'dashboard' }
}

router.beforeEach(async (to) => {
  const auth = useAuthStore()
  if (!auth.initialized) {
    await auth.init()
  }
  // Ensure user object (and role) is loaded before role checking when authenticated
  if (auth.isAuthenticated && !auth.user) {
    try {
      await auth.fetchMe()
    } catch {
      /* ignore */
    }
  }
  const currentRole = (auth.role || '').toLowerCase()
  // Redirect authenticated users away from guest-only pages
  if (to.meta.guestOnly && auth.isAuthenticated) {
    return roleHome(auth.role)
  }
  // Enforce role-based access
  if (to.meta.requiresAuth) {
    if (!auth.isAuthenticated) return { name: 'login' }
    if (to.meta.roles) {
      const rolesLower = to.meta.roles.map((r) => r.toLowerCase())
      if (!rolesLower.includes(currentRole)) {
        // If role not yet determined, allow navigation; else redirect appropriately
        if (currentRole) return roleHome(auth.role)
      }
    }
  }
})

export default router
