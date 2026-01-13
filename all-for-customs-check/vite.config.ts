import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react-swc";
import { defineConfig } from "vite";
import { resolve } from 'path'

const projectRoot = process.env.PROJECT_ROOT || import.meta.dirname

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  optimizeDeps: {
    include: ['recharts'],
    esbuildOptions: {
      target: 'es2020'
    }
  },
  resolve: {
    alias: {
      '@': resolve(projectRoot, 'src'),
      '@config': resolve(projectRoot, 'config')
    }
  },
  build: {
    rollupOptions: {
      external: ['@github/spark/hooks', '@github/spark/spark'],
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('@radix-ui/')) {
              return 'vendor-ui';
            }

            // Include React and recharts together so React loads before recharts
            if (id.includes('/react-dom/') || id.endsWith('/react-dom/index.js') || id.includes('/react/') || id.includes('recharts')) {
              return 'vendor-react';
            }

            if (id.includes('@phosphor-icons/react') || id.includes('lucide-react')) {
              return 'vendor-icons';
            }
          }

          return undefined;
        },
      }
    },
    chunkSizeWarningLimit: 800,
  },
});
