<template>
  <div class="skeleton-loader" :class="variant" :style="customStyle">
    <div class="skeleton-shimmer"></div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  variant: {
    type: String,
    default: 'text', // 'text', 'title', 'avatar', 'thumbnail', 'button', 'card'
  },
  width: { type: String, default: '' },
  height: { type: String, default: '' },
  rounded: { type: Boolean, default: false },
})

const customStyle = computed(() => {
  const style = {}
  if (props.width) style.width = props.width
  if (props.height) style.height = props.height
  if (props.rounded) style.borderRadius = '50%'
  return style
})
</script>

<style scoped>
.skeleton-loader {
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  position: relative;
  overflow: hidden;
  border-radius: 4px;
}

.skeleton-shimmer {
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.6), transparent);
  animation: shimmer-slide 1.5s infinite;
}

@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

@keyframes shimmer-slide {
  0% {
    left: -100%;
  }
  100% {
    left: 100%;
  }
}

/* Variant styles */
.skeleton-loader.text {
  height: 16px;
  margin-bottom: 8px;
}

.skeleton-loader.title {
  height: 24px;
  width: 60%;
  margin-bottom: 12px;
}

.skeleton-loader.avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
}

.skeleton-loader.thumbnail {
  width: 100%;
  height: 200px;
  border-radius: 8px;
}

.skeleton-loader.button {
  width: 120px;
  height: 40px;
  border-radius: 8px;
}

.skeleton-loader.card {
  width: 100%;
  height: 120px;
  border-radius: 12px;
}
</style>
