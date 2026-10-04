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

  it('inside a solid Alert, every Link takes the Alert text colour, visited or not (Q1-A)', () => {
    const body = block(css, '.bit-alert.bit-solid .bit-link,\n.bit-alert.bit-solid .bit-link:visited');
    expect(body).toContain('color: inherit;');
  });

  it('inside a solid Alert, hover is a 4px underline with no highlight', () => {
    const body = block(css, '.bit-alert.bit-solid .bit-link:hover')!;
    expect(body).toContain('background: none;');
    expect(body).toContain('text-decoration-thickness: 4px;');
  });

  it('the solid-Alert rules come after the colour rules, so they win at equal or higher specificity', () => {
    expect(css.indexOf('.bit-alert.bit-solid .bit-link')).toBeGreaterThan(css.indexOf('.bit-link.bit-neutral:hover'));
  });

  it('in dark mode the hover underline turns the accent (Q3b-A)', () => {
    expect(block(css, '[data-mode="dark"] .bit-link:hover')).toContain('text-decoration-color: var(--bit-color-accent);');
  });

  it('inside a solid Alert the hover underline is currentColor (the Alert text) and overrides dark accent (Q1-A fix)', () => {
    const solidAlert = block(css, '.bit-alert.bit-solid .bit-link:hover')!;
    expect(solidAlert).toContain('text-decoration-color: currentColor;');
    // Specificity: .bit-alert.bit-solid .bit-link:hover (0,4,0) > [data-mode="dark"] .bit-link:hover (0,3,0)
    // so the solid-Alert rule wins even though it comes before the dark accent rule
    expect(css).toContain('.bit-alert.bit-solid .bit-link:hover');
    expect(css).toContain('[data-mode="dark"] .bit-link:hover');
  });
});
