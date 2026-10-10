import { describe, expect, it, vi } from 'vitest';
import { createRef, useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Checkbox } from './Checkbox';
import { Field } from '../Field/Field';
import { SIZES } from '../../system/axes';
import { expectNoA11yViolations } from '../../test/a11y';

describe('Checkbox', () => {
  it('renders a label holding a hidden native checkbox, the box, and the visible label', () => {
    const { container } = render(<Checkbox>Remember me</Checkbox>);
    const label = container.firstElementChild as HTMLElement;
    expect(label.tagName).toBe('LABEL');
    expect(label.className).toBe('bit-checkbox bit-md');
    const input = screen.getByRole('checkbox', { name: 'Remember me' });
    expect(input).toHaveAttribute('type', 'checkbox');
    expect(input.className).toBe('bit-checkbox__input');
    expect(label.querySelector('.bit-checkbox__box')).toHaveAttribute('aria-hidden', 'true');
    expect([...label.children].map((el) => el.className)).toEqual(['bit-checkbox__input', 'bit-checkbox__box', 'bit-checkbox__label']);
  });

  it.each(SIZES)('size=%s goes on the label as bit-%s', (size) => {
    const { container } = render(<Checkbox size={size}>A</Checkbox>);
    expect((container.firstElementChild as HTMLElement).className).toBe(`bit-checkbox bit-${size}`);
  });

  it('a size decorator in className replaces the prop, as on every component', () => {
    const { container } = render(<Checkbox className="bit-lg extra">A</Checkbox>);
    expect((container.firstElementChild as HTMLElement).className).toBe('bit-checkbox bit-lg extra');
  });

  it('className goes on the label; the ref and the rest go on the input', () => {
    const ref = createRef<HTMLInputElement>();
    render(
      <Checkbox ref={ref} name="terms" value="yes" data-testid="input" defaultChecked>
        Terms
      </Checkbox>,
    );
    const input = screen.getByTestId('input');
    expect(ref.current).toBe(input);
    expect(input).toHaveAttribute('name', 'terms');
    expect(input).toHaveAttribute('value', 'yes');
    expect(input).toBeChecked();
  });

  it('clicking the label or pressing Space toggles it; onChange runs, then onCheckedChange with the new state', async () => {
    const user = userEvent.setup();
    const calls: string[] = [];
    render(
      <Checkbox onChange={(e) => calls.push(`change:${e.target.checked}`)} onCheckedChange={(c) => calls.push(`checked:${c}`)}>
        Terms
      </Checkbox>,
    );
    await user.click(screen.getByText('Terms'));
    expect(screen.getByRole('checkbox')).toBeChecked();
    await user.keyboard(' ');
    expect(screen.getByRole('checkbox')).not.toBeChecked();
    expect(calls).toEqual(['change:true', 'checked:true', 'change:false', 'checked:false']);
  });

  it('works controlled', async () => {
    const user = userEvent.setup();
    function Controlled() {
      const [on, setOn] = useState(false);
      return (
        <>
          <Checkbox checked={on} onCheckedChange={setOn}>
            Terms
          </Checkbox>
          <output>{String(on)}</output>
        </>
      );
    }
    render(<Controlled />);
    await user.click(screen.getByRole('checkbox'));
    expect(screen.getByRole('status')).toHaveTextContent('true');
    expect(screen.getByRole('checkbox')).toBeChecked();
  });

  it('indeterminate sets the DOM property (announced as mixed), and clears again', () => {
    const { rerender } = render(<Checkbox indeterminate>All</Checkbox>);
    const input = screen.getByRole('checkbox') as HTMLInputElement;
    expect(input.indeterminate).toBe(true);
    expect(input).toBePartiallyChecked();
    expect(input).not.toHaveAttribute('indeterminate');
    rerender(<Checkbox>All</Checkbox>);
    expect(input.indeterminate).toBe(false);
  });

  it('keeps a callback ref working beside its own', () => {
    const ref = vi.fn();
    render(<Checkbox ref={ref}>A</Checkbox>);
    expect(ref).toHaveBeenCalledWith(screen.getByRole('checkbox'));
  });

  it('invalid sets aria-invalid; a Field error does too, and its id, hint and required reach the input', () => {
    const { rerender } = render(<Checkbox invalid>A</Checkbox>);
    expect(screen.getByRole('checkbox')).toHaveAttribute('aria-invalid', 'true');
    rerender(
      <Field label="Terms" hint="Read them first." error="Accept the terms to go on." required>
        <Checkbox>I agree</Checkbox>
      </Field>,
    );
    const input = screen.getByRole('checkbox', { name: 'Terms I agree' });
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toBeRequired();
    expect(input).toHaveAccessibleDescription('Read them first. Accept the terms to go on.');
    expect(document.querySelector('label.bit-field__label')).toHaveAttribute('for', input.id);
  });

  it('readOnly keeps focus and the state: a click or Space changes nothing and calls nothing', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const onCheckedChange = vi.fn();
    render(
      <Checkbox readOnly defaultChecked onChange={onChange} onCheckedChange={onCheckedChange}>
        Locked
      </Checkbox>,
    );
    const input = screen.getByRole('checkbox');
    expect(input).toHaveAttribute('aria-readonly', 'true');
    expect(input).not.toHaveAttribute('readonly');
    await user.click(screen.getByText('Locked'));
    input.focus();
    await user.keyboard(' ');
    expect(input).toBeChecked();
    expect(input).toHaveFocus();
    expect(onChange).not.toHaveBeenCalled();
    expect(onCheckedChange).not.toHaveBeenCalled();
  });

  it('disabled is the native attribute: no toggle, no focus', async () => {
    const user = userEvent.setup();
    render(<Checkbox disabled>Off</Checkbox>);
    await user.click(screen.getByText('Off'));
    expect(screen.getByRole('checkbox')).not.toBeChecked();
    expect(screen.getByRole('checkbox')).toBeDisabled();
  });

  it('Tab reaches it; type and the box are its own, whatever an untyped caller passes', async () => {
    const user = userEvent.setup();
    // @ts-expect-error type is not a Checkbox prop
    render(<Checkbox type="radio">A</Checkbox>);
    await user.tab();
    expect(screen.getByRole('checkbox')).toHaveFocus();
  });

  it('with no children it renders no empty label span, so aria-label names it', () => {
    const { container } = render(<Checkbox aria-label="Select row" />);
    expect(container.querySelector('.bit-checkbox__label')).toBeNull();
    expect(screen.getByRole('checkbox', { name: 'Select row' })).toBeInTheDocument();
  });

  it('rejects the legacy DOM color attribute', () => {
    // @ts-expect-error color is not a Checkbox prop
    render(<Checkbox color="danger">A</Checkbox>);
    expect(screen.getByRole('checkbox')).not.toHaveAttribute('color');
  });

  it.each([
    ['unchecked', {}],
    ['checked', { defaultChecked: true }],
    ['indeterminate', { indeterminate: true }],
    ['invalid', { invalid: true }],
    ['read-only', { readOnly: true }],
    ['disabled', { disabled: true }],
  ])('%s has no accessibility violations', async (_name, props) => {
    const { container } = render(<Checkbox {...props}>Terms</Checkbox>);
    await expectNoA11yViolations(container);
  });

  it('in a Field with an error, has no accessibility violations', async () => {
    const { container } = render(
      <Field label="Terms" error="Accept the terms." required>
        <Checkbox>I agree</Checkbox>
      </Field>,
    );
    await expectNoA11yViolations(container);
  });
});
