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

/** A `[data-mode="dark"]` that starts a line and isn't continuing a comma-separated selector list. */
const DARK_RULE = /(?<!,\s*)(^|\n)\[data-mode="dark"\]\s*\{/;

/**
 * Split a theme file into its light (default) declarations and its `[data-mode="dark"]` overrides.
 * The dark block is found with `/(?<!,\s*)(^|\n)\[data-mode="dark"\]\s*\{/`: a `[data-mode="dark"]`
 * that starts a line and isn't continuing a comma-separated selector list. Its declarations run from
 * that match's `{` to the next `}`; light is everything else. `dark` is empty when there is no such rule.
 */
export function themeModes(css: string): { light: Map<string, string>; dark: Map<string, string> } {
  const match = DARK_RULE.exec(css);
  if (!match) return { light: parseCustomProps(css), dark: new Map() };
  const start = match.index;
  const open = start + match[0].length - 1;
  const close = css.indexOf('}', open);
  return {
    light: parseCustomProps(css.slice(0, start) + css.slice(close + 1)),
    dark: parseCustomProps(css.slice(open + 1, close)),
  };
}

/** Return the body of the first `selector { ... }` block, or null. */
export function block(css: string, selector: string): string | null {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const m = new RegExp(`${escaped}\\s*\\{([^}]*)\\}`).exec(css);
  return m ? m[1]! : null;
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
