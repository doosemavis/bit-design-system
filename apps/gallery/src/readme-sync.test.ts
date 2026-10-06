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
  it('links the live docs and documents announce() and useCopyToClipboard()', () => {
    expect(readme).toContain('https://doosemavis.github.io/bit-design-system/');
    expect(readme).toMatch(/announce\(/);
    expect(readme).toMatch(/useCopyToClipboard\(/);
  });
});
