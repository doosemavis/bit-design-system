import { describe, it, expect } from 'vitest';
import { readCss, resolveVar, themeModes } from './css';

/**
 * Dark mode must not change the light theme, except for three owner-approved changes: the violet
 * 2px focus ring with a 2px gap, no gloss, and no yellow band. Frozen 2026-10-03 from power-up
 * after PR1. Never edit a row to make a test pass; a failing row means light really changed.
 */
const FROZEN_LIGHT: readonly (readonly [token: string, value: string])[] = [
  ['--bit-color-bg', '#EEEFE9'],
  ['--bit-color-surface', '#FFFFFF'],
  ['--bit-color-ink', '#151515'],
  ['--bit-color-text', '#151515'],
  ['--bit-color-text-muted', '#4A4A5E'],
  ['--bit-color-selection', '#FFC800'],
  ['--bit-color-line', '#151515'],
  ['--bit-color-shadow', '#151515'],
  ['--bit-color-primary', '#7C3AED'], ['--bit-color-primary-contrast', '#FFFFFF'], ['--bit-color-primary-hover', '#6527D4'], ['--bit-color-primary-soft', '#EBE1FD'],
  ['--bit-color-neutral', '#FFFFFF'], ['--bit-color-neutral-contrast', '#151515'], ['--bit-color-neutral-hover', '#E5E7E0'], ['--bit-color-neutral-soft', '#DCDED6'],
  ['--bit-color-success', '#1FA34A'], ['--bit-color-success-contrast', '#151515'], ['--bit-color-success-hover', '#19943F'], ['--bit-color-success-soft', '#D3F1DD'],
  ['--bit-color-warning', '#FFC800'], ['--bit-color-warning-contrast', '#151515'], ['--bit-color-warning-hover', '#F0B400'], ['--bit-color-warning-soft', '#FFF1B8'],
  ['--bit-color-danger', '#D91A1A'], ['--bit-color-danger-contrast', '#FFFFFF'], ['--bit-color-danger-hover', '#B81414'], ['--bit-color-danger-soft', '#FBD5D5'],
  ['--bit-code-bg', '#151515'],
];

const { light } = themeModes(readCss('themes/power-up.css'));

describe('light theme is frozen apart from the approved focus and gloss changes', () => {
  it.each(FROZEN_LIGHT)('%s is still %s', (token, value) => {
    expect(resolveVar(light, token)).toBe(value);
  });

  it('shadows keep their offsets and are drawn in the shadow color', () => {
    expect(light.get('--bit-shadow-sm')).toBe('2px 2px 0 var(--bit-color-shadow)');
    expect(light.get('--bit-shadow-md')).toBe('4px 4px 0 var(--bit-color-shadow)');
    expect(light.get('--bit-shadow-lg')).toBe('6px 6px 0 var(--bit-color-shadow)');
  });

  it('the approved change: a violet 2px ring with a 2px gap', () => {
    expect(resolveVar(light, '--bit-focus-ring-color')).toBe('#7C3AED');
    expect(light.get('--bit-focus-ring-width')).toBe('2px');
    expect(light.get('--bit-focus-ring-offset')).toBe('2px');
  });

  it('the approved change: no gloss and no focus band', () => {
    expect(light.has('--bit-gloss')).toBe(false);
    expect(light.has('--bit-focus-band')).toBe(false);
  });
});
