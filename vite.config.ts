import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  // Load env so Vite injects VITE_* into import.meta.env
  loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],
    define: {
      // Prevent third-party libs from crashing when touching process.env in the browser
      'process.env': {},
      'process.env.NODE_ENV': JSON.stringify(mode),
    },
    server: {
      port: 5173,
      strictPort: false,
      host: true,
    },
    preview: {
      port: 4173,
      strictPort: false,
      host: true,
    },
    build: {
      outDir: 'dist',
      sourcemap: true,
      target: 'es2020',
    },
    optimizeDeps: {
      esbuildOptions: {
        define: {
          'process.env.NODE_ENV': JSON.stringify(mode),
        },
      },
    },
  }
})
