<template>
  <div class="container">
    <div class="left-side">
      <img
        src="https://cdn-icons-png.flaticon.com/512/3064/3064197.png"
        alt="Password Reset Illustration"
        class="library-image"
      />
    </div>
    <div class="right-side">
      <form @submit.prevent="submit" class="reset-form" novalidate>
        <h2 class="form-title">Forgot Password?</h2>
        <p class="form-description">
          Enter your email or ID below, and we'll send you a link to reset your password.
        </p>
        <div class="form-group">
          <input
            type="text"
            v-model="identifier"
            placeholder="Email or ID"
            required
            autocomplete="username"
          />
        </div>
        <button type="submit" class="reset-btn" :disabled="submitting">
          {{ submitting ? 'Sending…' : 'Send Reset Link' }}
        </button>
        <p class="back-to-login">
          Remember your password?
          <router-link :to="{ name: 'login' }">Back to Sign In</router-link>
        </p>
      </form>
    </div>
  </div>
</template>
<script setup>
import { ref } from 'vue'
// In future, integrate with actual reset endpoint via auth store / API.
const identifier = ref('')
const submitting = ref(false)

function validate() {
  return !!identifier.value
}

async function submit() {
  if (!validate()) return
  submitting.value = true
  try {
    // Placeholder: replace with API call like: await api.post('/auth/forgot-password', { identifier: identifier.value })
    await new Promise((r) => setTimeout(r, 600))
    alert('If an account exists, a reset link will be sent.')
  } finally {
    submitting.value = false
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
.reset-form {
  width: 100%;
  max-width: 350px;
}
.form-title {
  margin-bottom: 10px;
  font-weight: 600;
  font-size: 24px;
  color: #000;
}
.form-description {
  margin-bottom: 30px;
  font-size: 14px;
  color: #666;
  line-height: 1.5;
}
.form-group {
  margin-bottom: 20px;
}
input[type='text'] {
  width: 100%;
  padding: 12px 14px;
  font-size: 15px;
  border: 1.2px solid #bbb;
  border-radius: 8px;
  outline: none;
  box-sizing: border-box;
  transition: border-color 0.3s ease;
}
input[type='text']:focus {
  border-color: #1967d2;
  box-shadow: 0 0 5px rgba(25, 103, 210, 0.4);
}
.reset-btn {
  width: 100%;
  padding: 12px 0;
  background-color: #1967d2;
  color: #fff;
  border: none;
  border-radius: 25px;
  font-weight: 600;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}
.reset-btn:hover {
  background-color: #0f4caa;
}
.back-to-login {
  margin-top: 20px;
  font-size: 13px;
  text-align: center;
  color: #444;
}
.back-to-login a {
  color: #1967d2;
  text-decoration: none;
  font-weight: 600;
}
.back-to-login a:hover {
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
