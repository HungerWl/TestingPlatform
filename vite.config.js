import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// 本地开发 / 预览时把 /api 转发到 TestingService，避免跨域并支持任意前端端口。
// 生产部署可通过 VITE_API_BASE_URL 指向真实接口地址。
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiTarget = env.VITE_API_PROXY_TARGET || 'http://127.0.0.1:8000';
  const proxy = {
    '/api': {
      target: apiTarget,
      changeOrigin: true,
    },
  };

  return {
    plugins: [react()],
    server: {
      port: 5173,
      open: false,
      proxy,
      watch: {
        // 编辑器的临时文件目录会触发反复的 watcher 重建，直接忽略。
        ignored: ['**/*.tmpdir/**', '**/.*.tmpdir/**', '**/.screenshots/**'],
      },
    },
    preview: {
      proxy,
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
    },
  };
});
