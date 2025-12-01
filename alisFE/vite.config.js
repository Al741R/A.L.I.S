import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const isTest = mode === 'test' || process.env.VITEST
  return {
    plugins: [vue(), !isTest && vueDevTools()].filter(Boolean),
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    // Vitest configuration embedded so separate file not required.
    test: {
      environment: 'node',
      coverage: {
        enabled: false,
      },
    },
  }
})
