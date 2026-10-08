import { describe, expect, it } from 'vitest';
import { block, readCss } from '../css';

describe('components/icon-button.css', () => {
  const css = readCss('components/icon-button.css');

  it('is square: as wide as the control is tall, no padding', () => {
    const body = block(css, '.bit-iconButton')!;
    expect(body).toContain('width: var(--_bit-size-height);');
    expect(body).toContain('padding: 0;');
  });

  it.each([['sm', '16px'], ['md', '20px'], ['lg', '24px']])('the icon follows the button size class .bit-%s (prop or className): %s', (size, px) => {
    const body = block(css, `.bit-iconButton.bit-${size} > .bit-icon`)!;
    expect(body).toContain(`--_bit-icon-size: ${px};`);
  });

  it('orders sm, md, lg so the larger class wins when both are present', () => {
    const at = (size: string) => css.indexOf(`.bit-iconButton.bit-${size} > .bit-icon`);
    expect(at('sm')).toBeLessThan(at('md'));
    expect(at('md')).toBeLessThan(at('lg'));
  });

  it('index.css imports it after button.css, so its padding wins', () => {
    const index = readCss('index.css');
    const button = index.indexOf('components/button.css');
    const iconButton = index.indexOf('components/icon-button.css');
    expect(button).toBeGreaterThanOrEqual(0);
    expect(iconButton).toBeGreaterThan(button);
  });
});
