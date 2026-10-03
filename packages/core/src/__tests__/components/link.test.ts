import { describe, it, expect } from 'vitest';
import { block, readCss } from '../css';

describe('components/link.css', () => {
  const css = readCss('components/link.css');

  it('is bold with a 2px underline 3px below the text', () => {
    const root = block(css, '.bit-link')!;
    expect(root).toContain('font-weight: var(--bit-weight-bold);');
    expect(root).toContain('text-decoration: underline 2px;');
    expect(root).toContain('text-underline-offset: 3px;');
  });

  it('primary reads the link token, and the visited token once visited', () => {
    expect(block(css, '.bit-link.bit-primary')).toContain('color: var(--bit-color-link);');
    expect(block(css, '.bit-link.bit-primary:visited')).toContain('color: var(--bit-color-link-visited);');
  });

  it('neutral is body text, visited or not', () => {
    expect(block(css, '.bit-link.bit-neutral,\n.bit-link.bit-neutral:visited')).toContain('color: var(--bit-color-text);');
  });

  it('hover thickens the underline to 3px over a soft highlight in the link color', () => {
    expect(block(css, '.bit-link:hover')).toContain('text-decoration-thickness: 3px;');
    expect(block(css, '.bit-link.bit-primary:hover')).toContain('background: var(--bit-color-primary-soft);');
    expect(block(css, '.bit-link.bit-neutral:hover')).toContain('background: var(--bit-color-neutral-soft);');
  });
});
