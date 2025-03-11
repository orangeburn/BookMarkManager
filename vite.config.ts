import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: 'index.html',
        background: 'src/background.ts'
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js',
        assetFileNames: '[name].[ext]'
      }
    },
    // Prevent code splitting for extension
    cssCodeSplit: false,
    sourcemap: false,
    // Ensure we don't inline assets as data URLs
    assetsInlineLimit: 0
  },
  server: {
    port: 5173,
    strictPort: true
  }
});