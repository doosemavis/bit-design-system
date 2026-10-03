import { describe, expect, it, vi } from 'vitest';
import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import { Input } from './Input';
import { SIZES } from '../../system/axes';
import { expectNoA11yViolations } from '../../test/a11y';

describe('Input', () => {
  it('renders a native input with the default size', () => {
    render(<Input aria-label="Email" />);
    const input = screen.getByRole('textbox', { name: 'Email' });
    expect(input.tagName).toBe('INPUT');
    expect(input.className).toBe('bit-input bit-md');
  });

  it.each(SIZES)('size=%s maps to bit-%s', (size) => {
    render(<Input aria-label="Email" size={size} />);
    expect(screen.getByRole('textbox').className).toBe(`bit-input bit-${size}`);
  });

  it('puts the ref, className and rest props on the input, and passes type through', () => {
    const ref = createRef<HTMLInputElement>();
    render(<Input ref={ref} aria-label="Search" type="search" className="extra" placeholder="Find" name="q" />);
    const input = screen.getByRole('searchbox', { name: 'Search' });
    expect(ref.current).toBe(input);
    expect(input.className).toBe('bit-input bit-md extra');
    expect(input).toHaveAttribute('type', 'search');
    expect(input).toHaveAttribute('placeholder', 'Find');
    expect(input).toHaveAttribute('name', 'q');
  });

  it('invalid sets aria-invalid="true"; without it there is no aria-invalid', () => {
    const { rerender } = render(<Input aria-label="Email" invalid />);
    expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true');
    rerender(<Input aria-label="Email" />);
    expect(screen.getByRole('textbox')).not.toHaveAttribute('aria-invalid');
  });

  it('disabled and required reach the native input', () => {
    render(<Input aria-label="Email" disabled required />);
    expect(screen.getByRole('textbox')).toBeDisabled();
    expect(screen.getByRole('textbox')).toBeRequired();
  });

  it('drops an unknown size with a warning instead of emitting a class', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    // @ts-expect-error xl is not a size
    render(<Input aria-label="Email" size="xl" />);
    expect(screen.getByRole('textbox').className).toBe('bit-input');
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it('rejects the legacy DOM color attribute and does not render it', () => {
    // @ts-expect-error color is not part of InputProps
    render(<Input aria-label="Email" color="danger" />);
    expect(screen.getByRole('textbox')).not.toHaveAttribute('color');
  });

  it.each([false, true])('has no accessibility violations (invalid=%s)', async (invalid) => {
    const { container } = render(<Input aria-label="Email" invalid={invalid} />);
    await expectNoA11yViolations(container);
  });
});
