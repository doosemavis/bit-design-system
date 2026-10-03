import { useSyncExternalStore } from 'react';

/** The two color modes. Same words as the `data-mode` attribute on the page root. */
export const COLOR_MODES = ['light', 'dark'] as const;
export type ColorMode = (typeof COLOR_MODES)[number];

/** Where an explicit choice is remembered. Only a visitor's choice writes it. */
export const COLOR_MODE_STORAGE_KEY = 'bit-color-mode';

const DARK_QUERY = '(prefers-color-scheme: dark)';

/**
 * Inline this in <head>, before your CSS. It sets `data-mode` before first paint so a dark-mode
 * visitor never sees a light flash. It uses the hook's order: stored choice, OS preference, light.
 */
export const COLOR_MODE_SCRIPT =
  `(function(){var d=document.documentElement,m=null;` +
  `try{m=localStorage.getItem('${COLOR_MODE_STORAGE_KEY}')}catch(e){}` +
  `if(m!=='light'&&m!=='dark'){m=window.matchMedia&&window.matchMedia('${DARK_QUERY}').matches?'dark':'light'}` +
  `d.dataset.mode=m})();`;

function isColorMode(value: unknown): value is ColorMode {
  return value === 'light' || value === 'dark';
}

function readStored(): ColorMode | null {
  try {
    const value = window.localStorage.getItem(COLOR_MODE_STORAGE_KEY);
    return isColorMode(value) ? value : null;
  } catch {
    return null;
  }
}

function writeStored(mode: ColorMode): void {
  try {
    window.localStorage.setItem(COLOR_MODE_STORAGE_KEY, mode);
  } catch {
    // Storage is blocked (private browsing, disabled cookies): the choice lasts for this visit only.
  }
}

function darkQuery(): MediaQueryList | null {
  return typeof window.matchMedia === 'function' ? window.matchMedia(DARK_QUERY) : null;
}

/** Stored choice, then the OS preference, then light. Light when there is no window (SSR, node). */
export function resolveColorMode(): ColorMode {
  if (typeof window === 'undefined') return 'light';
  return readStored() ?? (darkQuery()?.matches ? 'dark' : 'light');
}

// One store for the whole page, so every hook and toggle agrees without a provider. This module
// state is the store; it is the one intentional piece of mutable state in the package.
const listeners = new Set<() => void>();
let current: ColorMode | null = null;
let chosen = false;
let watched: MediaQueryList | null = null;

function apply(mode: ColorMode): void {
  current = mode;
  document.documentElement.dataset.mode = mode;
  for (const listener of listeners) listener();
}

function getSnapshot(): ColorMode {
  if (current === null) {
    const fromScript = document.documentElement.dataset.mode;
    current = isColorMode(fromScript) ? fromScript : resolveColorMode();
  }
  return current;
}

function getServerSnapshot(): ColorMode {
  return 'light';
}

function onSystemChange(event: { matches: boolean }): void {
  if (chosen || readStored() !== null) return;
  apply(event.matches ? 'dark' : 'light');
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  if (listeners.size === 1) {
    document.documentElement.dataset.mode = getSnapshot();
    watched = darkQuery();
    watched?.addEventListener('change', onSystemChange);
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      watched?.removeEventListener('change', onSystemChange);
      watched = null;
    }
  };
}

/** Choose a mode: applies it to the page root and remembers it. Ignored without a window or for unknown values. */
export function setColorMode(mode: ColorMode): void {
  if (typeof window === 'undefined' || !isColorMode(mode)) return;
  chosen = true;
  writeStored(mode);
  apply(mode);
}

/** Tests only: forget the store so each test starts like a fresh page load. Not exported from the package. */
export function resetColorModeStore(): void {
  watched?.removeEventListener('change', onSystemChange);
  watched = null;
  listeners.clear();
  current = null;
  chosen = false;
}

/** The current color mode and a setter. Follows the OS until the visitor chooses; no provider needed. */
export function useColorMode(): { mode: ColorMode; setMode: (mode: ColorMode) => void } {
  const mode = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return { mode, setMode: setColorMode };
}
