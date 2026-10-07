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

// jsdom has no HTMLDialogElement.showModal()/close(). A minimal stand-in for unit tests: showModal sets
// `open`; close clears it and fires `close`, as the browser does. Top layer, inert and focus return are
// browser behaviour, checked by the gallery's Playwright e2e.
if (typeof HTMLDialogElement !== 'undefined' && typeof HTMLDialogElement.prototype.showModal !== 'function') {
  HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
    this.setAttribute('open', '');
  };
  HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) {
    if (!this.hasAttribute('open')) return;
    this.removeAttribute('open');
    this.dispatchEvent(new Event('close'));
  };
}
