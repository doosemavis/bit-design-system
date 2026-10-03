import { describe, it, expect } from 'vitest';
import { SPACE_STEPS, TEXT_SIZES } from '../tokens';
import { parseCustomProps, readCss, resolveVar } from './css';

/**
 * D13 regression contract: the px rename changes names, never rendered sizes.
 * Frozen 2026-10-03 from power-up's values before the rename. Never edit a row to make a test pass;
 * a failing row means a size really changed.
 */
const FROZEN: readonly (readonly [oldName: string, newName: string, px: string])[] = [
  ['--bit-space-1', '--bit-space-4px', '4px'],
  ['--bit-space-2', '--bit-space-8px', '8px'],
  ['--bit-space-3', '--bit-space-12px', '12px'],
  ['--bit-space-4', '--bit-space-16px', '16px'],
  ['--bit-space-5', '--bit-space-24px', '24px'],
  ['--bit-space-6', '--bit-space-32px', '32px'],
  ['--bit-space-7', '--bit-space-48px', '48px'],
  ['--bit-space-8', '--bit-space-64px', '64px'],
  ['--bit-radius-sm', '--bit-radius-6px', '6px'],
  ['--bit-radius-md', '--bit-radius-10px', '10px'],
  ['--bit-radius-lg', '--bit-radius-14px', '14px'],
  ['--bit-text-xs', '--bit-text-11px', '11px'],
  ['--bit-text-sm', '--bit-text-13px', '13px'],
  ['--bit-text-md', '--bit-text-15px', '15px'],
  ['--bit-text-lg', '--bit-text-18px', '18px'],
  ['--bit-text-xl', '--bit-text-24px', '24px'],
  ['--bit-text-2xl', '--bit-text-32px', '32px'],
];

const theme = parseCustomProps(readCss('themes/power-up.css'));

describe('px rename (D13 frozen table)', () => {
  it.each(FROZEN)('%s → %s still renders %s in power-up', (_old, newName, px) => {
    expect(resolveVar(theme, newName)).toBe(px);
  });

  it.each(FROZEN)('%s is no longer declared', (oldName) => {
    expect(theme.has(oldName)).toBe(false);
  });

  it.each(SPACE_STEPS)('stack.css maps data-gap="%i" to its px space token', (n) => {
    expect(readCss('components/stack.css')).toContain(`.bit-stack[data-gap="${n}"] { gap: var(--bit-space-${n}px); }`);
  });

  it.each(TEXT_SIZES)('text.css maps data-size="%i" to its px text token', (n) => {
    expect(readCss('components/text.css')).toContain(`.bit-text[data-size="${n}"] { font-size: var(--bit-text-${n}px); }`);
  });

  it('Text with no size renders 15px, the old md', () => {
    expect(readCss('components/text.css')).toMatch(/\.bit-text \{[^}]*font-size: var\(--bit-text-15px\);/);
  });
});
