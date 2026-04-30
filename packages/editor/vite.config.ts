import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  base: '/editor/',
  plugins: [react()],
  resolve: {
    alias: {
      '@simbafs/lx': path.resolve(__dirname, '../core/src'),
    },
  },
  publicDir: 'public',
})
