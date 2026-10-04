import { describe, it, expect } from 'vitest';
import { readCss, parseCustomProps, themeModes } from './css';

const css = readCss('themes/power-up.css');

/** The body of the `@media (prefers-color-scheme: dark) { [data-mode="system"] { ... } }` rule, or null. */
function systemDarkBody(source: string): string | null {
  const m = /@media\s*\(prefers-color-scheme:\s*dark\)\s*\{\s*(\[data-mode="system"\])\s*\{([^}]*)\}\s*\}/.exec(source);
  return m ? m[2]! : null;
}

function darkBody(source: string): string {
  const m = /(^|\n)\[data-mode="dark"\]\s*\{([^}]*)\}/.exec(source);
  return m ? m[2]! : '';
}

function parseCustomPropsAndScheme(body: string): Map<string, string> {
  const map = parseCustomProps(body);
  const scheme = /(?<![-\w])color-scheme\s*:\s*([^;]+);/.exec(body);
  if (scheme) map.set('color-scheme', scheme[1]!.trim());
  return map;
}

/** Property names in a rule body that are not custom properties (`--*`). Comments are ignored. */
function plainProperties(body: string): string[] {
  return body
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split(';')
    .map((declaration) => /^\s*([-\w]+)\s*:/.exec(declaration)?.[1])
    .filter((name): name is string => name !== undefined && !name.startsWith('--'));
}

describe('data-mode="system" follows the OS in CSS', () => {
  it('is in the shared selector list, so any element set to system re-declares the shared tokens', () => {
    const shared = /:root,\s*\[data-theme="power-up"\],([^{]*)\{/.exec(css);
    expect(shared).not.toBeNull();
    expect(shared![1]).toContain('[data-mode="system"]');
  });

  it('has a dark-OS media block scoped to the element selector, not :root or html', () => {
    const body = systemDarkBody(css);
    expect(body).not.toBeNull();
    expect(css).not.toMatch(/@media\s*\(prefers-color-scheme:\s*dark\)\s*\{\s*(:root|html)/);
  });

  it('declares the same properties and values as [data-mode="dark"], including color-scheme', () => {
    const system = parseCustomPropsAndScheme(systemDarkBody(css) ?? '');
    const dark = parseCustomPropsAndScheme(darkBody(css));
    expect(system.size).toBeGreaterThan(0);
    expect(system.get('color-scheme')).toBe('dark');
    expect(Object.fromEntries(system)).toEqual(Object.fromEntries(dark));
  });

  it('neither body declares a plain property other than color-scheme, so parity sees everything', () => {
    expect(plainProperties(systemDarkBody(css) ?? '')).toEqual(['color-scheme']);
    expect(plainProperties(darkBody(css))).toEqual(['color-scheme']);
  });

  it('does not leak dark values into the light theme', () => {
    const { light, dark } = themeModes(css);
    expect(light.get('--bit-color-bg')).not.toBe(dark.get('--bit-color-bg'));
    expect(light.get('--bit-color-text')).toBe('var(--bit-palette-ink)');
  });
});
