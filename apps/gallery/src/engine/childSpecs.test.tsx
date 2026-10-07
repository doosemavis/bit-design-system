import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { childSpecs, isInteractive } from './childSpecs';
import { renderManifest } from './renderManifest';
import { buildProps } from './buildProps';
import { defaultState } from './state';
import { toJsx } from '../code/toJsx';
import { CODE_FORMATS } from '../code/codeFormats';
import { testManifest } from '../test/manifest';
import type { ChildSpec, ControlState } from '../manifests/types';

const INPUT: ChildSpec = { component: 'Input', props: { type: 'email' } };
const SELECT: ChildSpec = { component: 'Select', props: { placeholder: 'Pick', options: [{ value: 'a', label: 'A' }] } };

const switching = testManifest({
  name: 'Field',
  component: ({ children }: { children?: ReactNode }) => <div data-testid="host">{children}</div>,
  controls: [
    { kind: 'text', prop: 'label', default: 'Email', alwaysPrint: true },
    { kind: 'select', prop: 'control', values: ['Input', 'Select'], default: 'Input', virtual: true },
  ],
  deriveChildren: (state) => [state.control === 'Select' ? SELECT : INPUT],
  interactive: (state) => state.control === 'Select',
});

describe('childSpecs', () => {
  it('uses deriveChildren with the defaults filled in, so a partial state works', () => {
    expect(childSpecs(switching, {})).toEqual([INPUT]);
    expect(childSpecs(switching, { control: 'Select' })).toEqual([SELECT]);
  });

  it('falls back to a ChildSpec array, and is undefined for text children or none', () => {
    expect(childSpecs(testManifest({ children: [INPUT] }), {})).toEqual([INPUT]);
    expect(childSpecs(testManifest({ children: 'Click' }), {})).toBeUndefined();
    expect(childSpecs(testManifest(), {})).toBeUndefined();
  });

  it('renderManifest renders the derived children', () => {
    render(renderManifest(switching, { ...defaultState(switching), control: 'Select' }));
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });
});

describe('toJsx with derived children and array child props', () => {
  it('imports the child, hoists its array prop to a const and passes it by name', () => {
    expect(toJsx(switching, { ...defaultState(switching), control: 'Select' })).toBe(
      [
        "import { Field, Select } from '@bit-ds/react';",
        "const options = [\n  { value: 'a', label: 'A' },\n];",
        '<Field label="Email">\n  <Select placeholder="Pick" options={options} />\n</Field>',
      ].join('\n\n'),
    );
  });

  it('a child const and a top-level const of the same name get unique names, top level first', () => {
    const both = testManifest({ ...switching, fixedProps: { options: ['x'] } });
    const code = toJsx(both, { ...defaultState(both), control: 'Select' });
    expect(code).toContain("const options = [\n  'x',\n];");
    expect(code).toContain("const options2 = [\n  { value: 'a', label: 'A' },\n];");
    expect(code).toContain('<Field label="Email" options={options}>');
    expect(code).toContain('<Select placeholder="Pick" options={options2} />');
  });

  it('a short string child prop still prints as an attribute', () => {
    expect(toJsx(switching, defaultState(switching))).toContain('<Input type="email" />');
  });
});

describe('virtual number controls', () => {
  const counted = testManifest({
    controls: [{ kind: 'number', prop: 'count', default: 3, min: 1, max: 9, step: 1, virtual: true }],
  });

  it('are neither passed nor printed', () => {
    const state: ControlState = { count: '7' };
    expect(buildProps(counted, state)).not.toHaveProperty('count');
    expect(toJsx(counted, state)).not.toContain('count');
  });
});

describe('interactive as a function of state', () => {
  const ids = (state: ControlState) => CODE_FORMATS.filter((f) => f.available(switching, state)).map((f) => f.id);

  it('isInteractive reads a boolean or calls the function with the defaults filled in', () => {
    expect(isInteractive(testManifest({ interactive: true }), {})).toBe(true);
    expect(isInteractive(testManifest(), {})).toBe(false);
    expect(isInteractive(switching, {})).toBe(false);
    expect(isInteractive(switching, { control: 'Select' })).toBe(true);
  });

  it('the HTML tab is offered only while the state is not interactive', () => {
    expect(ids(defaultState(switching))).toContain('html');
    expect(ids({ ...defaultState(switching), control: 'Select' })).not.toContain('html');
  });
});
