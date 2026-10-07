import { describe, expect, it } from 'vitest';
import { select, optionCount } from './select';
import { staticProps } from '../engine/staticProps';
import { buildProps } from '../engine/buildProps';
import { defaultState } from '../engine/state';
import { toJsx } from '../code/toJsx';
import type { ControlState } from './types';

const listed = (raw: string) => (staticProps(select, { optionCount: raw }).options as readonly unknown[]).length;

describe('Select page: the options control', () => {
  it('lists as many options as it says, from 1 to 20', () => {
    expect(listed('1')).toBe(1);
    expect(listed('5')).toBe(5);
    expect(listed('12')).toBe(12);
    expect(listed('20')).toBe(20);
  });

  it('clamps out-of-range values, floors fractions, and uses 5 for anything that is not a number', () => {
    expect(listed('0')).toBe(1);
    expect(listed('-3')).toBe(1);
    expect(listed('99')).toBe(20);
    expect(listed('7.9')).toBe(7);
    expect(listed('')).toBe(5);
    expect(listed('  ')).toBe(5);
    expect(listed('abc')).toBe(5);
    expect(optionCount(undefined)).toBe(5);
  });

  it('starts with the five colours, then fruit, values lowercase', () => {
    expect(staticProps(select, { optionCount: '7' }).options).toEqual([
      { value: 'primary', label: 'Primary' },
      { value: 'neutral', label: 'Neutral' },
      { value: 'success', label: 'Success' },
      { value: 'warning', label: 'Warning' },
      { value: 'danger', label: 'Danger' },
      { value: 'apple', label: 'Apple' },
      { value: 'banana', label: 'Banana' },
    ]);
  });

  it('is never passed to Select nor printed', () => {
    const state: ControlState = { ...defaultState(select), optionCount: '12' };
    expect(buildProps(select, state)).not.toHaveProperty('optionCount');
    expect(toJsx(select, state)).not.toContain('optionCount');
  });
});

describe('Select page: multiple and presets', () => {
  it('multiple prints as a bare prop and is passed through', () => {
    const state: ControlState = { ...defaultState(select), multiple: true };
    expect(buildProps(select, state).multiple).toBe(true);
    expect(toJsx(select, state)).toContain('<Select multiple aria-label="Color" placeholder="Pick colors" options={options} />');
  });

  it('offers Long list and Multi-select presets', () => {
    const presets = Object.fromEntries((select.presets ?? []).map((p) => [p.label, p.state]));
    expect(presets['Long list']).toEqual({ optionCount: '12' });
    expect(presets['Multi-select']).toEqual({ multiple: true, optionCount: '12' });
  });
});
