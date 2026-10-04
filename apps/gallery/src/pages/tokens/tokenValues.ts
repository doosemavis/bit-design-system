import { useMemo } from 'react';
import { SEMANTIC_TOKENS, useColorMode } from '@bit-ds/react';
import type { ColorMode } from '@bit-ds/react';

/** Every public token's value as the page computes it right now. */
export interface TokenValues {
  /**
   * The mode these values were read in. No part reads it today; it is what ties a read to a mode, so
   * `useTokenValues` re-reads when the mode changes, and a caller can tell which mode a value belongs to.
   */
  mode: ColorMode;
  /** Token name → computed value, e.g. `--bit-color-primary` → `#7C3AED`. Empty when the theme lacks one. */
  values: ReadonlyMap<string, string>;
}

/** Read each token from the live document's computed style, so the values match the theme and the mode. */
export function readTokenValues(mode: ColorMode, names: readonly string[] = SEMANTIC_TOKENS): TokenValues {
  const style = getComputedStyle(document.documentElement);
  return { mode, values: new Map(names.map((name) => [name, style.getPropertyValue(name).trim()])) };
}

/**
 * The token values for the current mode. Read during render, so the first paint already has them (no blank
 * flash), and read again whenever the mode changes.
 *
 * Values come from computed style, never from the `data-mode` attribute, which can be `system` (the OS
 * decides in CSS). It relies on the root's `data-mode` being set before the first render (in `index.html`, or by
 * an earlier `useColorMode` subscriber such as the header's ModeToggle). Otherwise the first read could take
 * light values while the mode is dark, and nothing would re-read until the mode changes.
 */
export function useTokenValues(): TokenValues {
  const { mode } = useColorMode();
  return useMemo(() => readTokenValues(mode), [mode]);
}
