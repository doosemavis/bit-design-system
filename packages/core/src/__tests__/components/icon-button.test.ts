import { describe, expect, it } from 'vitest';
import { block, readCss } from '../css';

describe('components/icon-button.css', () => {
  const css = readCss('components/icon-button.css');

  it('is square: as wide as the control is tall, no padding', () => {
    const body = block(css, '.bit-iconButton')!;
    expect(body).toContain('width: var(--_bit-size-height);');
    expect(body).toContain('padding: 0;');
  });

  it('index.css imports it after button.css, so its padding wins', () => {
    const index = readCss('index.css');
    const button = index.indexOf('components/button.css');
    const iconButton = index.indexOf('components/icon-button.css');
    expect(button).toBeGreaterThanOrEqual(0);
    expect(iconButton).toBeGreaterThan(button);
  });
});
