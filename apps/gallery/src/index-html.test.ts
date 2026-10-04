// @vitest-environment node

import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';
import { COLOR_MODE_SCRIPT } from '@bit-ds/react';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

describe('index.html', () => {
  it('inlines the exact COLOR_MODE_SCRIPT, so a dark visitor never sees a light flash', () => {
    expect(html).toContain(`<script>${COLOR_MODE_SCRIPT}</script>`);
  });

  it('runs the mode script before the app (and its CSS) loads', () => {
    expect(html.indexOf(COLOR_MODE_SCRIPT)).toBeLessThan(html.indexOf('/src/main.tsx'));
  });

  // version-banner.js (injected into frozen copies) skips any build that has its own picker. The
  // attribute is static so the banner never races the app's mount.
  it('marks <html> as having its own version picker', () => {
    expect(html).toMatch(/<html [^>]*\bdata-bit-version-picker\b[^>]*>/);
  });

  it('tells the browser both color schemes are supported', () => {
    expect(html).toContain('<meta name="color-scheme" content="light dark" />');
  });
});
