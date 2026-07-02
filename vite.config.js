import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const bufferPath = path.resolve(__dirname, 'node_modules/buffer/index.js')

export default defineConfig({
  base: '/wmsd/',
  plugins: [react()],
  resolve: {
    alias: {
      '@app': path.join(__dirname, './src'),
      '@tools': path.join(__dirname, './src/tools'),
      '@pages': path.join(__dirname, './src/pages'),
      // 必须指向 npm 包绝对路径，否则 Vite 会 externalize Node 内置 buffer
      buffer: bufferPath,
    },
    extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json'],
  },
  define: {
    global: 'globalThis',
  },
  optimizeDeps: {
    include: ['buffer', 'ethers'],
    esbuildOptions: {
      define: {
        global: 'globalThis',
      },
    },
  },
  server: {
    host: true,
    port: 5113,
  },
})
