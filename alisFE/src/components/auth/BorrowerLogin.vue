<template>
  <div class="container">
    <div class="left-side">
      <img :src="frame40Img" alt="Library Illustration" class="library-image" />
    </div>
    <div class="right-side">
      <form @submit.prevent="handleSubmit" class="login-form" novalidate>
        <div class="form-group">
          <label for="userType">User type</label>
          <select id="userType" v-model="userType">
            <option>Borrower</option>
            <option>Librarian</option>
            <option>Admin</option>
          </select>
        </div>
        <BaseError :value="auth.error" />
        <div class="form-group">
          <label for="email">Email</label>
          <input
            type="text"
            id="email"
            v-model="email"
            placeholder="Enter your email"
            autocomplete="username"
            required
          />
        </div>
        <div class="form-group">
          <label for="password">Password</label>
          <div class="password-wrapper">
            <input
              :type="showPassword ? 'text' : 'password'"
              id="password"
              v-model="password"
              placeholder="Enter your password"
              autocomplete="current-password"
              required
            />
            <button
              type="button"
              class="toggle-password"
              @click="togglePassword"
              :aria-label="showPassword ? 'Hide password' : 'Show password'"
            >
              <svg
                v-if="showPassword"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                width="18"
                height="18"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M13.875 18.825A10.05 10.05 0 0119.458 12 10.05 10.05 0 0113.875 5.175m-3.75 13.65A10.05 10.05 0 014.542 12 10.05 10.05 0 0110.125 5.175m3.75 13.65l3.75-3.75m-7.5 0l-3.75-3.75m7.5 0l-3.75-3.75"
                />
              </svg>
              <svg
                v-else
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                width="18"
                height="18"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.475 0 8.268 2.94 9.542 7-.025.074-.05.148-.076.222m-2.32 3.505a8.377 8.377 0 01-7.146 3.973A8.377 8.377 0 014.936 15.73M1 1l22 22"
                />
              </svg>
            </button>
          </div>
        </div>
        <div class="forgot-password">
          <router-link :to="{ name: 'forgot-password' }">Forgot Password?</router-link>
        </div>
        <button type="submit" class="sign-in-btn" :disabled="auth.loading">
          {{ auth.loading ? 'Signing In…' : 'Sign In' }}
        </button>
        <div class="sign-up-text">
          Don't have an account?
          <router-link :to="{ name: 'register' }">Sign up</router-link>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import frame40Img from '@/assets/login/Frame 40.svg'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useNotificationsStore } from '@/stores/notifications'
import BaseError from '@/components/ui/BaseError.vue'

const auth = useAuthStore()
const notify = useNotificationsStore()
const router = useRouter()

const userType = ref('Borrower')
const email = ref('')
const password = ref('')
const showPassword = ref(false)

function togglePassword() {
  showPassword.value = !showPassword.value
}

async function handleSubmit() {
  if (!email.value || !password.value) return
  auth.error = null
  try {
    await auth.login({ email: email.value.trim(), password: password.value })
    await auth.fetchMe()
    notify.push('Signed in successfully.', { type: 'success' })
    // Role-based redirect: borrowers go to borrower menu, others to dashboard
    const actualRole = auth.role
    const isBorrower = /borrower/i.test(actualRole || '')
    if (userType.value && actualRole && !new RegExp(userType.value, 'i').test(actualRole)) {
      notify.push(`Logged in as ${actualRole} (selection was ${userType.value}).`, {
        type: 'info',
        timeout: 4000,
      })
    }
    router.push({ name: isBorrower ? 'borrower-menu' : 'dashboard' })
  } catch (err) {
    auth.error = err.response?.data?.errors || err.response?.data || err.message
    notify.push('Login failed.', { type: 'error' })
  }
}

// Persist userType for UX only
onMounted(() => {
  const saved = localStorage.getItem('preferredUserType')
  if (saved) userType.value = saved
})
watch(userType, (val) => {
  localStorage.setItem('preferredUserType', val)
})
</script>

<style scoped>
.container {
  display: flex;
  height: 100vh;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background-color: #fff;
  box-sizing: border-box;
  padding: 40px;
}
.left-side {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
}
.library-image {
  max-width: 90%;
  height: auto;
  object-fit: contain;
}
.right-side {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
}
.login-form {
  width: 100%;
  max-width: 350px;
}
.form-group {
  margin-bottom: 20px;
  position: relative;
}
label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 5px;
  color: #333;
}
select,
input[type='text'],
input[type='password'] {
  width: 100%;
  padding: 10px 12px;
  font-size: 15px;
  border: 1.2px solid #bbb;
  border-radius: 8px;
  outline: none;
  box-sizing: border-box;
  transition: border-color 0.3s ease;
}
select:focus,
input[type='text']:focus,
input[type='password']:focus {
  border-color: #2b64f3;
  box-shadow: 0 0 5px rgba(43, 100, 243, 0.4);
}
.password-wrapper {
  display: flex;
  align-items: center;
}
.password-wrapper input {
  flex: 1;
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
}
.toggle-password {
  background: #f0f0f0;
  border: 1.2px solid #bbb;
  border-left: none;
  border-top-right-radius: 8px;
  border-bottom-right-radius: 8px;
  cursor: pointer;
  width: 40px;
  height: 38px;
  display: flex;
  justify-content: center;
  align-items: center;
  outline: none;
}
.toggle-password:hover {
  background: #e1e7ff;
  border-color: #2b64f3;
}
.forgot-password {
  text-align: right;
  margin-bottom: 25px;
}
.forgot-password a {
  font-size: 12px;
  text-decoration: none;
  color: #2b64f3;
}
.forgot-password a:hover {
  text-decoration: underline;
}
.sign-in-btn {
  width: 100%;
  padding: 12px 0;
  font-weight: 600;
  font-size: 16px;
  background-color: #2b64f3;
  border: none;
  color: #fff;
  border-radius: 25px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}
.sign-in-btn:hover {
  background-color: #1e4ac8;
}
.sign-up-text {
  margin-top: 15px;
  font-size: 13px;
  text-align: center;
  color: #555;
}
.sign-up-text a {
  color: #2b64f3;
  text-decoration: none;
  font-weight: 600;
}
.sign-up-text a:hover {
  text-decoration: underline;
}
@media (max-width: 900px) {
  .container {
    flex-direction: column;
    padding: 20px;
    height: auto;
  }
  .left-side {
    order: 2;
    margin-top: 16px;
  }
}
</style>
