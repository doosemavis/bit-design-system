import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { ControlsPanel } from './ControlsPanel';
import { defaultState } from './state';
import type { ControlState, ControlValue, Manifest } from '../manifests/types';
import { button } from '../manifests/button';
import { spinner } from '../manifests/spinner';
import { badge as badgeManifest } from '../manifests/badge';
import { expectNoA11yViolations } from '../test/a11y';

interface HarnessProps {
  manifest: Manifest;
  onChange: (prop: string, value: ControlValue) => void;
  onReset?: () => void;
}

/**
 * ControlsPanel is controlled: its inputs show `state` and report edits through `onChange`.
 * Typing into a controlled input only "sticks" when the parent feeds the value back, which is
 * what the page does through useControlState. This harness does the same for the tests.
 */
function Harness({ manifest, onChange, onReset = () => {} }: HarnessProps) {
  const [state, setState] = useState<ControlState>(() => defaultState(manifest));
  return (
    <ControlsPanel
      manifest={manifest}
      state={state}
      onChange={(prop, value) => {
        setState((current) => ({ ...current, [prop]: value }));
        onChange(prop, value);
      }}
      onReset={onReset}
    />
  );
}

describe('ControlsPanel', () => {
  it('renders one select per axis with the manifest values, one switch per boolean, and a children field', async () => {
    const { container } = render(
      <ControlsPanel manifest={button} state={defaultState(button)} onChange={() => {}} onReset={() => {}} />,
    );
    const color = screen.getByLabelText('color') as HTMLSelectElement;
    expect([...color.options].map((o) => o.value)).toEqual(['primary', 'neutral', 'success', 'warning', 'danger']);
    expect(color.value).toBe('primary');
    expect(screen.getByLabelText('variant')).toBeInTheDocument();
    expect(screen.getByLabelText('size')).toBeInTheDocument();
    expect(screen.getByRole('switch', { name: 'loading' })).not.toBeChecked();
    expect(screen.getByRole('switch', { name: 'disabled' })).toBeInTheDocument();
    expect(screen.getByLabelText('children')).toHaveValue('Save');
    await expectNoA11yViolations(container);
  });

  it('calls onChange with the prop name and the new value', async () => {
    const onChange = vi.fn();
    render(<Harness manifest={button} onChange={onChange} />);
    await userEvent.selectOptions(screen.getByLabelText('color'), 'danger');
    expect(onChange).toHaveBeenLastCalledWith('color', 'danger');
    await userEvent.click(screen.getByRole('switch', { name: 'loading' }));
    expect(onChange).toHaveBeenLastCalledWith('loading', true);
    await userEvent.clear(screen.getByLabelText('children'));
    await userEvent.type(screen.getByLabelText('children'), 'Go');
    expect(onChange).toHaveBeenLastCalledWith('children', 'Go');
  });

  it('renders number and text controls and labels aria-label by its prop name', async () => {
    const onChange = vi.fn();
    const numbered: Manifest = {
      ...spinner,
      controls: [{ kind: 'number', prop: 'interval', default: 5, min: 1, max: 30, step: 1 }],
    };
    render(<Harness manifest={numbered} onChange={onChange} />);
    const interval = screen.getByLabelText('interval') as HTMLInputElement;
    expect(interval.type).toBe('number');
    expect(interval).toHaveValue(5);
    await userEvent.clear(interval);
    await userEvent.type(interval, '7');
    expect(onChange).toHaveBeenLastCalledWith('interval', '7');

    render(<ControlsPanel manifest={spinner} state={defaultState(spinner)} onChange={onChange} onReset={() => {}} />);
    expect(screen.getByLabelText('aria-label')).toHaveValue('Loading coins');
  });

  it('Controls is an h3 under the Playground h2', () => {
    render(<ControlsPanel manifest={button} state={defaultState(button)} onChange={() => {}} onReset={() => {}} />);
    expect(screen.getByRole('heading', { level: 3, name: 'Controls' })).toBeInTheDocument();
  });

  it("emptied children show the manifest's error, tied to the field and marking it invalid", async () => {
    const { container } = render(
      <ControlsPanel manifest={button} state={{ ...defaultState(button), children: '' }} onChange={() => {}} onReset={() => {}} />,
    );
    const field = screen.getByLabelText('children');
    expect(field).toHaveAttribute('aria-invalid', 'true');
    expect(field).toHaveAccessibleDescription('A Button needs text or an aria-label, or screen readers announce just "button".');
    expect(container.querySelector('.bit-field__error')).toHaveTextContent('A Button needs text');
    await expectNoA11yViolations(container);
  });

  it('a manifest without an empty-children error shows none, and children with text show none', () => {
    const { container, rerender } = render(
      <ControlsPanel manifest={badgeManifest} state={{ ...defaultState(badgeManifest), children: '' }} onChange={() => {}} onReset={() => {}} />,
    );
    expect(container.querySelector('.bit-field__error')).toBeNull();
    rerender(<ControlsPanel manifest={button} state={defaultState(button)} onChange={() => {}} onReset={() => {}} />);
    expect(screen.getByLabelText('children')).not.toHaveAttribute('aria-invalid');
  });

  it('is built from bit controls: Select, Input and Switch inside Field', () => {
    const numbered: Manifest = {
      ...button,
      controls: [...button.controls, { kind: 'number', prop: 'interval', default: 5, min: 1, max: 30, step: 1 }],
    };
    const { container } = render(
      <ControlsPanel manifest={numbered} state={defaultState(numbered)} onChange={() => {}} onReset={() => {}} />,
    );
    expect(container.querySelector('select.bit-select__control')).not.toBeNull();
    expect(container.querySelector('input.bit-input')).not.toBeNull();
    expect(container.querySelector('input.bit-switch__input[role="switch"]')).not.toBeNull();
    expect(container.querySelectorAll('.bit-field').length).toBeGreaterThan(0);
    expect(container.querySelector('[class*="gallery-control__"], .gallery-switch')).toBeNull();
  });

  it('Reset calls onReset', async () => {
    const onReset = vi.fn();
    render(<ControlsPanel manifest={button} state={defaultState(button)} onChange={() => {}} onReset={onReset} />);
    await userEvent.click(screen.getByRole('button', { name: 'Reset' }));
    expect(onReset).toHaveBeenCalledTimes(1);
  });
});
