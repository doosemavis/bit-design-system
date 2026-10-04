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
    expect(region.className).toBe('');
    expect(region.style.position).toBe('absolute');
    expect(region.style.clipPath).toBe('inset(50%)');
    expect(region.style.overflow).toBe('hidden');
    expect(region.style.width).toBe('1px');
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

  describe('inside a modal', () => {
    afterEach(() => {
      document.querySelector('dialog')?.remove();
      (document.activeElement as HTMLElement | null)?.blur();
    });

    it('lives in the open dialog that holds focus, and gets the text there', () => {
      vi.useFakeTimers();
      document.body.innerHTML = '<dialog open aria-modal="true"><button id="in">Ok</button></dialog>';
      document.getElementById('in')!.focus();
      announce('Copied');
      vi.runAllTimers();
      const region = document.getElementById(ANNOUNCER_ID)!;
      expect(region.parentElement).toBe(document.querySelector('dialog'));
      expect(region.textContent).toBe('Copied');
    });

    it('moves back to body once focus is out of the dialog', () => {
      vi.useFakeTimers();
      document.body.innerHTML = '<dialog open aria-modal="true"><button id="in">Ok</button></dialog>';
      document.getElementById('in')!.focus();
      announce('Copied');
      document.querySelector('dialog')!.remove();
      (document.activeElement as HTMLElement | null)?.blur();
      announce('Done');
      vi.runAllTimers();
      const region = document.getElementById(ANNOUNCER_ID)!;
      expect(region.parentElement).toBe(document.body);
      expect(region.textContent).toBe('Done');
    });
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
