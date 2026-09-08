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
