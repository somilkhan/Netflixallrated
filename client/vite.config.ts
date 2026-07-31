import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';

type GitInfo = {
  sha: string;
  branch: string;
};

function getGitInfo(): GitInfo {
  try {
    const sha = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
    const branch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();

    return {
      sha: sha || 'unknown',
      branch: branch || 'unknown',
    };
  } catch {
    return {
      sha: 'unknown',
      branch: 'unknown',
    };
  }
}

const gitInfo = getGitInfo();
const buildDate = new Date().toISOString();

/** Rewrites dist/sw.js cache name to allrated-<sha> so every deploy auto-busts stale caches. */
function swCacheVersionPlugin(sha: string) {
  return {
    name: 'sw-cache-version',
    closeBundle() {
      const swPath = path.resolve(__dirname, 'dist/sw.js');
      if (!fs.existsSync(swPath)) return;
      const content = fs.readFileSync(swPath, 'utf8');
      const updated = content.replace(/allrated-v\d+/, `allrated-${sha}`);
      fs.writeFileSync(swPath, updated);
      console.log(`[sw-cache-version] cache name → allrated-${sha}`);
    },
  };
}

export default defineConfig({
  plugins: [react(), swCacheVersionPlugin(gitInfo.sha)],
  define: {
    'import.meta.env.VITE_GIT_SHA': JSON.stringify(gitInfo.sha),
    'import.meta.env.VITE_BUILD_DATE': JSON.stringify(buildDate),
    'import.meta.env.VITE_GIT_BRANCH': JSON.stringify(gitInfo.branch),
    // Accept TMDB_API_KEY (no VITE_ prefix) as a fallback so Replit secrets
    // work regardless of whether the user prefixed the key or not.
    'import.meta.env.VITE_TMDB_API_KEY': JSON.stringify(
      process.env.VITE_TMDB_API_KEY || process.env.TMDB_API_KEY || '',
    ),
  },
  resolve: {
    dedupe: ['react', 'react-dom'],
    alias: { '@': path.resolve(__dirname, 'src') },
  },
  server: {
    port: 5000,
    allowedHosts: true as const,
    headers: {
      // Prevent browsers from caching dev modules — required when HMR WebSocket
      // is blocked by a proxy (e.g. Replit preview), so stale modules don't persist.
      'Cache-Control': 'no-store',
    },
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
    port: 5000,
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
