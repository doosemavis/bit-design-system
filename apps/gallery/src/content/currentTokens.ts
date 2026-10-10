import { DEPRECATED_TEXT_SIZES, SEMANTIC_TOKENS } from '@bit-ds/react';

const DEPRECATED = new Set<string>(DEPRECATED_TEXT_SIZES.map((n) => `--bit-text-${n}px`));

/**
 * The tokens the gallery shows and counts: every semantic token but the deprecated text-size aliases
 * (--bit-text-11px, -13px and -15px, removed in 0.2.0). Themes still declare those, so SEMANTIC_TOKENS keeps them.
 */
export const CURRENT_TOKENS: readonly string[] = SEMANTIC_TOKENS.filter((name) => !DEPRECATED.has(name));
