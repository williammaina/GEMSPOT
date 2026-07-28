import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@components': path.resolve(__dirname, './src/exports/components.js'),
      '@styles': path.resolve(__dirname, './src/exports/styles.js'),
      '@library': path.resolve(__dirname, './src/exports/library.js'),
    },
  },
});