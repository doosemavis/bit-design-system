import { describe, expect, it } from 'vitest';
import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Textarea } from './Textarea';
import { Field } from '../Field/Field';
import { SIZES } from '../../system/axes';
import { expectNoA11yViolations } from '../../test/a11y';

describe('Textarea', () => {
  it('renders a native textarea, 3 rows by default, with the default decorators', () => {
    render(<Textarea aria-label="Notes" />);
    const box = screen.getByRole('textbox', { name: 'Notes' });
    expect(box.tagName).toBe('TEXTAREA');
    expect(box.className).toBe('bit-textarea bit-md');
    expect(box).toHaveAttribute('rows', '3');
  });

  it.each(SIZES)('size=%s is bit-%s', (size) => {
    render(<Textarea aria-label="Notes" size={size} />);
    expect(screen.getByRole('textbox').className).toBe(`bit-textarea bit-${size}`);
  });

  it('rows, className (last), the ref and other props pass through', () => {
    const ref = createRef<HTMLTextAreaElement>();
    render(<Textarea ref={ref} aria-label="Notes" rows={6} className="bit-sm extra" name="notes" maxLength={200} />);
    const box = screen.getByRole('textbox');
    expect(ref.current).toBe(box);
    expect(box).toHaveAttribute('rows', '6');
    expect(box.className).toBe('bit-textarea bit-sm extra');
    expect(box).toHaveAttribute('name', 'notes');
    expect(box).toHaveAttribute('maxlength', '200');
  });

  it('takes typing, Enter included, and reports it through onChange', async () => {
    const user = userEvent.setup();
    let value = '';
    render(<Textarea aria-label="Notes" onChange={(e) => (value = e.target.value)} />);
    await user.type(screen.getByRole('textbox'), 'one{Enter}two');
    expect(value).toBe('one\ntwo');
  });

  it('inside a Field it takes the label, hint, error and required', () => {
    render(
      <Field label="Message" hint="Plain text only." error="Write a message." required>
        <Textarea />
      </Field>,
    );
    const box = screen.getByRole('textbox', { name: 'Message' });
    expect(box).toHaveAttribute('aria-invalid', 'true');
    expect(box).toBeRequired();
    expect(box).toHaveAccessibleDescription('Plain text only. Write a message.');
  });

  it('invalid sets aria-invalid; readOnly and disabled are the native attributes', async () => {
    const user = userEvent.setup();
    const { rerender } = render(<Textarea aria-label="Notes" invalid />);
    expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true');
    rerender(<Textarea aria-label="Notes" readOnly defaultValue="Locked" />);
    await user.type(screen.getByRole('textbox'), 'x');
    expect(screen.getByRole('textbox')).toHaveValue('Locked');
    expect(screen.getByRole('textbox')).toHaveAttribute('readonly');
    rerender(<Textarea aria-label="Notes" disabled />);
    expect(screen.getByRole('textbox')).toBeDisabled();
  });

  it('rejects the legacy DOM color attribute', () => {
    // @ts-expect-error color is not a Textarea prop
    render(<Textarea aria-label="Notes" color="danger" />);
    expect(screen.getByRole('textbox')).not.toHaveAttribute('color');
  });

  it.each([
    ['plain', {}],
    ['invalid', { invalid: true }],
    ['read-only', { readOnly: true }],
    ['disabled', { disabled: true }],
  ])('%s has no accessibility violations', async (_name, props) => {
    const { container } = render(
      <Field label="Message" hint="Plain text only.">
        <Textarea {...props} />
      </Field>,
    );
    await expectNoA11yViolations(container);
  });
});
