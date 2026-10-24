/**
 * Page-level query keys: state a page keeps in the URL beside its controls (the Passes section's `pass`; PR D adds
 * the theme drawer's `t.*`). useControlState is the only code that rewrites the URL, so it carries these through
 * every canonical rewrite, push and replace, cleaned by each key's parser.
 */

export const PASSES = ['wireframe', 'tokens', 'states', 'final'] as const;
export type Pass = (typeof PASSES)[number];
export const DEFAULT_PASS: Pass = 'wireframe';

/** A known pass, or the default for a missing or unknown value. */
export function parsePass(raw: string | null): Pass {
  return PASSES.find((pass) => pass === raw) ?? DEFAULT_PASS;
}

interface PageParam {
  /** The canonical value to keep, or undefined to drop the key (its default, or a value it doesn't know). */
  parse: (raw: string) => string | undefined;
}

export const PAGE_PARAMS: Readonly<Record<string, PageParam>> = {
  pass: {
    parse: (raw) => {
      const pass = parsePass(raw);
      return pass === DEFAULT_PASS ? undefined : pass;
    },
  },
};

/** `next`'s control keys, then each page key from `current` that parses, in registry order. A new object. */
export function withPageParams(next: URLSearchParams, current: URLSearchParams): URLSearchParams {
  const out = new URLSearchParams([...next].filter(([key]) => !(key in PAGE_PARAMS)));
  for (const [key, param] of Object.entries(PAGE_PARAMS)) {
    const raw = current.get(key);
    const value = raw === null ? undefined : param.parse(raw);
    if (value !== undefined) out.append(key, value);
  }
  return out;
}
