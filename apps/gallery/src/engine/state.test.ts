import { describe, it, expect } from 'vitest';
import { applyLocks, defaultState, parseState, serializeState } from './state';
import { text } from '../manifests/text';
import { button } from '../manifests/button';
import { stack } from '../manifests/stack';
import { bitLogo } from '../manifests/bitLogo';
import { numberControlFixture as fixture } from '../test/fixtures';

describe('defaultState', () => {
  it('collects every control default and string children', () => {
    expect(defaultState(button)).toEqual({
      color: 'primary',
      variant: 'solid',
      size: 'md',
      loading: false,
      disabled: false,
      children: 'Save',
    });
  });

  it('stores numbers as strings', () => {
    expect(defaultState(fixture)).toMatchObject({ interval: '5', animated: true });
    expect(defaultState(bitLogo)).toMatchObject({ size: 'md', era: 'none' });
  });
});

describe('parseState', () => {
  it('overlays valid query values on the defaults', () => {
    const state = parseState(button, new URLSearchParams('color=danger&loading=1&children=Delete'));
    expect(state).toMatchObject({ color: 'danger', variant: 'solid', loading: true, children: 'Delete' });
  });

  it('ignores unknown keys and invalid enum values', () => {
    const state = parseState(button, new URLSearchParams('color=purple&nope=1&size=xl'));
    expect(state.color).toBe('primary');
    expect(state.size).toBe('md');
    expect('nope' in state).toBe(false);
  });

  it('reads booleans as 1/0 and rejects other spellings', () => {
    expect(parseState(button, new URLSearchParams('loading=1')).loading).toBe(true);
    expect(parseState(fixture, new URLSearchParams('animated=0')).animated).toBe(false);
    expect(parseState(button, new URLSearchParams('loading=true')).loading).toBe(false);
  });

  it('clamps numbers to the control range and rejects non-numbers', () => {
    expect(parseState(fixture, new URLSearchParams('interval=12')).interval).toBe('12');
    expect(parseState(fixture, new URLSearchParams('interval=99')).interval).toBe('30');
    expect(parseState(fixture, new URLSearchParams('interval=abc')).interval).toBe('5');
  });

  it('accepts numeric select values by string', () => {
    expect(parseState(stack, new URLSearchParams('gap=32')).gap).toBe('32');
    expect(parseState(stack, new URLSearchParams('gap=9')).gap).toBe('12');
  });
});

describe('serializeState', () => {
  it('omits values equal to the default', () => {
    const params = serializeState(button, defaultState(button));
    expect(params.toString()).toBe('');
  });

  it('writes only changed values, booleans as 1/0, in control order', () => {
    const state = { ...defaultState(button), variant: 'ghost', loading: true, children: 'Go' };
    expect(serializeState(button, state).toString()).toBe('variant=ghost&loading=1&children=Go');
    const off = { ...defaultState(fixture), animated: false };
    expect(serializeState(fixture, off).toString()).toBe('animated=0');
  });

  it('round-trips through parseState', () => {
    const state = { ...defaultState(stack), direction: 'row', gap: '24', wrap: true };
    expect(parseState(stack, serializeState(stack, state))).toEqual(state);
  });
});

describe('locked controls', () => {
  it('a locked control holds its default, so ?size=32&weight=bold shows and prints weight normal', () => {
    const state = parseState(text, new URLSearchParams('size=32&weight=bold'));
    expect(state.size).toBe('32');
    expect(state.weight).toBe('normal');
    expect(serializeState(text, state).toString()).toBe('size=32');
  });

  it('an unlocked control keeps its value: bold at 15 stays bold', () => {
    expect(parseState(text, new URLSearchParams('weight=bold')).weight).toBe('bold');
  });

  it('applyLocks returns a new state and leaves the one it was given alone', () => {
    const given = { ...defaultState(text), size: '24', weight: 'bold' };
    const next = applyLocks(text, given);
    expect(next.weight).toBe('normal');
    expect(given.weight).toBe('bold');
  });
});
