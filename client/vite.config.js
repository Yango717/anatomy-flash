import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig({
  plugins: [
    react(),
    viteStaticCopy({
      targets: [
        { src: '../content/**/*', dest: 'content' },
        { src: 'node_modules/sql.js/dist/sql-wasm-browser.wasm', dest: '' }
      ]
    })
  ],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3200',
        changeOrigin: true,
      },
    },
  },
  optimizeDeps: {
    exclude: ['sql.js']
  }
});
