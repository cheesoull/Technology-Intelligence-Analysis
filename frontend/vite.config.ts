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
        changeOrigin: true,  // 修改 Origin 为目标地址
        secure: false,       // 忽略 HTTPS 证书错误
        rewrite: (path) => path, // 不移除 /api 前缀
        configure: (proxy, options) => {
          // 强制设置 Host 头，避免 Ngrok 拦截
          proxy.on('proxyReq', (proxyReq) => {
            proxyReq.setHeader('Host', 'b431-163-125-200-214.ngrok-free.app');
            proxyReq.setHeader('X-Forwarded-Host', 'localhost:5173');
          });
        },
      },
    },
  },
});