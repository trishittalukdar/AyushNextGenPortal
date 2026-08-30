import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  base: process.env.VITE_BASE_PATH ?? '/',
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: true,
    allowedHosts: true,
    port: 5173,
    proxy: {
      '/api-jsearch': {
        target: 'https://jsearch.p.rapidapi.com',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api-jsearch/, ''),
      },
      '/api-internships': {
        target: 'https://internships-api.p.rapidapi.com',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api-internships/, ''),
      },
    },
  },
});