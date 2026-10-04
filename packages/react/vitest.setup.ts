import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Node 25+ ships its own Web Storage global. Without --localstorage-file it is undefined, and the
// jsdom environment does not replace it. Always hand tests jsdom's localStorage (harmless where the
// environment already installed it). Never read the Node global first: its getter prints an
// ExperimentalWarning.
const env = globalThis as typeof globalThis & { jsdom?: { window: { localStorage: Storage } } };
if (env.jsdom) {
  Object.defineProperty(globalThis, 'localStorage', {
    value: env.jsdom.window.localStorage,
    configurable: true,
    writable: true,
  });
}

afterEach(() => {
  cleanup();
});
