<template>
  <label class="base-input" :class="{ invalid: error }">
    <span v-if="label" class="label">{{ label }}</span>
    <div class="field-wrapper">
      <input
        :type="type"
        v-model="inner"
        :placeholder="placeholder"
        :autocomplete="autocomplete"
        :disabled="disabled"
        :id="id"
        :name="name"
        @blur="emit('blur', inner)"
      />
    </div>
    <span v-if="error" class="error">{{ error }}</span>
  </label>
</template>
<script setup>
import { computed } from 'vue'
const props = defineProps({
  modelValue: [String, Number],
  label: String,
  type: { type: String, default: 'text' },
  placeholder: String,
  error: String,
  autocomplete: String,
  disabled: Boolean,
  id: String,
  name: String,
})
const emit = defineEmits(['update:modelValue', 'blur'])
const inner = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})
</script>
<style scoped>
.base-input {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-family: Poppins, sans-serif;
}
.field-wrapper {
  display: flex;
}
.base-input input {
  width: 100%;
  padding: 0.75rem 1rem;
  font-size: 0.95rem;
  border: 1px solid #000000cc;
  border-radius: 10px;
  outline: none;
}
.base-input input:focus {
  border-color: #3052de;
  box-shadow: 0 0 0 2px rgba(48, 82, 222, 0.15);
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
