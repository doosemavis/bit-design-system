import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import { Text } from './Text';
import { TEXT_SIZES } from '../../system/axes';
import { expectNoA11yViolations } from '../../test/a11y';
import { resetDeprecationWarnings } from '../../system/warnDeprecated';

describe('Text', () => {
  // The deprecation warning fires once per page session, so each test starts with a fresh one.
  beforeEach(() => resetDeprecationWarnings());
  afterEach(() => vi.restoreAllMocks());

  it('renders a <p> at 16px and normal weight by default', () => {
    render(<Text>Hello</Text>);
    const el = screen.getByText('Hello');
    expect(el.tagName).toBe('P');
    expect(el.className).toBe('bit-text');
    expect(el).toHaveAttribute('data-size', '16');
    expect(el).toHaveAttribute('data-weight', 'normal');
  });

  it('renders the element given by `as` and maps size, color, and weight', () => {
    render(<Text as="h2" size={32} color="neutral" weight="bold">Title</Text>);
    const el = screen.getByRole('heading', { level: 2 });
    expect(el.className).toBe('bit-text bit-neutral');
    expect(el).toHaveAttribute('data-size', '32');
    expect(el).toHaveAttribute('data-weight', 'bold');
  });

  it.each([
    [11, 14],
    [13, 14],
    [15, 16],
  ] as const)('size={%i} (an old odd size) renders as %i and warns once (removed in 0.2.0)', (old, even) => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(
      <>
        <Text size={old}>a</Text>
        <Text size={old}>b</Text>
      </>,
    );
    expect(screen.getByText('a')).toHaveAttribute('data-size', String(even));
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalledWith(
      `[bit] Text size={${old}} is deprecated: the scale is even now (14, 16, 18, 24, 32, 40). Use size={${even}}. It will be removed in 0.2.0.`,
    );
  });

  it('size="13" from untyped JS or MDX is the old form too', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(<Text size={'13' as unknown as 13}>m</Text>);
    expect(screen.getByText('m')).toHaveAttribute('data-size', '14');
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it('no current size warns', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(<>{TEXT_SIZES.map((n) => <Text key={n} size={n}>{n}</Text>)}</>);
    expect(warn).not.toHaveBeenCalled();
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
