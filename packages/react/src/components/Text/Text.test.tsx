import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import { Text } from './Text';
import { Button } from '../Button/Button';
import { Link } from '../Link/Link';
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

  it('maps size, color, and weight', () => {
    render(<Text size={32} color="neutral" weight="bold">Big</Text>);
    const el = screen.getByText('Big');
    expect(el.className).toBe('bit-text bit-neutral');
    expect(el).toHaveAttribute('data-size', '32');
    expect(el).toHaveAttribute('data-weight', 'bold');
  });

  it('a Text inside a Text renders a span, so the sentence stays one paragraph', () => {
    render(
      <Text>
        You have <Text weight="bold">3 coins</Text> left.
      </Text>,
    );
    expect(screen.getByText('3 coins').tagName).toBe('SPAN');
    expect(screen.getByText('3 coins').parentElement?.tagName).toBe('P');
  });

  it('a Text inside a Button or a Link renders a span', () => {
    render(
      <>
        <Button>
          <Text>Save</Text>
        </Button>
        <Link href="#top">
          <Text>Back to top</Text>
        </Link>
      </>,
    );
    expect(screen.getByText('Save').tagName).toBe('SPAN');
    expect(screen.getByText('Back to top').tagName).toBe('SPAN');
  });

  it('a Text next to (not inside) another renders a <p>', () => {
    render(
      <div>
        <Text>One</Text>
        <Text>Two</Text>
      </div>,
    );
    expect(screen.getByText('Two').tagName).toBe('P');
  });

  it('italic, underline and strikethrough are off by default, so no attribute is rendered', () => {
    render(<Text>Plain</Text>);
    const el = screen.getByText('Plain');
    for (const attr of ['data-italic', 'data-underline', 'data-strikethrough']) expect(el).not.toHaveAttribute(attr);
  });

  it.each(['italic', 'underline', 'strikethrough'] as const)('%s renders its empty data attribute', (style) => {
    render(<Text {...{ [style]: true }}>Styled</Text>);
    expect(screen.getByText('Styled')).toHaveAttribute(`data-${style}`, '');
  });

  it('the styles combine with each other and with weight', () => {
    render(
      <Text weight="bold" italic underline strikethrough>
        All
      </Text>,
    );
    const el = screen.getByText('All');
    expect(el).toHaveAttribute('data-weight', 'bold');
    for (const attr of ['data-italic', 'data-underline', 'data-strikethrough']) expect(el).toHaveAttribute(attr, '');
  });

  it('a styled Text inside a sentence stays inline', () => {
    render(
      <Text>
        It was <Text strikethrough>$20</Text> <Text italic>now</Text> $10.
      </Text>,
    );
    expect(screen.getByText('$20').tagName).toBe('SPAN');
    expect(screen.getByText('now')).toHaveAttribute('data-italic', '');
  });

  describe('deprecated: as (removed in 0.2.0)', () => {
    it('still renders the element given, and warns once', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      render(
        <>
          <Text as="span">a</Text>
          <Text as="label">b</Text>
        </>,
      );
      expect(screen.getByText('a').tagName).toBe('SPAN');
      expect(screen.getByText('b').tagName).toBe('LABEL');
      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn).toHaveBeenCalledWith(
        '[bit] Text as= is deprecated: Text renders a <p>, or a <span> inside a Text, Heading, Button or Link. For a title, use Heading. It will be removed in 0.2.0.',
      );
    });
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
    render(<Text ref={ref} className="extra">x</Text>);
    expect(screen.getByText('x').className).toBe('bit-text extra');
    expect(ref.current).toBe(screen.getByText('x'));
  });

  it('has no accessibility violations, nested or not', async () => {
    const { container } = render(
      <Text size={24}>
        Press <Text weight="bold">Start</Text>
      </Text>,
    );
    await expectNoA11yViolations(container);
  });
});
