import { describe, it, expect } from 'vitest';
import { block, decl, readCss } from '../css';

describe('components/text.css: style and decoration', () => {
  const css = readCss('components/text.css');

  it('data-italic sets the italic style (Nunito ships its own italic, so body sizes are never slanted by the browser)', () => {
    expect(decl(block(css, '.bit-text[data-italic]')!, 'font-style')).toBe('italic');
    expect(readCss('themes/power-up.css')).toMatch(/font-family: "Nunito";\s*font-style: italic;/);
  });

  it('data-underline draws a line thinner than Link, so underlined text does not read as a link', () => {
    const body = block(css, '.bit-text[data-underline]')!;
    expect(decl(body, 'text-decoration-line')).toBe('underline');
    expect(decl(body, 'text-decoration-thickness')).toBe('max(1px, 0.06em)');
    expect(decl(body, 'text-underline-offset')).toBe('0.15em');
    expect(readCss('components/link.css')).toContain('text-decoration: underline 2px;');
  });

  it('data-strikethrough draws a line through', () => {
    const body = block(css, '.bit-text[data-strikethrough]')!;
    expect(decl(body, 'text-decoration-line')).toBe('line-through');
    expect(decl(body, 'text-decoration-thickness')).toBe('max(1px, 0.06em)');
  });

  it('underline and strikethrough together draw both lines', () => {
    expect(decl(block(css, '.bit-text[data-underline][data-strikethrough]')!, 'text-decoration-line')).toBe('underline line-through');
  });

  it('the display sizes leave font-style alone, so italic still applies there', () => {
    const display = /\.bit-text\[data-size="24"\],\s*\.bit-text\[data-size="32"\],\s*\.bit-text\[data-size="40"\]\s*\{([^}]*)\}/.exec(css)?.[1];
    expect(display).toBeDefined();
    expect(decl(display!, 'font-style')).toBeNull();
  });
});
