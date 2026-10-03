// @vitest-environment node
// Node, not jsdom: under jsdom, Vite rewrites `new URL(..., import.meta.url)` to an http: URL readFileSync rejects.
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { describe, it, expect } from 'vitest';

const require = createRequire(import.meta.url);
/** The theme exactly as consumers get it, through @bit-ds/react's exports map (run `pnpm build` first). */
const theme = readFileSync(require.resolve('@bit-ds/react/themes/power-up.css'), 'utf8');
const galleryCss = readFileSync(new URL('./gallery.css', import.meta.url), 'utf8');

const declared = new Set([...theme.matchAll(/(--bit-[a-zA-Z0-9-]+)\s*:/g)].map((m) => m[1]!));
const reads = [...galleryCss.matchAll(/var\((--bit-[a-zA-Z0-9-]+)/g)].map((m) => m[1]!);

describe('gallery.css', () => {
  it('reads only tokens the theme declares (a browser would silently ignore a renamed one)', () => {
    expect(reads.filter((name) => !declared.has(name))).toEqual([]);
  });

  it('never reads tier-1 palette values', () => {
    expect(reads.filter((name) => name.startsWith('--bit-palette-'))).toEqual([]);
  });

  it('code panels use the Ink-night code tokens and the mono font in both modes', () => {
    const rule = /\.gallery-pre\s*\{([^}]*)\}/.exec(galleryCss)?.[1] ?? '';
    expect(rule).toContain('background: var(--bit-code-bg);');
    expect(rule).toContain('color: var(--bit-code-text);');
    expect(rule).toContain('font-family: var(--bit-font-mono);');
  });

  it('code panels use the regular mono weight (JetBrains Mono ships 400 and 700)', () => {
    const rule = /\.gallery-pre\s*\{([^}]*)\}/.exec(galleryCss)?.[1] ?? '';
    expect(rule).toContain('font-weight: 400;');
  });

  it('code inside a panel inherits the panel font, not the browser monospace default', () => {
    expect(galleryCss).toMatch(/\.gallery-pre code\s*\{[^}]*font: inherit;/);
  });
});
