import { describe, it, expect } from 'vitest';
import { staticProps } from './staticProps';
import { defaultState } from './state';
import { button } from '../manifests/button';
import { segmentedControl } from '../manifests/segmentedControl';

const withFixed = { ...button, fixedProps: { id: 'x' } };

describe('staticProps', () => {
  it("returns the manifest's fixed props", () => {
    expect(staticProps(withFixed, defaultState(withFixed))).toEqual({ id: 'x' });
  });

  it('adds the props derived from the merged state, so a partial state still works', () => {
    expect((staticProps(segmentedControl, { segments: '2' }).options as unknown[]).length).toBe(2);
    expect((staticProps(segmentedControl, {}).options as unknown[]).length).toBe(3);
  });

  it('returns a new object each call, so a caller cannot change the manifest through it', () => {
    const state = defaultState(segmentedControl);
    expect(staticProps(segmentedControl, state)).not.toBe(staticProps(segmentedControl, state));
    expect(staticProps(withFixed, state)).not.toBe(withFixed.fixedProps);
  });

  it('returns an empty object for a manifest without fixed props', () => {
    expect(staticProps(button, defaultState(button))).toEqual({});
  });
});
