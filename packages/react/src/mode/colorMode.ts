import { useSyncExternalStore } from 'react';

/** The two color modes. Same words as the `data-mode` attribute on the page root. */
export const COLOR_MODES = ['light', 'dark'] as const;
/** What is showing: 'light' or 'dark'. */
export type ColorMode = (typeof COLOR_MODES)[number];
/** What was asked for: a mode, or 'system' to follow the visitor's OS. The same words as `data-mode`. */
export type ColorModePreference = ColorMode | 'system';

/** Where an explicit choice is remembered. It only ever holds 'light' or 'dark'. */
export const COLOR_MODE_STORAGE_KEY = 'bit-color-mode';

const DARK_QUERY = '(prefers-color-scheme: dark)';

/**
 * Optional. Inline this in <head> to use a visitor's saved choice before the page draws. Without a
 * saved choice it sets `data-mode="system"` when the root has no attribute, and leaves a fixed
 * `light` or `dark` alone. Following the OS is the CSS's job (`data-mode="system"`).
 */
export const COLOR_MODE_SCRIPT =
  `(function(){var d=document.documentElement,m=null;` +
  `try{m=localStorage.getItem('${COLOR_MODE_STORAGE_KEY}')}catch(e){}` +
  `if(m==='light'||m==='dark'){d.dataset.mode=m}else if(!d.dataset.mode){d.dataset.mode='system'}})();`;

type ModeListener = (mode: ColorMode) => void;

function isColorMode(value: unknown): value is ColorMode {
  return value === 'light' || value === 'dark';
}

function isPreference(value: unknown): value is ColorModePreference {
  return value === 'system' || isColorMode(value);
}

const hasWindow = (): boolean => typeof window !== 'undefined';
const noop = (): void => {};

function readSaved(): ColorMode | null {
  try {
    const value = window.localStorage.getItem(COLOR_MODE_STORAGE_KEY);
    return isColorMode(value) ? value : null;
  } catch {
    // storage blocked: treat as nothing saved
    return null;
  }
}

function writeSaved(preference: ColorModePreference): void {
  try {
    if (preference === 'system') window.localStorage.removeItem(COLOR_MODE_STORAGE_KEY);
    else window.localStorage.setItem(COLOR_MODE_STORAGE_KEY, preference);
  } catch {
    // Storage is blocked (private browsing, disabled cookies): the choice lasts for this visit only.
  }
}

function darkQuery(): MediaQueryList | null {
  return typeof window.matchMedia === 'function' ? window.matchMedia(DARK_QUERY) : null;
}

/** Set by the class's static block so the tests-only reset can reach the private state. */
let resetService: (service: ColorModeService) => void;

/**
 * The page's color mode, as a service. Use the shared `colorMode` instance from any file:
 * `colorMode.set('dark')`, `colorMode.toggle()`, `colorMode.mode`.
 *
 * Don't construct your own; import `colorMode`. A second instance won't update hooks or ModeToggle.
 *
 * One store for the whole page, so every hook, toggle and caller agrees without a provider. Its
 * private fields are the one intentional piece of mutable state in the package; nothing outside
 * this class can change them. It starts on first use, never at import, so SSR and node stay safe.
 */
export class ColorModeService {
  static {
    resetService = (service) => service.#reset();
  }

  /** null until the service starts on first use. */
  #preference: ColorModePreference | null = null;
  /** Replaced, never mutated, so notifying is safe while a listener unsubscribes. */
  #listeners: ReadonlySet<ModeListener> = new Set();
  #query: MediaQueryList | null = null;

  /** What is showing right now: 'light' or 'dark' ('system' resolved against the OS). */
  get mode(): ColorMode {
    const preference = this.#started();
    if (preference !== 'system') return preference;
    return this.#query?.matches ? 'dark' : 'light';
  }

  /** What was asked for: the saved choice, else the page's data-mode, else 'system'. */
  get preference(): ColorModePreference {
    return this.#started();
  }

  /** Switch and remember. 'system' forgets the saved choice and follows the OS again. */
  set = (preference: ColorModePreference): void => {
    if (!hasWindow() || !isPreference(preference)) return;
    const before = this.mode;
    writeSaved(preference);
    document.documentElement.dataset.mode = preference;
    this.#preference = preference;
    if (this.mode !== before) this.#notify();
  };

  /** Switch to the opposite of what is showing, and remember it. */
  toggle = (): void => {
    this.set(this.mode === 'dark' ? 'light' : 'dark');
  };

  /** Call `listener(mode)` whenever the showing mode changes (a choice or an OS change). Returns an unsubscribe. */
  onChange = (listener: (mode: ColorMode) => void): (() => void) => {
    // Without a window (SSR, node) nothing can change, so don't keep the listener at all.
    if (!hasWindow()) return noop;
    this.#started();
    this.#listeners = new Set([...this.#listeners, listener]);
    return () => {
      this.#listeners = new Set([...this.#listeners].filter((existing) => existing !== listener));
    };
  };

  /** The preference, starting the service the first time. 'system' without a window (SSR, node). */
  #started(): ColorModePreference {
    if (!hasWindow()) return 'system';
    this.#preference ??= this.#start();
    return this.#preference;
  }

  /**
   * Precedence: a valid saved choice, then the root's data-mode, then 'system'. A saved choice is
   * written to the root; a missing (or unknown) attribute becomes 'system'; a fixed light or dark
   * is left alone. The OS listener lives for the page's life, so the mode keeps following the OS
   * even while no hook is mounted.
   */
  #start(): ColorModePreference {
    const root = document.documentElement;
    const saved = readSaved();
    const attribute = root.dataset.mode;
    const preference = saved ?? (isPreference(attribute) ? attribute : 'system');
    if (preference !== attribute) root.dataset.mode = preference;
    this.#query = darkQuery();
    this.#query?.addEventListener('change', this.#onSystemChange);
    return preference;
  }

  /** CSS repaints on its own; this keeps `mode` and the hooks in sync, only while following the OS. */
  #onSystemChange = (): void => {
    if (this.#preference === 'system') this.#notify();
  };

  #notify(): void {
    const mode = this.mode;
    for (const listener of this.#listeners) listener(mode);
  }

  #reset(): void {
    this.#query?.removeEventListener('change', this.#onSystemChange);
    this.#query = null;
    this.#listeners = new Set();
    this.#preference = null;
  }
}

/** The shared service. Import it anywhere: colorMode.set('dark'). */
export const colorMode = new ColorModeService();

/** Tests only: forget the shared service's state and OS listener, like a fresh page load. Not exported from the package. */
export function resetColorModeStore(): void {
  resetService(colorMode);
}

const getMode = (): ColorMode => colorMode.mode;
const getServerMode = (): ColorMode => 'light';

/** The current color mode and a setter, as React state over `colorMode`. No provider needed. */
export function useColorMode(): { mode: ColorMode; setMode: (mode: ColorMode) => void } {
  const mode = useSyncExternalStore(colorMode.onChange, getMode, getServerMode);
  return { mode, setMode: colorMode.set };
}
