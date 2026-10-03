import { useMemo } from 'react';
import { SEMANTIC_TOKENS, useColorMode } from '@bit-ds/react';
import type { ColorMode } from '@bit-ds/react';

/** Every public token's value as the page computes it right now. */
export interface TokenValues {
  /** The mode these values were read in. */
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
 */
export function useTokenValues(): TokenValues {
  const { mode } = useColorMode();
  return useMemo(() => readTokenValues(mode), [mode]);
}
