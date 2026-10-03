import { describe, expect, it } from 'vitest';
import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Select } from './Select';
import { Field } from '../Field/Field';
import { SIZES } from '../../system/axes';
import { expectNoA11yViolations } from '../../test/a11y';

const options = (
  <>
    <option value="primary">primary</option>
    <option value="danger">danger</option>
  </>
);

describe('Select', () => {
  it('wraps a native select in span.bit-select with the default size', () => {
    const { container } = render(<Select aria-label="Color">{options}</Select>);
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.tagName).toBe('SPAN');
    expect(wrapper.className).toBe('bit-select bit-md');
    const select = screen.getByRole('combobox', { name: 'Color' });
    expect(select.tagName).toBe('SELECT');
    expect(select.className).toBe('bit-select__control');
    expect(select.parentElement).toBe(wrapper);
  });

  it.each(SIZES)('size=%s goes on the wrapper as bit-%s', (size) => {
    const { container } = render(
      <Select aria-label="Color" size={size}>
        {options}
      </Select>,
    );
    expect((container.firstElementChild as HTMLElement).className).toBe(`bit-select bit-${size}`);
  });

  it('className goes on the wrapper; the ref and rest props go on the select', () => {
    const ref = createRef<HTMLSelectElement>();
    const { container } = render(
      <Select ref={ref} aria-label="Color" className="extra" name="color" data-testid="control" defaultValue="danger">
        {options}
      </Select>,
    );
    const select = screen.getByTestId('control');
    expect((container.firstElementChild as HTMLElement).className).toBe('bit-select bit-md extra');
    expect(select.className).toBe('bit-select__control');
    expect(ref.current).toBe(select);
    expect(select).toHaveAttribute('name', 'color');
    expect(select).toHaveValue('danger');
  });

  it('renders native options and changes value from the keyboard or mouse', async () => {
    render(<Select aria-label="Color">{options}</Select>);
    const select = screen.getByRole('combobox');
    expect(screen.getAllByRole('option')).toHaveLength(2);
    await userEvent.selectOptions(select, 'danger');
    expect(select).toHaveValue('danger');
  });

  it('invalid sets aria-invalid="true"; without it there is no aria-invalid', () => {
    const { rerender } = render(
      <Select aria-label="Color" invalid>
        {options}
      </Select>,
    );
    expect(screen.getByRole('combobox')).toHaveAttribute('aria-invalid', 'true');
    rerender(<Select aria-label="Color">{options}</Select>);
    expect(screen.getByRole('combobox')).not.toHaveAttribute('aria-invalid');
  });

  it('disabled reaches the native select', () => {
    render(
      <Select aria-label="Color" disabled>
        {options}
      </Select>,
    );
    expect(screen.getByRole('combobox')).toBeDisabled();
  });

  it('inside a Field it takes the label, the error description and the invalid state', () => {
    const { container } = render(
      <Field label="Color" error="Pick a color.">
        <Select>{options}</Select>
      </Field>,
    );
    const select = screen.getByRole('combobox', { name: 'Color' });
    expect(select).toHaveAttribute('aria-invalid', 'true');
    expect(select).toHaveAttribute('aria-describedby', container.querySelector('.bit-field__error')!.id);
  });

  it('rejects the legacy DOM color attribute and does not render it', () => {
    render(
      // @ts-expect-error color is not part of SelectProps
      <Select aria-label="Color" color="danger">
        {options}
      </Select>,
    );
    expect(screen.getByRole('combobox')).not.toHaveAttribute('color');
  });

  it('has no accessibility violations, alone or in a Field with an error', async () => {
    const { container } = render(
      <>
        <Select aria-label="Size">{options}</Select>
        <Field label="Color" error="Pick a color.">
          <Select>{options}</Select>
        </Field>
      </>,
    );
    await expectNoA11yViolations(container);
  });
});
