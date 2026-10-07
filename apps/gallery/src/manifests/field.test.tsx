import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { field } from './field';
import { defaultState } from '../engine/state';
import { renderManifest } from '../engine/renderManifest';
import { toJsx } from '../code/toJsx';
import { fullFile } from '../code/fullFile';
import { CODE_FORMATS } from '../code/codeFormats';
import type { ControlState } from './types';

const withSelect: ControlState = { ...defaultState(field), control: 'Select' };

describe('Field page: the Select demo', () => {
  it('Input stays the default child', () => {
    render(renderManifest(field, defaultState(field)));
    expect(screen.getByRole('textbox', { name: 'Email' })).toBeInTheDocument();
  });

  it('control=Select renders a Select named by the Field label', () => {
    render(renderManifest(field, withSelect));
    expect(screen.getByRole('combobox', { name: 'Email' })).toBeInTheDocument();
  });

  it('prints the Select with its options as a const above the Field', () => {
    expect(toJsx(field, withSelect)).toBe(
      [
        "import { Field, Select } from '@bit-ds/react';",
        [
          'const options = [',
          "  { value: 'primary', label: 'Primary' },",
          "  { value: 'neutral', label: 'Neutral' },",
          "  { value: 'success', label: 'Success' },",
          "  { value: 'warning', label: 'Warning' },",
          "  { value: 'danger', label: 'Danger' },",
          '];',
        ].join('\n'),
        '<Field label="Email">\n  <Select placeholder="Pick a color" options={options} />\n</Field>',
      ].join('\n\n'),
    );
  });

  it('the full file puts the const between the import and the component', () => {
    const file = fullFile(toJsx(field, withSelect));
    expect(file.indexOf('const options = [')).toBeGreaterThan(file.indexOf("from '@bit-ds/react';"));
    expect(file.indexOf('const options = [')).toBeLessThan(file.indexOf('function Example'));
  });

  it('hides the HTML tab while showing a Select, and offers it for the Input', () => {
    const ids = (state: ControlState) => CODE_FORMATS.filter((f) => f.available(field, state)).map((f) => f.id);
    expect(ids(defaultState(field))).toContain('html');
    expect(ids(withSelect)).not.toContain('html');
  });

  it('the Select preset sets the control, a matching label and a hint', () => {
    expect((field.presets ?? []).find((p) => p.label === 'Select')?.state).toEqual({
      control: 'Select',
      label: 'Favorite color',
      hint: 'We use it for your avatar.',
    });
  });
});
