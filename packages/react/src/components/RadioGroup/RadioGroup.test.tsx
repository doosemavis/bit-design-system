import { describe, expect, it, vi } from 'vitest';
import { createRef, useState } from 'react';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Radio, RadioGroup } from './RadioGroup';
import { Field } from '../Field/Field';
import { SIZES } from '../../system/axes';
import { expectNoA11yViolations } from '../../test/a11y';

const SHIPPING = [
  { value: 'standard', label: 'Standard' },
  { value: 'express', label: 'Express' },
  { value: 'pickup', label: 'Pick up', disabled: true },
] as const;

const radio = (name: string) => screen.getByRole('radio', { name });

describe('RadioGroup', () => {
  it('renders a fieldset (role radiogroup) named by its legend, with one labelled radio per option', () => {
    const { container } = render(<RadioGroup legend="Shipping" options={SHIPPING} />);
    const group = screen.getByRole('radiogroup', { name: 'Shipping' });
    expect(group.tagName).toBe('FIELDSET');
    expect(group.className).toBe('bit-radio-group bit-md');
    expect(container.querySelector('legend.bit-radio-group__legend')).toHaveTextContent('Shipping');
    expect(screen.getAllByRole('radio').map((r) => r.getAttribute('value'))).toEqual(['standard', 'express', 'pickup']);
    const label = radio('Standard').closest('label')!;
    expect(label.className).toBe('bit-radio');
    expect([...label.children].map((el) => el.className)).toEqual(['bit-radio__input', 'bit-radio__dot', 'bit-radio__label']);
    expect(label.querySelector('.bit-radio__dot')).toHaveAttribute('aria-hidden', 'true');
  });

  it('takes <Radio> children instead of options', () => {
    render(
      <RadioGroup legend="Size">
        <Radio value="s">Small</Radio>
        <Radio value="l">Large</Radio>
      </RadioGroup>,
    );
    expect(screen.getAllByRole('radio')).toHaveLength(2);
    expect(radio('Large')).toHaveAttribute('value', 'l');
  });

  it('a Radio outside a RadioGroup throws a clear error', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<Radio value="x">X</Radio>)).toThrow('[bit] Radio must be inside a RadioGroup.');
    vi.restoreAllMocks();
  });

  it.each(SIZES)('size=%s is bit-%s on the group', (size) => {
    render(<RadioGroup legend="Shipping" options={SHIPPING} size={size} />);
    expect(screen.getByRole('radiogroup').className).toBe(`bit-radio-group bit-${size}`);
  });

  it('every radio shares one name: the given name, or a generated one', () => {
    const { rerender } = render(<RadioGroup legend="Shipping" options={SHIPPING} />);
    const names = new Set(screen.getAllByRole('radio').map((r) => r.getAttribute('name')));
    expect(names.size).toBe(1);
    expect([...names][0]).toBeTruthy();
    rerender(<RadioGroup legend="Shipping" options={SHIPPING} name="ship" />);
    expect(screen.getAllByRole('radio').every((r) => r.getAttribute('name') === 'ship')).toBe(true);
  });

  it('nothing is chosen by default; defaultValue picks one; a click chooses and calls onValueChange', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const { rerender } = render(<RadioGroup legend="Shipping" options={SHIPPING} />);
    expect(screen.getAllByRole('radio').some((r) => (r as HTMLInputElement).checked)).toBe(false);
    rerender(<RadioGroup key="b" legend="Shipping" options={SHIPPING} defaultValue="express" onValueChange={onValueChange} />);
    expect(radio('Express')).toBeChecked();
    await user.click(screen.getByText('Standard'));
    expect(radio('Standard')).toBeChecked();
    expect(onValueChange).toHaveBeenCalledWith('standard');
  });

  it('the arrow keys move the choice (native radios), skipping disabled ones, and Tab is one stop', async () => {
    const user = userEvent.setup();
    render(
      <>
        <RadioGroup legend="Shipping" options={SHIPPING} defaultValue="standard" />
        <button type="button">After</button>
      </>,
    );
    await user.tab();
    expect(radio('Standard')).toHaveFocus();
    await user.keyboard('{ArrowDown}');
    expect(radio('Express')).toHaveFocus();
    expect(radio('Express')).toBeChecked();
    await user.tab();
    expect(screen.getByRole('button', { name: 'After' })).toHaveFocus();
  });

  it('works controlled: the parent owns the value', async () => {
    const user = userEvent.setup();
    function Controlled() {
      const [value, setValue] = useState('standard');
      return (
        <>
          <RadioGroup legend="Shipping" options={SHIPPING} value={value} onValueChange={setValue} />
          <output>{value}</output>
        </>
      );
    }
    render(<Controlled />);
    await user.click(screen.getByText('Express'));
    expect(screen.getByRole('status')).toHaveTextContent('express');
    expect(radio('Express')).toBeChecked();
  });

  it('a controlled value with no handler stays put', async () => {
    const user = userEvent.setup();
    render(<RadioGroup legend="Shipping" options={SHIPPING} value="standard" />);
    await user.click(screen.getByText('Express'));
    expect(radio('Standard')).toBeChecked();
  });

  it('readOnly keeps the choice: aria-readonly on the group, clicks and arrows change nothing', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<RadioGroup legend="Shipping" options={SHIPPING} defaultValue="standard" readOnly onValueChange={onValueChange} />);
    expect(screen.getByRole('radiogroup')).toHaveAttribute('aria-readonly', 'true');
    await user.click(screen.getByText('Express'));
    act(() => radio('Standard').focus());
    await user.keyboard('{ArrowDown}');
    expect(radio('Standard')).toBeChecked();
    expect(radio('Express')).not.toBeChecked();
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('disabled disables every radio through the fieldset; an option can be disabled alone', () => {
    const { rerender } = render(<RadioGroup legend="Shipping" options={SHIPPING} />);
    expect(radio('Pick up')).toBeDisabled();
    expect(radio('Standard')).not.toBeDisabled();
    rerender(<RadioGroup legend="Shipping" options={SHIPPING} disabled />);
    expect(screen.getAllByRole('radio').every((r) => (r as HTMLInputElement).matches(':disabled'))).toBe(true);
  });

  it('invalid and required go on the group (aria-invalid, aria-required) and required on each radio', () => {
    render(<RadioGroup legend="Shipping" options={SHIPPING} invalid required />);
    const group = screen.getByRole('radiogroup');
    expect(group).toHaveAttribute('aria-invalid', 'true');
    expect(group).toHaveAttribute('aria-required', 'true');
    expect(screen.getAllByRole('radio').every((r) => (r as HTMLInputElement).required)).toBe(true);
    expect(radio('Standard')).not.toHaveAttribute('aria-invalid');
  });

  it("in a Field: the Field's label names the group (its label has no for), and its hint, error and required reach it", () => {
    const { container } = render(
      <Field label="Shipping" hint="Arrives in 2 to 5 days." error="Pick a shipping option." required>
        <RadioGroup options={SHIPPING} />
      </Field>,
    );
    const group = screen.getByRole('radiogroup', { name: 'Shipping' });
    expect(container.querySelector('label.bit-field__label')).not.toHaveAttribute('for');
    expect(group).toHaveAccessibleDescription('Arrives in 2 to 5 days. Pick a shipping option.');
    expect(group).toHaveAttribute('aria-invalid', 'true');
    expect(group).toHaveAttribute('aria-required', 'true');
    expect(radio('Standard')).toBeRequired();
  });

  it('a legend inside a Field names the group instead; an aria-label of its own wins over both', () => {
    const { rerender } = render(
      <Field label="Delivery">
        <RadioGroup legend="Shipping speed" options={SHIPPING} />
      </Field>,
    );
    expect(screen.getByRole('radiogroup', { name: 'Shipping speed' })).toBeInTheDocument();
    rerender(<RadioGroup aria-label="Speed" options={SHIPPING} />);
    expect(screen.getByRole('radiogroup', { name: 'Speed' })).toBeInTheDocument();
  });

  it('legendHidden hides the legend from sight only', () => {
    const { container } = render(<RadioGroup legend="Shipping" legendHidden options={SHIPPING} />);
    expect(container.querySelector('legend')).toHaveAttribute('data-hidden', '');
    expect(screen.getByRole('radiogroup', { name: 'Shipping' })).toBeInTheDocument();
  });

  it('forwards refs: the group to the fieldset, a Radio to its input', () => {
    const groupRef = createRef<HTMLFieldSetElement>();
    const radioRef = createRef<HTMLInputElement>();
    render(
      <RadioGroup ref={groupRef} legend="Size">
        <Radio ref={radioRef} value="s" className="extra">
          Small
        </Radio>
      </RadioGroup>,
    );
    expect(groupRef.current).toBe(screen.getByRole('radiogroup'));
    expect(radioRef.current).toBe(radio('Small'));
    expect(radio('Small').closest('label')).toHaveClass('bit-radio', 'extra');
  });

  it("a Radio's own onChange runs before the group's choice", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const onValueChange = vi.fn();
    render(
      <RadioGroup legend="Size" onValueChange={onValueChange}>
        <Radio value="s" onChange={onChange}>
          Small
        </Radio>
      </RadioGroup>,
    );
    await user.click(screen.getByText('Small'));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onValueChange).toHaveBeenCalledWith('s');
  });

  it('rejects the legacy DOM color attribute', () => {
    // @ts-expect-error color is not a RadioGroup prop
    render(<RadioGroup legend="Shipping" options={SHIPPING} color="danger" />);
    expect(screen.getByRole('radiogroup')).not.toHaveAttribute('color');
  });

  it.each([
    ['plain', {}],
    ['chosen', { defaultValue: 'express' }],
    ['invalid and required', { invalid: true, required: true }],
    ['read-only', { readOnly: true, defaultValue: 'standard' }],
    ['disabled', { disabled: true }],
  ])('%s has no accessibility violations', async (_name, props) => {
    const { container } = render(<RadioGroup legend="Shipping" options={SHIPPING} {...props} />);
    await expectNoA11yViolations(container);
  });

  it('in a Field with an error, has no accessibility violations', async () => {
    const { container } = render(
      <Field label="Shipping" error="Pick one." required>
        <RadioGroup options={SHIPPING} />
      </Field>,
    );
    await expectNoA11yViolations(container);
  });
});
