import { afterEach, describe, expect, it, vi } from 'vitest';
import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import { Heading } from './Heading';
import { expectNoA11yViolations } from '../../test/a11y';

const LEVELS = [1, 2, 3, 4, 5, 6] as const;

describe('Heading', () => {
  afterEach(() => vi.restoreAllMocks());

  it.each(LEVELS)('level={%i} renders that heading tag, looking like that level', (level) => {
    render(<Heading level={level}>Title</Heading>);
    const heading = screen.getByRole('heading', { level, name: 'Title' });
    expect(heading.tagName).toBe(`H${level}`);
    expect(heading.className).toBe('bit-heading');
    expect(heading).toHaveAttribute('data-level', String(level));
  });

  it('size changes the look and keeps the tag: an h2 that looks like an h3', () => {
    render(
      <Heading level={2} size={3}>
        Section
      </Heading>,
    );
    const heading = screen.getByRole('heading', { level: 2, name: 'Section' });
    expect(heading).toHaveAttribute('data-level', '3');
  });

  it('drops an unknown level with a warning and falls back to an h2 with no data-level', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    // @ts-expect-error 7 is not a heading level
    render(<Heading level={7}>Title</Heading>);
    const heading = screen.getByRole('heading', { level: 2, name: 'Title' });
    expect(heading).not.toHaveAttribute('data-level');
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0]?.[0]).toContain('level="7"');
  });

  it('an unknown level with a valid size still takes the size as its look', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    // @ts-expect-error 0 is not a heading level
    render(<Heading level={0} size={4}>Title</Heading>);
    expect(screen.getByRole('heading', { level: 2 })).toHaveAttribute('data-level', '4');
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it('drops an unknown size with a warning and keeps the tag', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    // @ts-expect-error "lg" is not a heading size
    render(<Heading level={3} size="lg">Title</Heading>);
    const heading = screen.getByRole('heading', { level: 3 });
    expect(heading).not.toHaveAttribute('data-level');
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0]?.[0]).toContain('size="lg"');
  });

  it('a missing level (an untyped caller) is an h2 and warns, like a typo would', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    // @ts-expect-error level is required
    render(<Heading>Title</Heading>);
    expect(screen.getByRole('heading', { level: 2 })).not.toHaveAttribute('data-level');
    expect(warn.mock.calls[0]?.[0]).toContain('level="undefined"');
  });

  it('accepts a number-like string level from an untyped caller without warning', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(<Heading level={'4' as never}>Title</Heading>);
    expect(screen.getByRole('heading', { level: 4 })).toHaveAttribute('data-level', '4');
    expect(warn).not.toHaveBeenCalled();
  });

  it('puts the ref, className (last) and rest props on the heading', () => {
    const ref = createRef<HTMLHeadingElement>();
    render(
      <Heading ref={ref} level={1} className="extra" id="top" tabIndex={-1}>
        Title
      </Heading>,
    );
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading.className).toBe('bit-heading extra');
    expect(ref.current).toBe(heading);
    expect(heading).toHaveAttribute('id', 'top');
    expect(heading).toHaveAttribute('tabindex', '-1');
  });

  it('rejects the legacy DOM color attribute and does not render it', () => {
    render(
      // @ts-expect-error color is not part of HeadingProps
      <Heading level={2} color="danger">
        Title
      </Heading>,
    );
    expect(screen.getByRole('heading')).not.toHaveAttribute('color');
  });

  it('has no accessibility violations at any level', async () => {
    const { container } = render(
      <>
        {LEVELS.map((level) => (
          <Heading key={level} level={level}>
            Level {level}
          </Heading>
        ))}
      </>,
    );
    expect(screen.getAllByRole('heading')).toHaveLength(6);
    await expectNoA11yViolations(container);
  });
});
