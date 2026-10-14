import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))

// One repo, two separate websites:
//   --mode customer → src/customer → dist/customer  (public shop)
//   --mode admin    → src/admin    → dist/admin     (admin portal)
export default defineConfig(({ mode }) => {
  const site = mode === 'admin' ? 'admin' : 'customer'
  return {
    root: resolve(here, 'src', site),
    publicDir: resolve(here, 'public'),
    envDir: here,
    plugins: [react()],
    resolve: { alias: { '@shared': resolve(here, 'src/shared') } },
    build: { outDir: resolve(here, 'dist', site), emptyOutDir: true },
  }
})
