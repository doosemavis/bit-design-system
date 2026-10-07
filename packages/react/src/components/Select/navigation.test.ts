import { describe, expect, it } from 'vitest';
import { PAGE_SIZE, firstEnabled, lastEnabled, page, step } from './navigation';

const items = (disabled: readonly number[], length = 5) =>
  Array.from({ length }, (_, i) => ({ disabled: disabled.includes(i) }));

describe('Select navigation', () => {
  it('finds the first and last enabled options', () => {
    expect(firstEnabled(items([0]))).toBe(1);
    expect(lastEnabled(items([4]))).toBe(3);
  });

  it('finds none when every option is disabled, or there are none', () => {
    expect(firstEnabled(items([0, 1, 2, 3, 4]))).toBe(-1);
    expect(lastEnabled([])).toBe(-1);
  });

  it('steps over disabled options', () => {
    expect(step(items([3]), 2, 1)).toBe(4);
    expect(step(items([1]), 2, -1)).toBe(0);
  });

  it('does not wrap: a step past either end stays put', () => {
    expect(step(items([]), 4, 1)).toBe(4);
    expect(step(items([]), 0, -1)).toBe(0);
    expect(step(items([4]), 3, 1)).toBe(3);
  });

  it('pages ten rows, clamped to the ends', () => {
    expect(PAGE_SIZE).toBe(10);
    const long = items([], 30);
    expect(page(long, 0, 1)).toBe(10);
    expect(page(long, 25, 1)).toBe(29);
    expect(page(long, 15, -1)).toBe(5);
    expect(page(long, 4, -1)).toBe(0);
  });

  it('a page that lands on a disabled option backs off toward where it started', () => {
    expect(page(items([10], 30), 0, 1)).toBe(9);
    expect(page(items([0, 1], 30), 5, -1)).toBe(2);
  });

  it('a page with nothing enabled on the way stays put', () => {
    expect(page(items([0, 1, 2, 3, 4]), -1, 1)).toBe(-1);
  });
});
