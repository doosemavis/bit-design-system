import { describe, expect, it } from 'vitest';
import { block, decl, readCss } from '../css';

describe('components/avatar.css', () => {
  const css = readCss('components/avatar.css');
  const root = block(css, '.bit-avatar')!;

  it('is square at the control height of its size, so it lines up with a Button', () => {
    expect(decl(root, 'width')).toBe('var(--_bit-size-height)');
    expect(decl(root, 'height')).toBe('var(--_bit-size-height)');
    expect(decl(root, 'font-size')).toBe('var(--_bit-size-text)');
  });

  it('fills with its color, initials in the contrast color, on a line border and the small hard shadow', () => {
    expect(decl(root, 'background')).toBe('var(--_bit-color)');
    expect(decl(root, 'color')).toBe('var(--_bit-color-contrast)');
    expect(decl(root, 'border')).toBe('2px solid var(--bit-color-line)');
    expect(decl(root, 'box-shadow')).toBe('var(--bit-shadow-sm)');
    expect(decl(root, 'font-weight')).toBe('var(--bit-weight-bold)');
  });

  it('is a circle by default, the 6px radius when square, square corners and the pixel font when pixel', () => {
    expect(decl(root, 'border-radius')).toBe('var(--bit-radius-full)');
    expect(decl(block(css, '.bit-avatar[data-shape="square"]')!, 'border-radius')).toBe('var(--bit-radius-6px)');
    const pixel = block(css, '.bit-avatar[data-shape="pixel"]')!;
    expect(decl(pixel, 'border-radius')).toBe('0');
    expect(decl(pixel, 'border-width')).toBe('var(--bit-border-width)');
    expect(decl(pixel, 'font-family')).toBe('var(--bit-font-pixel)');
  });

  it.each([['sm', '8px'], ['md', '10px'], ['lg', '12px']])('the pixel initials at .bit-%s are %s: the pixel font reads large', (size, px) => {
    expect(decl(block(css, `.bit-avatar[data-shape="pixel"].bit-${size}`)!, 'font-size')).toBe(px);
  });

  it('the photo fills the same cell as the initials and covers them, cropped, not stretched', () => {
    const image = block(css, '.bit-avatar__image')!;
    expect(decl(image, 'grid-area')).toBe('1 / 1');
    expect(decl(block(css, '.bit-avatar__initials')!, 'grid-area')).toBe('1 / 1');
    expect(decl(image, 'object-fit')).toBe('cover');
    expect(decl(image, 'width')).toBe('100%');
    expect(decl(image, 'height')).toBe('100%');
    expect(decl(root, 'overflow')).toBe('hidden');
  });

  it('flat drops the hard shadow', () => {
    expect(decl(block(css, '.bit-avatar.bit-flat')!, 'box-shadow')).toBe('none');
  });
});
