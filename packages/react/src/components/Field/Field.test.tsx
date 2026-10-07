import { describe, expect, it } from 'vitest';
import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import { Field } from './Field';
import { Input } from '../Input/Input';
import { expectNoA11yViolations } from '../../test/a11y';

const root = (container: HTMLElement) => container.firstElementChild as HTMLElement;

describe('Field', () => {
  it('renders a div.bit-field with a label tied to the control', () => {
    const { container } = render(
      <Field label="Email">
        <Input />
      </Field>,
    );
    expect(root(container).tagName).toBe('DIV');
    expect(root(container).className).toBe('bit-field');
    const input = screen.getByRole('textbox', { name: 'Email' });
    expect(container.querySelector('label.bit-field__label')).toHaveAttribute('for', input.id);
    expect(input.id).not.toBe('');
  });

  it('gives the label its own id, distinct from the control’s, so a Select’s listbox can be named by it', () => {
    const { container } = render(
      <Field label="Email">
        <Input />
      </Field>,
    );
    const label = container.querySelector('label.bit-field__label')!;
    expect(label.id).toMatch(/-label$/);
    expect(label.id).not.toBe(screen.getByRole('textbox').id);
  });

  it('puts the ref, className and rest props on the root div', () => {
    const ref = createRef<HTMLDivElement>();
    const { container } = render(
      <Field ref={ref} label="Email" className="extra" data-testid="field" style={{ marginTop: 4 }}>
        <Input />
      </Field>,
    );
    expect(ref.current).toBe(root(container));
    expect(root(container).className).toBe('bit-field extra');
    expect(root(container)).toHaveAttribute('data-testid', 'field');
    expect(root(container).style.marginTop).toBe('4px');
  });

  it('with no hint or error, renders neither and leaves the control undescribed and valid', () => {
    const { container } = render(
      <Field label="Email">
        <Input />
      </Field>,
    );
    expect(container.querySelector('.bit-field__hint')).toBeNull();
    expect(container.querySelector('.bit-field__error')).toBeNull();
    const input = screen.getByRole('textbox');
    expect(input).not.toHaveAttribute('aria-describedby');
    expect(input).not.toHaveAttribute('aria-invalid');
  });

  it('a hint gets an id and describes the control', () => {
    const { container } = render(
      <Field label="Email" hint="We never share it.">
        <Input />
      </Field>,
    );
    const hint = container.querySelector('p.bit-field__hint')!;
    expect(hint).toHaveTextContent('We never share it.');
    expect(screen.getByRole('textbox')).toHaveAttribute('aria-describedby', hint.id);
    expect(screen.getByRole('textbox')).toHaveAccessibleDescription('We never share it.');
  });

  it('an error describes the control after the hint, marks it invalid, and shows the warning sign to sight only', () => {
    const { container } = render(
      <Field label="Name" hint="As on your card." error="Enter your name.">
        <Input />
      </Field>,
    );
    const hint = container.querySelector('.bit-field__hint')!;
    const error = container.querySelector('p.bit-field__error')!;
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('aria-describedby', `${hint.id} ${error.id}`);
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(error.querySelector('span[aria-hidden="true"]')).toHaveTextContent('⚠');
    expect(input).toHaveAccessibleDescription('As on your card. Enter your name.');
  });

  it('required shows a hidden "*" and makes the control required', () => {
    const { container } = render(
      <Field label="Email" required>
        <Input />
      </Field>,
    );
    const star = container.querySelector('.bit-field__required')!;
    expect(star).toHaveAttribute('aria-hidden', 'true');
    expect(star.textContent).toBe(' *');
    expect(screen.getByRole('textbox', { name: 'Email' })).toBeRequired();
  });

  it("the control's own props win over the Field's, and descriptions combine", () => {
    render(
      <>
        <p id="extra">Extra help</p>
        <Field label="Email" error="Wrong" required>
          <Input id="email" aria-describedby="extra" aria-invalid={false} required={false} />
        </Field>
      </>,
    );
    const input = screen.getByRole('textbox', { name: 'Email' });
    expect(input.id).toBe('email');
    expect(input.getAttribute('aria-describedby')).toMatch(/^extra \S+-error$/);
    expect(input).toHaveAttribute('aria-invalid', 'false');
    expect(input).not.toBeRequired();
  });

  it('a control with its own id keeps its label: the label points at that id', () => {
    const { container } = render(
      <Field label="Email">
        <Input id="email" />
      </Field>,
    );
    expect(container.querySelector('label')).toHaveAttribute('for', 'email');
    expect(screen.getByRole('textbox', { name: 'Email' }).id).toBe('email');
  });

  it('a control passed inside an array (as the gallery engine renders it) is still labelled', () => {
    render(
      // @ts-expect-error children is one element; an array still has to work at runtime
      <Field label="Email">{[<Input key="email" />]}</Field>,
    );
    expect(screen.getByRole('textbox', { name: 'Email' })).toBeInTheDocument();
  });

  it('two Fields get different ids', () => {
    render(
      <>
        <Field label="First">
          <Input />
        </Field>
        <Field label="Second">
          <Input />
        </Field>
      </>,
    );
    const [first, second] = screen.getAllByRole('textbox');
    expect(first!.id).not.toBe(second!.id);
  });

  it('rejects the legacy DOM color attribute and does not render it', () => {
    const { container } = render(
      // @ts-expect-error color is not part of FieldProps
      <Field label="Email" color="danger">
        <Input />
      </Field>,
    );
    expect(root(container)).not.toHaveAttribute('color');
  });

  it('has no accessibility violations with a hint, an error and required', async () => {
    const { container } = render(
      <Field label="Email" hint="We never share it." error="Enter your email." required>
        <Input type="email" />
      </Field>,
    );
    await expectNoA11yViolations(container);
  });
});
