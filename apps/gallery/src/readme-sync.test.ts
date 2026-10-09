// @vitest-environment node
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { GLOBAL_CSS_IMPORTS, INSTALL_COMMANDS, STYLE_IMPORTS } from './content/snippets.mjs';

const readme = readFileSync(new URL('../../../README.md', import.meta.url), 'utf8');

describe('README stays in sync with the snippets the gallery and smoke test use', () => {
  it.each(Object.entries(INSTALL_COMMANDS))('has the %s install command', (_, command) => expect(readme).toContain(command));
  it('has the style imports, theme first, verbatim', () => expect(readme).toContain(STYLE_IMPORTS));
  it('has the global stylesheet option, verbatim', () => expect(readme).toContain(GLOBAL_CSS_IMPORTS));
  it('no longer says the package is unpublished', () => expect(readme).not.toMatch(/Until then|Once published|workspace-private/i));
  it('every section the contents list links to exists, and has a ↑ Contents link right under its heading', () => {
    const BACK = '<p align="right"><sub><a href="#contents">↑ Contents</a></sub></p>';
    // GitHub's (and npm's) heading anchors: lowercase, punctuation dropped, spaces to hyphens.
    const slug = (heading: string) => heading.toLowerCase().replace(/[^\w\- ]/g, '').replaceAll(' ', '-');
    const contents = readme.slice(readme.indexOf('## Contents'), readme.indexOf('\n## ', readme.indexOf('## Contents') + 1));
    const targets = [...contents.matchAll(/\]\(#([^)]+)\)/g)].map((m) => m[1]);
    const lineAfter = new Map([...readme.matchAll(/^#{2,3} (.+)\n\n(.*)$/gm)].map((m) => [slug(m[1]!), m[2]]));
    expect(targets.length).toBeGreaterThan(5);
    for (const target of targets) expect(lineAfter.get(target!), target).toBe(BACK);
  });
  it('links the live docs and documents announce() and useCopyToClipboard()', () => {
    expect(readme).toContain('https://doosemavis.github.io/bit-design-system/');
    expect(readme).toMatch(/announce\(/);
    expect(readme).toMatch(/useCopyToClipboard\(/);
  });
});
