<template>
  <button
    :type="type"
    class="base-button"
    :class="[variant, { loading }]"
    :disabled="disabled || loading"
    @click="onClick"
  >
    <span v-if="!loading"><slot /></span>
    <span v-else class="spinner" aria-label="Loading" />
  </button>
</template>

<script setup>
const props = defineProps({
  type: { type: String, default: 'button' },
  variant: { type: String, default: 'primary' },
  loading: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
})
const emit = defineEmits(['click'])
function onClick(e) {
  if (!props.loading && !props.disabled) emit('click', e)
}
</script>

<style scoped>
.base-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-family: Poppins, sans-serif;
  font-size: 0.95rem;
  font-weight: 500;
  border-radius: 24px;
  padding: 0.75rem 2.5rem;
  cursor: pointer;
  border: none;
  transition:
    background 0.2s,
    box-shadow 0.2s;
}
.base-button.primary {
  background: #3052de;
  color: #fff;
}
.base-button.primary:hover {
  background: #2645c7;
}
.base-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.spinner {
  width: 1.2rem;
  height: 1.2rem;
  border: 3px solid #fff;
  border-bottom-color: transparent;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
