// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    // proxy: {
    //   // 代理 API 到你的后端服务器（如 Express 5000 端口）
    //   '/api': {
    //     target: 'http://121.43.34.217:5000',
    //     changeOrigin: true
    //   }
    // }
  }
});