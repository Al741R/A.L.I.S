<template>
  <div class="role-select">
    <label class="label">User Type</label>
    <select v-model="inner" class="select" :disabled="disabled">
      <option value="Borrower">Borrower</option>
      <option value="Librarian">Librarian</option>
      <option value="Admin">Admin</option>
    </select>
  </div>
</template>
<script setup>
import { computed } from 'vue'
const props = defineProps({ modelValue: String, disabled: Boolean })
const emit = defineEmits(['update:modelValue'])
const inner = computed({ get: () => props.modelValue, set: (v) => emit('update:modelValue', v) })
</script>
<style scoped>
.role-select {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-family: Poppins, sans-serif;
}
.label {
  font-size: 0.8rem;
  color: #606060;
}
.select {
  padding: 0.65rem 0.75rem;
  border: 1px solid #000000cc;
  border-radius: 10px;
  font-size: 0.9rem;
}
.select:focus {
  outline: none;
  border-color: #3052de;
  box-shadow: 0 0 0 2px rgba(48, 82, 222, 0.15);
}
</style>
