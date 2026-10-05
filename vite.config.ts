import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Göreli taban: GitHub Pages proje sitelerinde (/repo/) de çalışır.
  base: './',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    target: 'es2022',
    sourcemap: true,
  },
  server: {
    port: 5173,
  },
  test: {
    environment: 'jsdom',
    include: ['tests/**/*.test.ts'],
    globals: false,
  },
});
