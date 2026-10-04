// @vitest-environment node

import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

describe('index.html', () => {
  it('defaults to the visitor\'s system setting with data-mode="system"', () => {
    expect(html).toMatch(/<html [^>]*\bdata-mode="system"[^>]*>/);
  });

  it('inlines the readable saved-choice snippet, not the minified script', () => {
    expect(html).toContain("const saved = localStorage.getItem('bit-color-mode');");
    expect(html).toContain("if (saved === 'light' || saved === 'dark') document.documentElement.dataset.mode = saved;");
    expect(html).not.toContain('matchMedia');
  });

  it('survives blocked storage: the read sits in a try, and an empty catch keeps the HTML data-mode', () => {
    expect(html).toMatch(/try \{\s*const saved = localStorage\.getItem/);
    expect(html).toContain('} catch {} // storage blocked: the data-mode in your HTML stands');
  });

  it('is the same snippet the Getting started page shows', () => {
    const page = readFileSync(new URL('./pages/GettingStartedPage.tsx', import.meta.url), 'utf8');
    const shown = /const SAVED_CHOICE_EXAMPLE = `([^`]*)`/.exec(page)![1]!;
    const inline = /\n( *)<script>\n[\s\S]*?<\/script>/.exec(html)!;
    const indent = new RegExp(`^${inline[1]}`, 'gm');
    expect(inline[0].slice(1).replace(indent, '')).toBe(shown);
  });

  it('runs the saved-choice snippet before the app (and its CSS) loads', () => {
    expect(html.indexOf("localStorage.getItem('bit-color-mode')")).toBeLessThan(html.indexOf('/src/main.tsx'));
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
