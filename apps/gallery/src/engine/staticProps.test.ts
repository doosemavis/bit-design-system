import { describe, it, expect } from 'vitest';
import { staticProps } from './staticProps';
import { defaultState } from './state';
import { button } from '../manifests/button';
import { segmentedControl } from '../manifests/segmentedControl';

describe('staticProps', () => {
  it("returns the manifest's fixed props", () => {
    expect(staticProps(segmentedControl, defaultState(segmentedControl))).toEqual(segmentedControl.fixedProps);
  });

  it('returns a new object, so a caller cannot change the manifest through it', () => {
    expect(staticProps(segmentedControl, defaultState(segmentedControl))).not.toBe(segmentedControl.fixedProps);
  });

  it('returns an empty object for a manifest without fixed props', () => {
    expect(staticProps(button, defaultState(button))).toEqual({});
  });
});
