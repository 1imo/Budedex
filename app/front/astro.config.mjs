import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  output: 'server',
  integrations: [
    react(),
    tailwind({
      applyBaseStyles: false,
    }),
  ],
  server: {
    port: 3000,
    host: true
  },
  vite: {
    define: {
      'process.env.API_URL': JSON.stringify(process.env.API_URL || 'http://localhost:4003'),
    },
    server: {
      proxy: {
        '/api/images': {
          target: 'http://localhost:4003',
          changeOrigin: true,
          secure: false
        }
      }
    }
  },
});
