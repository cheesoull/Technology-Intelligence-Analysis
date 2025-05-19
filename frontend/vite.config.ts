import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'https://b431-163-125-200-214.ngrok-free.app',
        changeOrigin: true, 
        secure: false,     
        rewrite: (path) => path, 
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq) => {
            proxyReq.setHeader('Host', 'b431-163-125-200-214.ngrok-free.app');
            proxyReq.setHeader('X-Forwarded-Host', 'localhost:5173');
          });
        },
      },
    },
  },
});