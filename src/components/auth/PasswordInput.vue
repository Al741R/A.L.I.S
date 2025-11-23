<template>
  <label class="password-input" :class="{ invalid: error }">
    <span v-if="label" class="label">{{ label }}</span>
    <div class="wrapper">
      <input
        :type="visible ? 'text' : 'password'"
        v-model="inner"
        :placeholder="placeholder"
        :autocomplete="autocomplete || 'current-password'"
        :disabled="disabled"
        :id="id"
        :name="name"
        @blur="emit('blur', inner)"
      />
      <button
        type="button"
        class="toggle"
        @click="visible = !visible"
        :aria-label="visible ? 'Hide password' : 'Show password'"
      >
        <span v-if="visible">🙈</span>
        <span v-else>👁️</span>
      </button>
    </div>
    <span v-if="error" class="error">{{ error }}</span>
  </label>
</template>
<script setup>
import { ref, computed } from 'vue'
const props = defineProps({
  modelValue: String,
  label: String,
  placeholder: String,
  error: String,
  autocomplete: String,
  disabled: Boolean,
  id: String,
  name: String,
})
const emit = defineEmits(['update:modelValue', 'blur'])
const visible = ref(false)
const inner = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})
</script>
<style scoped>
.password-input {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-family: Poppins, sans-serif;
}
.wrapper {
  position: relative;
  display: flex;
}
.password-input input {
  width: 100%;
  padding: 0.75rem 1rem;
  font-size: 0.95rem;
  border: 1px solid #000000cc;
  border-radius: 10px;
  outline: none;
}
.password-input input:focus {
  border-color: #3052de;
  box-shadow: 0 0 0 2px rgba(48, 82, 222, 0.15);
}
.toggle {
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1rem;
}
.label {
  font-size: 0.8rem;
  color: #606060;
}
.error {
  font-size: 0.7rem;
  color: #d63636;
}
.invalid input {
  border-color: #d63636;
}
</style>
