import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// 纯前端演示项目：无需配置后端代理。
// 如果未来接入真实服务，只需在这里增加 server.proxy，并把下方环境变量切换为真实地址。
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: false,
    watch: {
      // 编辑器的临时文件目录会触发反复的 watcher 重建，直接忽略。
      ignored: ['**/*.tmpdir/**', '**/.*.tmpdir/**', '**/.screenshots/**'],
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
});
