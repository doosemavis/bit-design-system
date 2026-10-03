import { afterEach, describe, expect, it, vi } from 'vitest';
import { toClasses, element, withClassName, dataValue } from './toClasses';
import { COLORS, SIZES, VARIANTS } from './axes';

const axes = (color?: string, variant?: string, size?: string) => [
  { name: 'color', allowed: COLORS, value: color },
  { name: 'variant', allowed: VARIANTS, value: variant },
  { name: 'size', allowed: SIZES, value: size },
];

describe('toClasses', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it('emits the block class then one decorator per axis, in axis order', () => {
    expect(toClasses('button', axes('primary', 'solid', 'md'))).toBe('bit-button bit-primary bit-solid bit-md');
  });

  it('appends the caller className last', () => {
    expect(toClasses('button', axes('primary', 'solid', 'md'), 'bit-danger extra')).toBe(
      'bit-button bit-solid bit-md bit-danger extra',
    );
  });

  it('a bit-{value} decorator in className replaces the prop decorator for that axis', () => {
    expect(toClasses('button', axes('primary', 'solid', 'md'), 'bit-danger')).toBe(
      'bit-button bit-solid bit-md bit-danger',
    );
  });

  it('a bit-{value} decorator in a multi-class className replaces the prop decorator for that axis', () => {
    expect(toClasses('button', axes('primary', 'solid', 'lg'), 'bit-sm extra')).toBe(
      'bit-button bit-primary bit-solid bit-sm extra',
    );
  });

  it('skips axes whose value is undefined', () => {
    expect(toClasses('text', axes(undefined, undefined, 'lg'))).toBe('bit-text bit-lg');
  });

  it('drops an unknown value and warns in development', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(toClasses('button', axes('purple', 'solid', 'md'))).toBe('bit-button bit-solid bit-md');
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0]?.[0]).toContain('color="purple"');
    expect(warn.mock.calls[0]?.[0]).toContain('primary | neutral | success | warning | danger');
  });

  it('does not warn in production', () => {
    vi.stubEnv('NODE_ENV', 'production');
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    toClasses('button', axes('purple', 'solid', 'md'));
    expect(warn).not.toHaveBeenCalled();
  });
});

describe('element', () => {
  it('builds a BEM element class', () => {
    expect(element('card', 'header')).toBe('bit-card__header');
  });
});

describe('withClassName', () => {
  it('appends the caller className to a base class', () => {
    expect(withClassName('bit-card__header', 'extra')).toBe('bit-card__header extra');
    expect(withClassName('bit-card__header')).toBe('bit-card__header');
  });
});

describe('dataValue', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it('returns an allowed value as a string', () => {
    expect(dataValue('stack', { name: 'gap', allowed: [4, 8], value: 8 })).toBe('8');
    expect(dataValue('badge', { name: 'shape', allowed: ['pill', 'square'], value: 'square' })).toBe('square');
  });

  it('returns undefined without warning when no value is given', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(dataValue('stack', { name: 'gap', allowed: [4, 8], value: undefined })).toBeUndefined();
    expect(warn).not.toHaveBeenCalled();
  });

  it('drops an unknown value and warns in development, naming the allowed values', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(dataValue('stack', { name: 'gap', allowed: [4, 8], value: 3 })).toBeUndefined();
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0]?.[0]).toContain('bit-stack received gap="3"');
    expect(warn.mock.calls[0]?.[0]).toContain('4 | 8');
  });

  it('accepts a number-like string from an untyped caller: "8" matches 8 and does not warn', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(dataValue('stack', { name: 'gap', allowed: [4, 8], value: '8' })).toBe('8');
    expect(warn).not.toHaveBeenCalled();
  });

  it('does not warn in production', () => {
    vi.stubEnv('NODE_ENV', 'production');
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    dataValue('stack', { name: 'gap', allowed: [4, 8], value: 3 });
    expect(warn).not.toHaveBeenCalled();
  });
});
