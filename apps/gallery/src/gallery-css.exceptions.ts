import type { CssException } from './cssGuard';

/**
 * gallery.css is layout only, apart from these. Group B: token specimens that must paint to show a
 * token. Group C: the gallery frame and accessibility. One entry per selector and property; the test
 * fails on anything new that is not listed here, and on entries that no longer match.
 */
export const GALLERY_CSS_EXCEPTIONS: readonly CssException[] = [
  // ---------------------------------------------------------------- B: token specimens
  // ---------------------------------------------------------------- C: frame and accessibility
];
