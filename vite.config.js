import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';

export default defineConfig({
  plugins: [preact()],
  base: './',
  define: { __BUILD__: JSON.stringify(process.env.GITHUB_RUN_NUMBER || 'dev') },
  build: { outDir: 'dist', target: 'es2020' },
});
