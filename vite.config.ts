/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Enable code splitting for smaller bundles
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks — split large dependencies
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-supabase': ['@supabase/supabase-js'],
          'vendor-charts': ['recharts'],
          'vendor-pdf': ['jspdf', 'jspdf-autotable'],
          'vendor-xlsx': ['xlsx'],
          'vendor-ui': ['@headlessui/react', 'lucide-react'],
          'vendor-utils': ['date-fns', 'zod', 'clsx', 'tailwind-merge'],
        },
      },
    },
    // Target modern browsers for smaller output
    target: 'es2020',
    // Report compressed sizes
    reportCompressedSize: true,
    // Chunk size warning threshold
    chunkSizeWarningLimit: 250,
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
    include: ['src/**/*.{test,spec}.{js,ts,jsx,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
  },
})
