import { describe, expect, it } from 'vitest';
import { block, readCss, styleRules } from '../css';

describe('components/tooltip.css', () => {
  const css = readCss('components/tooltip.css');

  it('the bubble: inverse ink, 13px bold, 5px 8px padding', () => {
    const body = block(css, '.bit-tooltip')!;
    expect(body).toContain('background: var(--bit-color-text);');
    expect(body).toContain('color: var(--bit-color-bg);');
    expect(body).toContain('font-size: var(--bit-text-13px);');
    expect(body).toContain('font-weight: var(--bit-weight-bold);');
    expect(body).toContain('padding: 5px 8px;');
  });

  it('the pointer is 14px wide and 8px tall', () => {
    const body = block(css, '.bit-tooltip::after')!;
    expect(body).toContain('width: 14px;');
    expect(body).toContain('height: 8px;');
  });

  it('reduced motion turns the transition off', () => {
    const rule = styleRules(css).find((r) => r.media?.includes('prefers-reduced-motion') && r.selector === '.bit-tooltip');
    expect(rule?.body).toContain('transition: none;');
  });

  it('forced colours draw the border and pointer in CanvasText', () => {
    const rules = styleRules(css).filter((r) => r.media?.includes('forced-colors'));
    expect(rules.length).toBeGreaterThan(0);
    expect(rules.map((r) => r.body).join('\n')).toContain('CanvasText');
  });
});
