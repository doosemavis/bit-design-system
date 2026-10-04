import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

/** The theme the gallery ships, read from the package so expected values never drift from the CSS. */
const THEME_PATH = require.resolve('@bit-ds/react/themes/power-up.css');

/** Every `--name: value;` declaration in a rule body. */
function customProps(body: string): Map<string, string> {
  return new Map([...body.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)].map((m) => [m[1]!, m[2]!.trim()]));
}

/** Follow `var(--x)` references until a literal value is reached. */
function resolveVar(map: ReadonlyMap<string, string>, name: string, depth = 0): string {
  const value = map.get(name);
  if (value === undefined || depth > 10) throw new Error(`Cannot resolve ${name} in ${THEME_PATH}`);
  const ref = /^var\((--[\w-]+)\)$/.exec(value);
  return ref ? resolveVar(map, ref[1]!, depth + 1) : value;
}

function ruleBody(css: string, pattern: RegExp, what: string): string {
  const m = pattern.exec(css);
  if (!m) throw new Error(`No ${what} rule in ${THEME_PATH}`);
  return m[1]!;
}

/** A token's literal value in light mode (the shared block) and dark mode (the shared block plus `[data-mode="dark"]`). */
export function themeValue(name: string): { light: string; dark: string } {
  const css = readFileSync(THEME_PATH, 'utf8');
  const shared = customProps(ruleBody(css, /:root,[^{]*\{([^}]*)\}/, 'shared :root'));
  const darkOnly = customProps(ruleBody(css, /(?:^|\n)\[data-mode="dark"\]\s*\{([^}]*)\}/, '[data-mode="dark"]'));
  const dark = new Map([...shared, ...darkOnly]);
  return { light: resolveVar(shared, name), dark: resolveVar(dark, name) };
}
