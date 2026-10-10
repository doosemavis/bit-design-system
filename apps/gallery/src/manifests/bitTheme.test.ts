import { describe, expect, it } from 'vitest';
import { bitTheme } from './bitTheme';
import { findManifest } from './index';
import { defaultState } from '../engine/state';
import { toJsx } from '../code/toJsx';

describe('BitTheme page', () => {
  it('is a Components page at /components/bittheme with an Examples section', () => {
    expect(findManifest('bittheme')).toBe(bitTheme);
    expect(bitTheme.group).toBe('components');
    expect(bitTheme.extraSection?.title).toBe('Examples');
  });

  it('the playground offers mode light or dark and the power-up theme, and prints the mode', () => {
    const controls = Object.fromEntries(bitTheme.controls.map((c) => [c.prop, c]));
    expect(controls.mode).toMatchObject({ values: ['none', 'light', 'dark'], default: 'dark' });
    expect(controls.theme).toMatchObject({ values: ['none', 'power-up'] });
    expect(toJsx(bitTheme, defaultState(bitTheme))).toContain('<BitTheme mode="dark">');
    expect(toJsx(bitTheme, { ...defaultState(bitTheme), theme: 'power-up' })).toContain('theme="power-up"');
  });

  it("Usage says where the classes go, and that light and dark are modes, not themes", () => {
    const { do: dos, dont } = bitTheme.docs.usage;
    expect(dos.join(' ')).toContain('class="bit-theme-power-up bit-light"');
    expect(dont.some((line) => line.includes('<body>'))).toBe(true);
    expect(dont.some((line) => line.includes('bit-dark and data-mode="light"'))).toBe(true);
    expect(dont.some((line) => line.includes('power-up is the theme; light and dark are its modes'))).toBe(true);
  });

  it('documents mode, theme, asChild and children', () => {
    expect(bitTheme.docs.props.map((p) => p.name)).toEqual(['mode', 'theme', 'asChild', 'children']);
  });
});
