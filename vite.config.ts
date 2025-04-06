import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import fs from 'fs';
import path from 'path';

// 自定义插件：确保图标文件被正确复制到dist目录
const copyIconsPlugin = () => {
  return {
    name: 'copy-icons-plugin',
    closeBundle: () => {
      // 确保dist/icons目录存在
      const distIconsDir = path.resolve('dist', 'icons');
      if (!fs.existsSync(distIconsDir)) {
        fs.mkdirSync(distIconsDir, { recursive: true });
      }
      
      // 复制public/icons中的图标到dist/icons
      const publicIconsDir = path.resolve('public', 'icons');
      if (fs.existsSync(publicIconsDir)) {
        const iconFiles = fs.readdirSync(publicIconsDir);
        iconFiles.forEach(file => {
          const srcPath = path.join(publicIconsDir, file);
          const destPath = path.join(distIconsDir, file);
          fs.copyFileSync(srcPath, destPath);
          console.log(`Copied icon: ${file} to dist/icons`);
        });
      }
      
      // 复制src/icons中的图标到dist/icons（如果存在）
      const srcIconsDir = path.resolve('src', 'icons');
      if (fs.existsSync(srcIconsDir)) {
        const iconFiles = fs.readdirSync(srcIconsDir);
        iconFiles.forEach(file => {
          const srcPath = path.join(srcIconsDir, file);
          const destPath = path.join(distIconsDir, file);
          fs.copyFileSync(srcPath, destPath);
          console.log(`Copied icon: ${file} from src/icons to dist/icons`);
        });
      }
    }
  };
};

export default defineConfig({
  plugins: [react(), copyIconsPlugin()],
  base: './',
  ssr: {
    noExternal: ['lucide-react']
  },
  build: {
    commonjsOptions: {
      include: [/node_modules/, /src\/.*\.ts/],
      transformMixedEsModules: true
    },
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: 'index.html',
        background: 'src/background.ts'
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js',
        assetFileNames: (assetInfo) => {
          // 对于图标文件，保持原始文件名和格式，不进行任何转换
          if (assetInfo.name && /\.(ico|png|jpg|jpeg|gif|svg)$/i.test(assetInfo.name)) {
            return assetInfo.name;
          }
          return '[name].[hash].[ext]';
        }
      },
      external: []
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
  },
  // Copy static files to dist
  publicDir: './public'
});