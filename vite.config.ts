import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Listen on all interfaces so invite links opened on a phone
    // (same Wi-Fi/hotspot) can reach the dev server.
    host: true,
    port: 5173,
    proxy: {
      // Proxy API calls to the NestJS backend during development.
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
});
