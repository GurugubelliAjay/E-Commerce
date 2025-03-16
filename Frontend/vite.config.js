import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),      // React plugin for Vite
    tailwindcss() // Tailwind CSS Vite plugin
  ],
  server:{
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
      }
    }
  }
});
