import { afterEach, describe, expect, it, vi } from 'vitest';
import { toClasses, element, withClassName } from './toClasses';
import { TONES, SIZES, VARIANTS } from './axes';

const axes = (tone?: string, variant?: string, size?: string) => [
  { name: 'tone', allowed: TONES, value: tone },
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
      'bit-button bit-primary bit-solid bit-md bit-danger extra',
    );
  });

  it('skips axes whose value is undefined', () => {
    expect(toClasses('text', axes(undefined, undefined, 'lg'))).toBe('bit-text bit-lg');
  });

  it('drops an unknown value and warns in development', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(toClasses('button', axes('purple', 'solid', 'md'))).toBe('bit-button bit-solid bit-md');
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0]?.[0]).toContain('tone="purple"');
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
