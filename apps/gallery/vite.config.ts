import { createRequire } from 'node:module';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { cspPlugin } from './csp.ts';

/** Served from https://doosemavis.github.io/bit-design-system/ in production, from / in dev. */
export const PAGES_BASE = '/bit-design-system/';

const require = createRequire(import.meta.url);

/** @bit-ds/react's version, read at build time from its package.json. Home shows it as `v{version}`. */
export const BIT_VERSION: string = (require('@bit-ds/react/package.json') as { version: string }).version;

/** Compile-time constants, shared with vitest.config.ts so tests see the same values. */
export const DEFINE = { __BIT_VERSION__: JSON.stringify(BIT_VERSION) };

export default defineConfig(({ command, isPreview }) => ({
  // Preview serves the build, whose asset URLs start with the Pages base.
  base: command === 'build' || isPreview ? PAGES_BASE : '/',
  define: DEFINE,
  // The CSP meta goes into the production build only (see csp.ts); dev's HMR needs inline scripts.
  plugins: [react(), cspPlugin()],
  server: { port: 5173, strictPort: true },
  preview: { port: 4173, strictPort: true },
}));
