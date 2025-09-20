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
    port: parseInt(process.env.DEV_SERVER_PORT || '3000'),
    host: process.env.DEV_SERVER_HOST === 'true'
  },
  vite: {
    define: {
      'process.env.API_URL': JSON.stringify(process.env.PUBLIC_API_URL || 'http://localhost:4003'),
    },
    server: {
      proxy: {
        '/api/images': {
          target: process.env.PUBLIC_API_URL || 'http://localhost:4003',
          changeOrigin: true,
          secure: false
        }
      }
    }
  },
});
