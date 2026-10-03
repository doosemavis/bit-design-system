import { describe, it, expect } from 'vitest';
import { buildProps } from './buildProps';
import { defaultState } from './state';
import { button } from '../manifests/button';
import { stack } from '../manifests/stack';
import { text } from '../manifests/text';
import { bitLogo } from '../manifests/bitLogo';
import { spinner } from '../manifests/spinner';

describe('buildProps', () => {
  it('passes axes, booleans, and text through and excludes children', () => {
    const props = buildProps(button, { ...defaultState(button), loading: true });
    expect(props).toEqual({ color: 'primary', variant: 'solid', size: 'md', loading: true, disabled: false });
  });

  it('converts numeric selects and number controls to numbers', () => {
    expect(buildProps(stack, { ...defaultState(stack), gap: '32' }).gap).toBe(32);
    expect(buildProps(bitLogo, { ...defaultState(bitLogo), interval: '8', freeze: '32' })).toMatchObject({ interval: 8, freeze: 32 });
  });

  it('drops the default and none sentinels so the component sees an omitted prop', () => {
    expect('color' in buildProps(text, defaultState(text))).toBe(false);
    expect(buildProps(text, { ...defaultState(text), color: 'neutral' }).color).toBe('neutral');
    expect('freeze' in buildProps(bitLogo, defaultState(bitLogo))).toBe(false);
  });

  it('keeps aria-label as a prop name', () => {
    expect(buildProps(spinner, defaultState(spinner))['aria-label']).toBe('Loading coins');
  });
});
