/**
 * Page-level query keys: state a page keeps in the URL beside its controls (the Passes section's `pass`, and any
 * future page key registered here). useControlState carries these through every canonical rewrite, push and replace,
 * cleaned by each key's parser; a page that sets one of its own keys goes through setPageParam, so its push is
 * already canonical.
 */

import type { Manifest } from '../manifests/types';

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
  /** Whether the key means anything on this page; where it doesn't, withPageParams drops it. Default: everywhere. */
  appliesTo?: (manifest: Manifest) => boolean;
}

export const PAGE_PARAMS: Readonly<Record<string, PageParam>> = {
  pass: {
    parse: (raw) => {
      const pass = parsePass(raw);
      return pass === DEFAULT_PASS ? undefined : pass;
    },
    appliesTo: (manifest) => manifest.anatomy !== undefined,
  },
};

/** `next`'s control keys, then each page key from `current` that parses, in registry order, minus those that don't apply to `manifest`. A new object. */
export function withPageParams(next: URLSearchParams, current: URLSearchParams, manifest?: Manifest): URLSearchParams {
  const out = new URLSearchParams([...next].filter(([key]) => !Object.hasOwn(PAGE_PARAMS, key)));
  for (const [key, param] of Object.entries(PAGE_PARAMS)) {
    if (manifest !== undefined && param.appliesTo?.(manifest) === false) continue;
    const raw = current.get(key);
    const value = raw === null ? undefined : param.parse(raw);
    if (value !== undefined) out.append(key, value);
  }
  return out;
}

/**
 * `current` with one page key set (or removed, for undefined, the key's default or a value it doesn't know), in the
 * canonical order withPageParams writes: control keys as they were, then page keys in registry order. A new object.
 */
export function setPageParam(current: URLSearchParams, key: string, value: string | undefined): URLSearchParams {
  if (!Object.hasOwn(PAGE_PARAMS, key)) throw new Error(`${key} is not a page key`);
  const updated = new URLSearchParams([...current].filter(([name]) => name !== key));
  if (value !== undefined) updated.append(key, value);
  return withPageParams(updated, updated);
}
