import { describe, expect, it } from 'vitest';
import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import { Text } from './Text';
import { expectNoA11yViolations } from '../../test/a11y';

describe('Text', () => {
  it('renders a <p> with size md and normal weight by default', () => {
    render(<Text>Hello</Text>);
    const el = screen.getByText('Hello');
    expect(el.tagName).toBe('P');
    expect(el.className).toBe('bit-text bit-md');
    expect(el).toHaveAttribute('data-weight', 'normal');
  });

  it('renders the element given by `as` and maps size, tone, and weight', () => {
    render(<Text as="h2" size="2xl" tone="neutral" weight="bold">Title</Text>);
    const el = screen.getByRole('heading', { level: 2 });
    expect(el.className).toBe('bit-text bit-neutral bit-2xl');
    expect(el).toHaveAttribute('data-weight', 'bold');
  });

  it('appends className last and forwards the ref', () => {
    const ref = createRef<HTMLElement>();
    render(<Text ref={ref} as="span" className="extra">x</Text>);
    expect(screen.getByText('x').className).toBe('bit-text bit-md extra');
    expect(ref.current).toBe(screen.getByText('x'));
  });

  it('has no accessibility violations as a heading', async () => {
    const { container } = render(<Text as="h1" size="xl">Press Start</Text>);
    await expectNoA11yViolations(container);
  });
});
