import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { DEFINE } from './vite.config';

export default defineConfig({
  plugins: [react()],
  define: DEFINE,
  test: {
    environment: 'jsdom',
    setupFiles: ['../../vitest.shared-setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/*.test.{ts,tsx}', 'src/main.tsx', 'src/test/**'],
      thresholds: { lines: 80, functions: 80, branches: 80, statements: 80 },
    },
  },
});
