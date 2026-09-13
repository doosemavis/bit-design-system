import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/** Served from https://doosemavis.github.io/bit-design-system/ in production, from / in dev. */
export const PAGES_BASE = '/bit-design-system/';

export default defineConfig(({ command }) => ({
  base: command === 'build' ? PAGES_BASE : '/',
  plugins: [react()],
  server: { port: 5173, strictPort: true },
  preview: { port: 4173, strictPort: true },
}));
