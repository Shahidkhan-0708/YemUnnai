import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@watermelon-motion': path.resolve(__dirname, 'node_modules/motion/dist/es/react.mjs'),
      '@hugeicons/core-free-icons': path.resolve(__dirname, 'src/lib/hugeicons-shim.tsx'),
      '@hugeicons/react': path.resolve(__dirname, 'src/lib/hugeicons-shim.tsx'),
      'motion/react': path.resolve(__dirname, 'src/lib/motion-shim.tsx'),
      'motion': path.resolve(__dirname, 'src/lib/motion-shim.tsx'),
    },
  },
  server: {
    host: true,
    port: 5173,
    watch: { ignored: ['**/.tmp/**'] },
  },
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'vendor-react';
          }
          if (id.includes('node_modules/@supabase')) {
            return 'vendor-supabase';
          }
          if (id.includes('node_modules/lucide-react') || id.includes('node_modules/canvas-confetti')) {
            return 'vendor-ui';
          }
        }
      }
    }
  }
})
