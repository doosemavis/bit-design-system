import { describe, it, expect } from 'vitest';
import { buildProps } from './buildProps';
import { defaultState } from './state';
import { button } from '../manifests/button';
import { stack } from '../manifests/stack';
import { text } from '../manifests/text';
import { bitLogo } from '../manifests/bitLogo';
import { spinner } from '../manifests/spinner';
import { segmentedControl } from '../manifests/segmentedControl';
import { numberControlFixture as fixture } from '../test/fixtures';

describe('buildProps', () => {
  it('passes axes, booleans, and text through and excludes children', () => {
    const props = buildProps(button, { ...defaultState(button), loading: true });
    expect(props).toEqual({ color: 'primary', variant: 'solid', size: 'md', loading: true, disabled: false });
  });

  it('converts numeric selects and number controls to numbers', () => {
    expect(buildProps(stack, { ...defaultState(stack), gap: '32' }).gap).toBe(32);
    expect(buildProps(bitLogo, { ...defaultState(bitLogo), era: '32' })).toMatchObject({ era: 32 });
    expect(buildProps(fixture, { ...defaultState(fixture), interval: '8' }).interval).toBe(8);
  });

  it('drops the default and none sentinels so the component sees an omitted prop', () => {
    expect('color' in buildProps(text, defaultState(text))).toBe(false);
    expect(buildProps(text, { ...defaultState(text), color: 'neutral' }).color).toBe('neutral');
    expect('era' in buildProps(bitLogo, defaultState(bitLogo))).toBe(false);
  });

  it('starts from the manifest fixed props (SegmentedControl options), then adds the controls', () => {
    const props = buildProps(segmentedControl, defaultState(segmentedControl));
    expect(props.options).toBe(segmentedControl.fixedProps!.options);
    expect(props).toMatchObject({ legend: 'Range', color: 'primary', size: 'md', legendHidden: false });
  });

  it('keeps aria-label as a prop name', () => {
    expect(buildProps(spinner, defaultState(spinner))['aria-label']).toBe('Loading coins');
  });
});
