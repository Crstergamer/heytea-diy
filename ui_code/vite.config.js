import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [
    vue(),
  ],
  build: {
    outDir: 'server/public', // 将构建文件输出到 server/public 目录
    emptyOutDir: true, // 构建前清空输出目录
  },
  server: {
    host: '0.0.0.0',
    proxy: {
      '^/express/': {
        target: 'http://localhost:5969',
        changeOrigin: true,
        rewrite: (path) => path
      }
    }
  }
});