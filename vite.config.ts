import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Static-first build: everything is baked at build time (no runtime APIs).
// Rollup's default splitting keeps three.js inside the lazy HeroScene chunk,
// so the core shell stays tiny and only the homepage hero pays for WebGL.
// (Object-form manualChunks was tried and reverted: it hoisted jsx-runtime
// into the three chunk, making the entry preload three.js eagerly.)
export default defineConfig({
  plugins: [react()],
  build: {
    target: 'es2020',
    chunkSizeWarningLimit: 950,
  },
})
