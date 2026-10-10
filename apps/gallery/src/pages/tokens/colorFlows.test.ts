// @vitest-environment node
// Node, not jsdom: under jsdom a `?raw` CSS import comes back empty, so the real theme is read from disk here.
import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';
import { SEMANTIC_TOKENS } from '@bit-ds/react';
import { flowTokens, parseColorFlows } from './colorFlows';

const FIXTURE = `
/* a comment with { braces } that must not confuse the parser */
:root,
[data-mode="light"] {
  --bit-palette-plum: #6a1b9a;
  --bit-palette-sand: #F4E4C1;
  --bit-palette-night: #101018;
  --bit-color-bg: var(--bit-palette-sand);
  --bit-color-primary: var(--bit-palette-plum);
  --bit-color-accent: var(--bit-color-primary);
  --bit-color-link: #123456;
  --bit-code-text: var(--bit-palette-plum);
  --bit-shadow-md: 4px 4px 0 var(--bit-color-primary);
  --bit-space-8px: 8px;
}
[data-mode="dark"] {
  --bit-color-bg: var(--bit-palette-night);
}
@media (prefers-color-scheme: dark) {
  [data-mode="system"] {
    --bit-color-bg: var(--bit-palette-plum);
  }
}
`;

describe('parseColorFlows', () => {
  const flows = parseColorFlows(FIXTURE)!;

  it('reads the palette, upper-casing each hex', () => {
    expect(flows.palette).toEqual({ plum: '#6A1B9A', sand: '#F4E4C1', night: '#101018' });
  });

  it('maps each color and code token to the palette entry it reads, following var() chains', () => {
    expect(flows.light).toEqual([
      { from: 'sand', to: '--bit-color-bg' },
      { from: 'plum', to: '--bit-color-primary' },
      { from: 'plum', to: '--bit-color-accent' },
      { from: 'plum', to: '--bit-code-text' },
    ]);
  });

  it('skips tokens set to a raw value, and tokens that are not colors', () => {
    const names = flows.light.map((flow) => flow.to);
    expect(names).not.toContain('--bit-color-link');
    expect(names).not.toContain('--bit-shadow-md');
    expect(names).not.toContain('--bit-space-8px');
  });

  it('dark is light with the [data-mode="dark"] block on top; the system media copy is not read twice', () => {
    expect(flows.dark).toEqual([
      { from: 'night', to: '--bit-color-bg' },
      { from: 'plum', to: '--bit-color-primary' },
      { from: 'plum', to: '--bit-color-accent' },
      { from: 'plum', to: '--bit-code-text' },
    ]);
  });

  it('flowTokens lists every token the flow draws in either mode, once', () => {
    expect([...flowTokens(flows)]).toEqual(['--bit-color-bg', '--bit-color-primary', '--bit-color-accent', '--bit-code-text']);
  });

  it('reads a theme whose rules sit in an @layer block, as the shipped themes do', () => {
    const layered = `@layer bit.reset, bit.tokens, bit.components;\n@layer bit.tokens {\n${FIXTURE}\n}`;
    expect(parseColorFlows(layered)).toEqual(flows);
  });

  it('returns null when there is no theme to read (an empty string, or no light or dark block)', () => {
    expect(parseColorFlows('')).toBeNull();
    expect(parseColorFlows(':root { --bit-palette-a: #000000; }')).toBeNull();
  });
});

describe('parseColorFlows on the power-up theme', () => {
  const css = readFileSync(new URL('../../../../../packages/core/src/themes/power-up.css', import.meta.url), 'utf8');
  const flows = parseColorFlows(css)!;
  const source = (mode: 'light' | 'dark', token: string) => flows[mode].find((flow) => flow.to === token)?.from;

  it('violet feeds the accent by day, coin yellow at night', () => {
    expect(source('light', '--bit-color-accent')).toBe('violet');
    expect(source('dark', '--bit-color-accent')).toBe('yellow');
  });

  it('every flow ends at a public token and starts at a palette color', () => {
    for (const mode of ['light', 'dark'] as const) {
      expect(flows[mode].length).toBeGreaterThan(30);
      expect(flows[mode].filter((flow) => !SEMANTIC_TOKENS.includes(flow.to))).toEqual([]);
      expect(flows[mode].filter((flow) => !(flow.from in flows.palette))).toEqual([]);
    }
  });

  it('light and dark wire the same tokens, so the right-hand column has the same names in both modes', () => {
    const names = (mode: 'light' | 'dark') => flows[mode].map((flow) => flow.to).sort();
    expect(names('dark')).toEqual(names('light'));
  });
});
