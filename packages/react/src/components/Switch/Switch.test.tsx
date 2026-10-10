import { describe, expect, it, vi } from 'vitest';
import { createRef, useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Switch } from './Switch';
import { Field } from '../Field/Field';
import { expectNoA11yViolations } from '../../test/a11y';

describe('Switch', () => {
  it('renders a label holding a hidden checkbox with role="switch", the track, and the visible label', () => {
    const { container } = render(<Switch>Wi-Fi</Switch>);
    const label = container.firstElementChild as HTMLElement;
    expect(label.tagName).toBe('LABEL');
    expect(label.className).toBe('bit-switch bit-md');
    const input = screen.getByRole('switch', { name: 'Wi-Fi' });
    expect(input).toHaveAttribute('type', 'checkbox');
    expect(input.className).toBe('bit-switch__input');
    const track = label.querySelector('.bit-switch__track')!;
    expect(track).toHaveAttribute('aria-hidden', 'true');
    expect(track.querySelector('.bit-switch__thumb')).not.toBeNull();
    expect(label.querySelector('.bit-switch__label')).toHaveTextContent('Wi-Fi');
    expect([...label.children].map((el) => el.className)).toEqual(['bit-switch__input', 'bit-switch__track', 'bit-switch__label']);
  });

  it.each(['sm', 'md'] as const)('size=%s goes on the label as bit-%s', (size) => {
    const { container } = render(<Switch size={size}>Wi-Fi</Switch>);
    expect((container.firstElementChild as HTMLElement).className).toBe(`bit-switch bit-${size}`);
  });

  it('className goes on the label; the ref and rest props go on the input', () => {
    const ref = createRef<HTMLInputElement>();
    const { container } = render(
      <Switch ref={ref} className="extra" name="wifi" data-testid="input" defaultChecked>
        Wi-Fi
      </Switch>,
    );
    const input = screen.getByTestId('input');
    expect((container.firstElementChild as HTMLElement).className).toBe('bit-switch bit-md extra');
    expect(ref.current).toBe(input);
    expect(input).toHaveAttribute('name', 'wifi');
    expect(input).toBeChecked();
  });

  it('clicking the label text toggles it and reports the change', async () => {
    const onChange = vi.fn();
    render(<Switch onChange={onChange}>Wi-Fi</Switch>);
    const input = screen.getByRole('switch');
    await userEvent.click(screen.getByText('Wi-Fi'));
    expect(input).toBeChecked();
    expect(onChange).toHaveBeenCalledTimes(1);
    await userEvent.click(screen.getByText('Wi-Fi'));
    expect(input).not.toBeChecked();
  });

  it('Tab reaches it and Space toggles it', async () => {
    render(<Switch>Wi-Fi</Switch>);
    await userEvent.tab();
    const input = screen.getByRole('switch');
    expect(input).toHaveFocus();
    await userEvent.keyboard(' ');
    expect(input).toBeChecked();
  });

  it('works controlled', async () => {
    function Controlled() {
      const [on, setOn] = useState(false);
      return (
        <Switch checked={on} onChange={(event) => setOn(event.target.checked)}>
          {on ? 'On' : 'Off'}
        </Switch>
      );
    }
    render(<Controlled />);
    await userEvent.click(screen.getByText('Off'));
    expect(screen.getByRole('switch', { name: 'On' })).toBeChecked();
  });

  it('disabled: no toggling by click or key', async () => {
    const onChange = vi.fn();
    render(
      <Switch disabled onChange={onChange}>
        Wi-Fi
      </Switch>,
    );
    const input = screen.getByRole('switch');
    expect(input).toBeDisabled();
    await userEvent.click(screen.getByText('Wi-Fi'));
    expect(input).not.toBeChecked();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('an untyped caller cannot override role="switch" or type="checkbox"', () => {
    // @ts-expect-error role and type are not part of SwitchProps
    render(<Switch role="button" type="radio">Wi-Fi</Switch>);
    const input = screen.getByRole('switch', { name: 'Wi-Fi' });
    expect(input).toHaveAttribute('type', 'checkbox');
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('rejects the legacy DOM color attribute and does not render it', () => {
    // @ts-expect-error color is not part of SwitchProps
    render(<Switch color="danger">Wi-Fi</Switch>);
    expect(screen.getByRole('switch')).not.toHaveAttribute('color');
  });

  it.each([
    ['off', {}],
    ['on', { defaultChecked: true }],
    ['disabled', { disabled: true }],
  ])('has no accessibility violations (%s)', async (_state, props) => {
    const { container } = render(<Switch {...props}>Wi-Fi</Switch>);
    await expectNoA11yViolations(container);
  });
  it('invalid sets aria-invalid; without it there is none', () => {
    const { rerender } = render(<Switch invalid>Wi-Fi</Switch>);
    expect(screen.getByRole('switch')).toHaveAttribute('aria-invalid', 'true');
    rerender(<Switch>Wi-Fi</Switch>);
    expect(screen.getByRole('switch')).not.toHaveAttribute('aria-invalid');
  });

  it("joins a Field: the Field's label and its own name it, and the hint, error and required reach the input", () => {
    const { container } = render(
      <Field label="Notifications" hint="We send at most one a day." error="Turn this on to continue." required>
        <Switch>Email me</Switch>
      </Field>,
    );
    const input = screen.getByRole('switch', { name: 'Notifications Email me' });
    expect(container.querySelector('label.bit-field__label')).toHaveAttribute('for', input.id);
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toBeRequired();
    expect(input).toHaveAccessibleDescription('We send at most one a day. Turn this on to continue.');
  });

  it('in a Field with an error, has no accessibility violations', async () => {
    const { container } = render(
      <Field label="Notifications" error="Turn this on to continue.">
        <Switch>Email me</Switch>
      </Field>,
    );
    await expectNoA11yViolations(container);
  });
});
