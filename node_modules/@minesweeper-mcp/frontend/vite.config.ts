import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@minesweeper-mcp/shared': path.resolve(__dirname, '../shared/src'),
      '@minesweeper-mcp/mcp-server': path.resolve(__dirname, '../mcp-server/src'),
    },
  },
  server: {
    port: 3001,
    proxy: {
      '/mcp': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
      '/health': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
});
