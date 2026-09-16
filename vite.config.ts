import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'
import path from "path"


// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] }),
    tailwindcss(),
  ],
  resolve: {
   alias: {
     "@": path.resolve(__dirname, "./src"),
   },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('xlsx') || id.includes('exceljs') || id.includes('fflate')) {
              return 'vendor-excel';
            }
            if (id.includes('react') || id.includes('react-dom') || id.includes('scheduler')) {
              return 'vendor-react';
            }
            if (id.includes('lucide') || id.includes('embla') || id.includes('radix') || id.includes('sonner')) {
              return 'vendor-ui';
            }
            if (id.includes('dompurify') || id.includes('sanitize-html')) {
              return 'vendor-sanitize';
            }
          }
        }
      }
    }
  }
})
