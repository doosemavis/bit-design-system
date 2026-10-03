import { afterEach, describe, expect, it, vi } from 'vitest';
import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import { Text } from './Text';
import { TEXT_SIZES } from '../../system/axes';
import { expectNoA11yViolations } from '../../test/a11y';

describe('Text', () => {
  afterEach(() => vi.restoreAllMocks());

  it('renders a <p> at 15px and normal weight by default', () => {
    render(<Text>Hello</Text>);
    const el = screen.getByText('Hello');
    expect(el.tagName).toBe('P');
    expect(el.className).toBe('bit-text');
    expect(el).toHaveAttribute('data-size', '15');
    expect(el).toHaveAttribute('data-weight', 'normal');
  });

  it('renders the element given by `as` and maps size, color, and weight', () => {
    render(<Text as="h2" size={32} color="neutral" weight="bold">Title</Text>);
    const el = screen.getByRole('heading', { level: 2 });
    expect(el.className).toBe('bit-text bit-neutral');
    expect(el).toHaveAttribute('data-size', '32');
    expect(el).toHaveAttribute('data-weight', 'bold');
  });

  it.each(TEXT_SIZES)('size={%i} renders data-size with the same px number', (n) => {
    render(<Text size={n}>x</Text>);
    expect(screen.getByText('x')).toHaveAttribute('data-size', String(n));
  });

  it('drops an old size name from an untyped caller and warns in development', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    // @ts-expect-error "lg" was the old name for 18px; size is the px value now
    render(<Text size="lg">x</Text>);
    expect(screen.getByText('x')).not.toHaveAttribute('data-size');
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0]?.[0]).toContain('size="lg"');
  });

  it('appends className last and forwards the ref', () => {
    const ref = createRef<HTMLElement>();
    render(<Text ref={ref} as="span" className="extra">x</Text>);
    expect(screen.getByText('x').className).toBe('bit-text extra');
    expect(ref.current).toBe(screen.getByText('x'));
  });

  it('has no accessibility violations as a heading', async () => {
    const { container } = render(<Text as="h1" size={24}>Press Start</Text>);
    await expectNoA11yViolations(container);
  });
});
