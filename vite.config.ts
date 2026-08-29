import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  base: '/AyushNextGenPortal/',
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
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