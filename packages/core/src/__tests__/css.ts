import { readFileSync, readdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const srcDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/** Read a file under packages/core/src by relative path. */
export function readCss(relativeToSrc: string): string {
  return readFileSync(resolve(srcDir, relativeToSrc), 'utf8');
}

/** List file names in a directory under packages/core/src (empty array if it does not exist). */
export function listCss(relativeDir: string): string[] {
  try {
    return readdirSync(resolve(srcDir, relativeDir)).filter((f) => f.endsWith('.css')).sort();
  } catch {
    return [];
  }
}

/** Collect every `--name: value;` declaration in a CSS string. Later declarations win. */
export function parseCustomProps(css: string): Map<string, string> {
  const map = new Map<string, string>();
  const re = /(--[a-zA-Z0-9_-]+)\s*:\s*([^;]+);/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(css)) !== null) {
    map.set(match[1]!, match[2]!.trim());
  }
  return map;
}

/** Follow `var(--x)` references until a literal value is reached. */
export function resolveVar(map: Map<string, string>, name: string, depth = 0): string {
  if (depth > 10) throw new Error(`Circular var() chain at ${name}`);
  const value = map.get(name);
  if (value === undefined) throw new Error(`Token ${name} is not declared`);
  const ref = /^var\((--[a-zA-Z0-9_-]+)\)$/.exec(value);
  return ref ? resolveVar(map, ref[1]!, depth + 1) : value;
}

function channel(hex: string): number {
  const c = parseInt(hex, 16) / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

/** Relative luminance of a `#rrggbb` color per WCAG 2.x. */
export function luminance(hex: string): number {
  const m = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex.trim());
  if (!m) throw new Error(`Expected #rrggbb, got "${hex}"`);
  return 0.2126 * channel(m[1]!) + 0.7152 * channel(m[2]!) + 0.0722 * channel(m[3]!);
}

/** WCAG contrast ratio between two `#rrggbb` colors (1 to 21). */
export function contrastRatio(hexA: string, hexB: string): number {
  const [hi, lo] = [luminance(hexA), luminance(hexB)].sort((a, b) => b - a) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

/** A selector that turns dark mode on: the `bit-dark` class or `[data-mode="dark"]`. */
const DARK_SELECTOR = /\[data-mode="dark"\]|\.bit-dark\b/;
/** A selector that also applies outside dark mode: the root, a light or system mode, or a theme on its own. */
const NOT_ONLY_DARK = /:root|\[data-mode="(light|system)"\]|\.bit-light\b/;

/** True for a rule that applies only in dark mode: every selector in its list turns dark on, and none is shared. */
function isDarkRule(selector: string): boolean {
  return splitSelectors(selector).every((s) => DARK_SELECTOR.test(s) && !NOT_ONLY_DARK.test(s));
}

/**
 * Split a theme file into its light (default) declarations and its dark-mode overrides. The dark overrides are
 * the top-level rules (outside any `@media`) whose every selector turns dark mode on (`.bit-dark`,
 * `[data-mode="dark"]`), alone or inside a theme scope; light is every other top-level rule. Rules inside
 * `@layer` blocks count as top-level; rules inside `@media` (the system-on-a-dark-OS copy) count as neither.
 * `dark` is empty when there is no dark rule.
 */
export function themeModes(css: string): { light: Map<string, string>; dark: Map<string, string> } {
  const rules = styleRules(css).filter((rule) => rule.media === null);
  const props = (bodies: CssRule[]) => parseCustomProps(bodies.map((rule) => rule.body).join('\n'));
  return {
    light: props(rules.filter((rule) => !isDarkRule(rule.selector))),
    dark: props(rules.filter((rule) => isDarkRule(rule.selector))),
  };
}

/** Return the body of the first `selector { ... }` block, or null. */
export function block(css: string, selector: string): string | null {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const m = new RegExp(`${escaped}\\s*\\{([^}]*)\\}`).exec(css);
  return m ? m[1]! : null;
}

/** A selector list split at its top-level commas (a comma inside `:is(…)` or `:not(…)` stays), each one trimmed. */
function splitSelectors(list: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < list.length; i++) {
    if (list[i] === '(') depth++;
    else if (list[i] === ')') depth--;
    else if (list[i] === ',' && depth === 0) {
      parts.push(list.slice(start, i).trim());
      start = i + 1;
    }
  }
  return [...parts, list.slice(start).trim()];
}

/**
 * The declarations that apply to `selector` from top-level rules (outside any at-rule): every rule whose
 * selector list includes it, alone or grouped with others, joined in source order. Null when none does.
 */
export function rulesFor(css: string, selector: string): string | null {
  const wanted = selector.replace(/\s+/g, ' ');
  const bodies = styleRules(css)
    .filter((rule) => rule.media === null && splitSelectors(rule.selector).includes(wanted))
    .map((rule) => rule.body);
  return bodies.length === 0 ? null : bodies.join('\n');
}

/** Return the value of `prop` in a block body (not a prefixed or longer property), or null. */
export function decl(body: string, prop: string): string | null {
  const m = new RegExp(`(?<![-\\w])${prop}\\s*:\\s*([^;]+);`).exec(body);
  return m ? m[1]!.trim() : null;
}

/** The CSS with each listed `selector { ... }` block removed. Selectors must match the file's text exactly. */
export function withoutBlocks(css: string, selectors: readonly string[]): string {
  return selectors.reduce((rest, selector) => {
    const body = block(rest, selector);
    return body === null ? rest : rest.replace(`${selector} {${body}}`, '');
  }, css);
}

/**
 * The visually hidden pattern (PR2 spec §1): gone from sight and layout, still read and focusable.
 * Every component that hides a native input or a status line declares exactly these.
 */
export const VISUALLY_HIDDEN: readonly string[] = [
  'position: absolute;',
  'width: 1px;',
  'height: 1px;',
  'margin: -1px;',
  'padding: 0;',
  'overflow: hidden;',
  'clip-path: inset(50%);',
  'white-space: nowrap;',
  'border: 0;',
];

/** Matches any outline declaration, longhands included (outline-offset is allowed). */
export const OUTLINE_DECLARATION = /(^|[;{])\s*outline(-(color|style|width))?\s*:/m;

/** One style rule: its selector text, its body, the `@media` prelude it sits in (null at top level), and its `@layer`. */
interface CssRule {
  selector: string;
  body: string;
  media: string | null;
  /** The `@layer` block it sits in (`bit.tokens`), or null when it is in none. */
  layer: string | null;
}

/**
 * Every style rule in a CSS string, with comments removed. Rules inside an `@media` block carry its
 * prelude (e.g. `(prefers-color-scheme: dark)`); rules inside an `@layer` block carry the layer's name and
 * otherwise count as top-level. Enough for this repo's flat CSS: `@layer` and `@media` blocks, no nested
 * rules inside style rules.
 */
export function styleRules(css: string, media: string | null = null, layer: string | null = null): CssRule[] {
  const source = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const found: CssRule[] = [];
  let i = 0;
  while (i < source.length) {
    const open = source.indexOf('{', i);
    if (open === -1) break;
    // Drop any at-statement (`@import …;`) that runs into the prelude.
    const prelude = source.slice(i, open).split(';').pop()!.trim();
    let depth = 1;
    let close = open + 1;
    for (; close < source.length && depth > 0; close++) {
      if (source[close] === '{') depth++;
      else if (source[close] === '}') depth--;
    }
    const inner = source.slice(open + 1, close - 1);
    const at = /^@media\s+(.*)$/s.exec(prelude);
    const inLayer = /^@layer\s+([\w.-]+)$/.exec(prelude);
    if (at) found.push(...styleRules(inner, at[1]!.trim(), layer));
    else if (inLayer) found.push(...styleRules(inner, media, inLayer[1]!));
    else if (!prelude.startsWith('@')) found.push({ selector: prelude.replace(/\s+/g, ' '), body: inner.trim(), media, layer });
    i = close;
  }
  return found;
}
