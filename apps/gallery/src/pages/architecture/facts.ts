import bitPackage from '@bit-ds/react/package.json';
import { CURRENT_TOKENS } from '../../content/currentTokens';
import { COMPONENT_COUNT } from '../../manifests';
import { THEME_CSS } from './themeSource';

/** `@layer a, b, c;`, the first layer-order statement in a stylesheet, as its names. Empty when there is none. */
export function parseLayerOrder(css: string): string[] {
  const statement = /@layer\s+([\w.-]+(?:\s*,\s*[\w.-]+)*)\s*;/.exec(css);
  return statement ? statement[1]!.split(',').map((name) => name.trim()) : [];
}

/** Every tier-1 palette name a theme declares (`--bit-palette-red` → `red`), once each, in file order. */
export function paletteNames(css: string): string[] {
  return [...new Set([...css.matchAll(/--bit-palette-([a-z0-9-]+)\s*:/g)].map((match) => match[1]!))];
}

/** Runtime dependencies in a package.json: the keys of `dependencies`, which bit leaves out entirely. */
export function runtimeDependencies(pkg: object): string[] {
  return Object.keys((pkg as { dependencies?: Record<string, string> }).dependencies ?? {});
}

/**
 * What the Architecture page states as fact, each read from its source so the page can't drift: the manifests
 * (one per component), the package's own package.json, the theme file the gallery loads, and the token list.
 * `architecture.test.ts` checks each against the files the docs name.
 */
export const ARCHITECTURE_FACTS = {
  components: COMPONENT_COUNT,
  packageName: bitPackage.name,
  version: bitPackage.version,
  runtimeDependencies: runtimeDependencies(bitPackage).length,
  layers: parseLayerOrder(THEME_CSS),
  paletteColors: paletteNames(THEME_CSS).length,
  tokens: CURRENT_TOKENS.length,
} as const;
