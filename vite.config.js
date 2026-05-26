import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@app': path.join(__dirname, './src'),
      '@tools': path.join(__dirname, './src/tools'),
      '@pages': path.join(__dirname, './src/pages'),
    },
    extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json']
  },
  server: {
    host: true,
    port: 5113
  }
})
