import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5173,
    strictPort: true,
  },
  preview: {
    port: 4173,
    strictPort: true,
  },
  test: {
    globals: true,
    environment: 'jsdom',
    // 绝对路径：避免从任意工作目录（含 clean/ 验证克隆）启动时被解析到上层目录。
    setupFiles: [fileURLToPath(new URL('./vitest.setup.ts', import.meta.url))],
    css: false,
    include: ['src/**/*.test.{ts,tsx}'],
    root: fileURLToPath(new URL('.', import.meta.url)),
    testTimeout: 20000,
  },
});
