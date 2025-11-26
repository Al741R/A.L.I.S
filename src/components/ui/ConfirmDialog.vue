<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div v-if="modelValue" class="confirm-overlay" @click.self="onCancel">
        <div class="confirm-dialog" role="dialog" aria-modal="true" :aria-labelledby="titleId">
          <div class="confirm-header">
            <h3 :id="titleId" class="confirm-title">{{ title }}</h3>
            <button class="confirm-close" @click="onCancel" aria-label="Close">×</button>
          </div>
          <div class="confirm-body">
            <p>{{ message }}</p>
            <slot></slot>
          </div>
          <div class="confirm-footer">
            <button class="btn-cancel" @click="onCancel" :disabled="loading">
              {{ cancelText }}
            </button>
            <button
              class="btn-confirm"
              :class="confirmClass"
              @click="onConfirm"
              :disabled="loading"
            >
              {{ loading ? 'Processing...' : confirmText }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  title: { type: String, default: 'Confirm Action' },
  message: { type: String, default: 'Are you sure you want to proceed?' },
  confirmText: { type: String, default: 'Confirm' },
  cancelText: { type: String, default: 'Cancel' },
  variant: { type: String, default: 'danger' }, // 'danger', 'warning', 'primary'
  loading: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue', 'confirm', 'cancel'])

const titleId = computed(() => `confirm-title-${Math.random().toString(36).substr(2, 9)}`)
const confirmClass = computed(() => `variant-${props.variant}`)

function onConfirm() {
  emit('confirm')
}

function onCancel() {
  emit('update:modelValue', false)
  emit('cancel')
}
</script>

<style scoped>
.confirm-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 20px;
}

.confirm-dialog {
  background: white;
  border-radius: 12px;
  max-width: 480px;
  width: 100%;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: slideDown 0.3s ease-out;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.confirm-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px 16px;
  border-bottom: 1px solid #e5e7eb;
}

.confirm-title {
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.confirm-close {
  background: none;
  border: none;
  font-size: 28px;
  color: #6b7280;
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  transition: all 0.2s;
}

.confirm-close:hover {
  background: #f3f4f6;
  color: #374151;
}

.confirm-body {
  padding: 20px 24px;
  color: #4b5563;
  font-size: 14px;
  line-height: 1.6;
}

.confirm-body p {
  margin: 0 0 8px;
}

.confirm-footer {
  padding: 16px 24px;
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  border-top: 1px solid #e5e7eb;
}

.btn-cancel,
.btn-confirm {
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.btn-cancel {
  background: #f3f4f6;
  color: #374151;
}

.btn-cancel:hover:not(:disabled) {
  background: #e5e7eb;
}

.btn-confirm {
  color: white;
}

.btn-confirm.variant-danger {
  background: #dc2626;
}

.btn-confirm.variant-danger:hover:not(:disabled) {
  background: #b91c1c;
}

.btn-confirm.variant-warning {
  background: #f59e0b;
}

.btn-confirm.variant-warning:hover:not(:disabled) {
  background: #d97706;
}

.btn-confirm.variant-primary {
  background: #063fd1;
}

.btn-confirm.variant-primary:hover:not(:disabled) {
  background: #0532a8;
}

.btn-cancel:disabled,
.btn-confirm:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-fade-enter-active .confirm-dialog {
  animation: slideDown 0.3s ease-out;
}
</style>
