import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    dedupe: ['react', 'react-dom'],
    alias: { '@': path.resolve(__dirname, 'src') },
  },
  server: {
    port: 5000,
    allowedHosts: true as const,
    proxy: {
      // Sports: proxy directly to api.bingr.one with the required Origin header.
      // This rule must come BEFORE the generic /api rule (Vite matches first-wins).
      // In production Railway serves /api/sports/* via server/src/routes/sports.ts.
      '/api/sports': {
        target: 'https://api.bingr.one',
        changeOrigin: true,
        headers: {
          Origin:  'https://bingr.one',
          Referer: 'https://bingr.one/',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        },
      },
      '/api': { target: 'https://netflixallrated.up.railway.app', changeOrigin: true },
    },
  },
  preview: {
    host: '0.0.0.0',
    port: Number(process.env.PORT) || 4173,
    allowedHosts: true as const,
  },
  build: {
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three'],
          vendor: ['react', 'react-dom', 'react-router-dom'],
          motion: ['framer-motion'],
          carousel: ['embla-carousel-react', 'embla-carousel-autoplay'],
        },
      },
    },
    chunkSizeWarningLimit: 900,
  },
});
