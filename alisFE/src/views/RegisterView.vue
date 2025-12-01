<template>
  <div class="container">
    <div class="left-side">
      <img :src="frame40Img" alt="Borrower Reading Library" class="library-image" />
    </div>
    <div class="right-side">
      <form @submit.prevent="handleSubmit" class="signup-form" novalidate>
        <h2 class="form-title">Create an Account</h2>
        <BaseError :value="auth.error" />
        <div class="form-group">
          <input
            type="text"
            v-model="firstName"
            placeholder="First Name"
            required
            autocomplete="given-name"
          />
        </div>
        <div class="form-group">
          <input
            type="text"
            v-model="lastName"
            placeholder="Last Name"
            required
            autocomplete="family-name"
          />
        </div>
        <div class="form-group">
          <input type="email" v-model="email" placeholder="Email" required autocomplete="email" />
        </div>
        <div class="form-group">
          <input type="text" v-model="sidfid" placeholder="SID/FID" required />
        </div>
        <div class="form-group password-group">
          <input
            :type="showPassword ? 'text' : 'password'"
            v-model="password"
            placeholder="Password"
            required
            autocomplete="new-password"
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
        <div class="form-group password-group">
          <input
            :type="showConfirmPassword ? 'text' : 'password'"
            v-model="confirmPassword"
            placeholder="Confirm password"
            required
            autocomplete="new-password"
          />
          <button
            type="button"
            class="toggle-password"
            @click="toggleConfirmPassword"
            :aria-label="showConfirmPassword ? 'Hide password' : 'Show password'"
          >
            <svg
              v-if="showConfirmPassword"
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
        <button type="submit" class="create-account-btn" :disabled="auth.loading">
          {{ auth.loading ? 'Creating…' : 'Create Account' }}
        </button>
        <p class="signin-text">
          Already have an account? <router-link :to="{ name: 'login' }">Sign in</router-link>
        </p>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'
import frame40Img from '@/assets/login/Frame 40.svg'

const auth = useAuthStore()
const router = useRouter()
import { useNotificationsStore } from '@/stores/notifications'
const notify = useNotificationsStore()

const firstName = ref('')
const lastName = ref('')
const email = ref('')
const sidfid = ref('')
const password = ref('')
const confirmPassword = ref('')
const showPassword = ref(false)
const showConfirmPassword = ref(false)

function togglePassword() {
  showPassword.value = !showPassword.value
}
function toggleConfirmPassword() {
  showConfirmPassword.value = !showConfirmPassword.value
}

function validate() {
  if (
    !firstName.value ||
    !lastName.value ||
    !email.value ||
    !sidfid.value ||
    !password.value ||
    !confirmPassword.value
  ) {
    notify.push('Please fill in all required fields.', { type: 'error' })
    return false
  }
  if (password.value !== confirmPassword.value) {
    notify.push('Passwords do not match.', { type: 'error' })
    return false
  }
  return true
}

function mapIdentifier() {
  // Heuristic: numeric -> student_number else faculty_number
  const raw = sidfid.value.trim()
  if (!raw) return {}
  if (/^\d+$/.test(raw)) return { student_number: raw }
  return { faculty_number: raw }
}

async function handleSubmit() {
  if (!validate()) return
  auth.error = null
  try {
    const idObj = mapIdentifier()
    await auth.registerBorrower({
      first_name: firstName.value.trim(),
      last_name: lastName.value.trim(),
      email: email.value.trim(),
      password: password.value,
      confirm_password: confirmPassword.value,
      ...idObj,
    })
    await auth.fetchMe()
    notify.push('Account created successfully.', { type: 'success' })
    const role = auth.role
    const isBorrower = /borrower/i.test(role || '')
    router.push({ name: isBorrower ? 'borrower-menu' : 'dashboard' })
  } catch (err) {
    notify.push('Registration failed.', { type: 'error' })
    auth.error = err.response?.data?.errors || err.response?.data || err.message
  }
}
</script>

<style scoped>
.container {
  display: flex;
  height: 100vh;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background-color: #fff;
  padding: 40px;
  box-sizing: border-box;
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
.signup-form {
  width: 100%;
  max-width: 350px;
}
.form-title {
  margin-bottom: 30px;
  font-weight: 600;
  font-size: 20px;
  color: #000;
}
.form-group {
  margin-bottom: 20px;
  position: relative;
}
input[type='text'],
input[type='email'],
input[type='password'] {
  width: 100%;
  padding: 10px 12px;
  font-size: 15px;
  border: 1.2px solid #bbb;
  border-radius: 6px;
  outline: none;
  box-sizing: border-box;
  transition: border-color 0.3s ease;
}
input[type='text']:focus,
input[type='email']:focus,
input[type='password']:focus {
  border-color: #1967d2;
  box-shadow: 0 0 5px rgba(25, 103, 210, 0.4);
}
.password-group {
  display: flex;
  align-items: center;
}
.password-group input {
  flex: 1;
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
}
.toggle-password {
  background: #f0f0f0;
  border: 1.2px solid #bbb;
  border-left: none;
  border-top-right-radius: 6px;
  border-bottom-right-radius: 6px;
  cursor: pointer;
  width: 40px;
  height: 38px;
  display: flex;
  justify-content: center;
  align-items: center;
  outline: none;
}
.toggle-password:hover {
  background: #dbe7ff;
  border-color: #1967d2;
}
.create-account-btn {
  width: 100%;
  padding: 12px 0;
  background: #1967d2;
  color: #fff;
  border: none;
  border-radius: 25px;
  font-weight: 600;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}
.create-account-btn:hover {
  background: #0f4caa;
}
.signin-text {
  margin-top: 15px;
  font-size: 13px;
  text-align: center;
  color: #444;
}
.signin-text a {
  color: #1967d2;
  text-decoration: none;
  font-weight: 600;
}
.signin-text a:hover {
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
