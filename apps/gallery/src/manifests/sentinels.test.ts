import { describe, it, expect } from 'vitest';
import { isOmittedSentinel } from './sentinels';
import type { Control } from './types';
import { buildProps } from '../engine/buildProps';
import { defaultState } from '../engine/state';
import { toJsx } from '../code/toJsx';
import { alert } from './alert';
import { bitLogo } from './bitLogo';

const select: Control = { kind: 'select', prop: 'era', values: ['none', '8'], default: 'none' };
const text: Control = { kind: 'text', prop: 'title', default: 'Heads up' };
const boolean: Control = { kind: 'boolean', prop: 'loading', default: false };

describe('isOmittedSentinel', () => {
  it.each(['default', 'none'])('a select value "%s" means leave the prop off', (value) => {
    expect(isOmittedSentinel(select, value)).toBe(true);
  });

  it('a real select value is kept', () => {
    expect(isOmittedSentinel(select, '8')).toBe(false);
  });

  it.each(['default', 'none'])('a text value "%s" is real text, not a sentinel', (value) => {
    expect(isOmittedSentinel(text, value)).toBe(false);
  });

  it('booleans are never sentinels', () => {
    expect(isOmittedSentinel(boolean, false)).toBe(false);
  });
});

describe('preview and code agree on sentinels (D12)', () => {
  it('a text value "none" reaches both the preview props and the React code', () => {
    const state = { ...defaultState(alert), title: 'none' };
    expect(buildProps(alert, state).title).toBe('none');
    expect(toJsx(alert, state)).toContain('title="none"');
  });

  it('a select sentinel is left off both', () => {
    const state = defaultState(bitLogo);
    expect('era' in buildProps(bitLogo, state)).toBe(false);
    expect(toJsx(bitLogo, state)).not.toContain('era=');
  });
});

describe('axis sentinels (Icon colour: none leaves the prop off)', () => {
  const axis: Control = { kind: 'axis', prop: 'color', values: ['none', 'primary'], default: 'none' };
  it('an axis value "none" means leave the prop off', () => expect(isOmittedSentinel(axis, 'none')).toBe(true));
  it('a real axis value is kept', () => expect(isOmittedSentinel(axis, 'primary')).toBe(false));
});
