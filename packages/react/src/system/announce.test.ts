import { afterEach, describe, expect, it, vi } from 'vitest';
import { ANNOUNCER_ID, announce } from './announce';

afterEach(() => {
  document.getElementById(ANNOUNCER_ID)?.remove();
  vi.useRealTimers();
});

describe('announce', () => {
  it('creates one polite, visually hidden live region at the end of body', () => {
    vi.useFakeTimers();
    announce('Copied');
    vi.runAllTimers();
    const region = document.getElementById(ANNOUNCER_ID)!;
    expect(region.getAttribute('aria-live')).toBe('polite');
    expect(region.getAttribute('role')).toBe('status');
    expect(region.className).toBe('bit-visually-hidden');
    expect(document.body.lastElementChild).toBe(region);
    expect(region.textContent).toBe('Copied');
  });

  it('reuses the same region for every message', () => {
    vi.useFakeTimers();
    announce('Copied');
    announce('Copy failed');
    vi.runAllTimers();
    expect(document.querySelectorAll(`#${ANNOUNCER_ID}`)).toHaveLength(1);
    expect(document.getElementById(ANNOUNCER_ID)!.textContent).toBe('Copy failed');
  });

  it('clears first, so the same message twice is announced twice', () => {
    vi.useFakeTimers();
    announce('Copied');
    vi.runAllTimers();
    announce('Copied');
    expect(document.getElementById(ANNOUNCER_ID)!.textContent).toBe('');
    vi.runAllTimers();
    expect(document.getElementById(ANNOUNCER_ID)!.textContent).toBe('Copied');
  });

  it('does nothing without a document (server rendering)', () => {
    const original = globalThis.document;
    // @ts-expect-error: simulating a server
    delete globalThis.document;
    try {
      expect(() => announce('Copied')).not.toThrow();
    } finally {
      globalThis.document = original;
    }
  });
});
