import { defineConfig } from 'vitest/config'
import { loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import viteTsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const basePath = env.VITE_BASE_PATH || process.env.VITE_BASE_PATH || (mode === 'production' ? '/obstool/' : '/')

  return {
    // Keep built asset URLs correct when the app is deployed below the domain root.
    base: basePath,
    plugins: [
      react(),
      viteTsconfigPaths({
        root: '.',
        projects: ['./tsconfig.json'],
      }),
    ],
    build: {
      outDir: 'build',
    },
    server: {
      port: 3000,
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./src/setupTests.ts'],
    },
  }
})
