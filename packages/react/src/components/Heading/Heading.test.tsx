import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import { Heading } from './Heading';
import { expectNoA11yViolations } from '../../test/a11y';
import { resetDeprecationWarnings } from '../../system/warnDeprecated';

const TAGS = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] as const;
const SIZES = [14, 16, 18, 24, 32, 40] as const;
/** Each tag's own px size, used when size is left off. */
const TAG_PX = { h1: 40, h2: 32, h3: 24, h4: 18, h5: 16, h6: 14 } as const;

describe('Heading', () => {
  beforeEach(() => resetDeprecationWarnings());
  afterEach(() => vi.restoreAllMocks());

  it('is an h2 at 32px with no props', () => {
    render(<Heading>Title</Heading>);
    const heading = screen.getByRole('heading', { level: 2, name: 'Title' });
    expect(heading.tagName).toBe('H2');
    expect(heading.className).toBe('bit-heading');
    expect(heading).toHaveAttribute('data-size', '32');
    expect(heading).not.toHaveAttribute('data-level');
  });

  it.each(TAGS)('as="%s" renders that tag at its own px size', (tag) => {
    render(<Heading as={tag}>Title</Heading>);
    const heading = screen.getByRole('heading', { level: Number(tag[1]), name: 'Title' });
    expect(heading.tagName).toBe(tag.toUpperCase());
    expect(heading).toHaveAttribute('data-size', String(TAG_PX[tag]));
  });

  it.each(SIZES)('size={%i} sets the look and keeps the tag', (size) => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(
      <Heading as="h2" size={size}>
        Section
      </Heading>,
    );
    const heading = screen.getByRole('heading', { level: 2, name: 'Section' });
    expect(heading).toHaveAttribute('data-size', String(size));
    expect(warn).not.toHaveBeenCalled();
  });

  it('drops an unknown as with a warning and falls back to an h2', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    // @ts-expect-error "p" is not a heading tag
    render(<Heading as="p">Title</Heading>);
    expect(screen.getByRole('heading', { level: 2 })).toHaveAttribute('data-size', '32');
    expect(warn.mock.calls[0]?.[0]).toContain('as="p"');
  });

  it("drops an unknown size with a warning and keeps the tag's own size", () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    // @ts-expect-error "lg" is not a heading size
    render(<Heading as="h3" size="lg">Title</Heading>);
    expect(screen.getByRole('heading', { level: 3 })).toHaveAttribute('data-size', '24');
    expect(warn.mock.calls[0]?.[0]).toContain('size="lg"');
  });

  it('drops 11, an old Text size, since a heading never goes under 14px', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    // @ts-expect-error 11 is not a heading size
    render(<Heading as="h5" size={11}>Title</Heading>);
    expect(screen.getByRole('heading', { level: 5 })).toHaveAttribute('data-size', '16');
    expect(warn.mock.calls[0]?.[0]).toContain('size="11"');
  });

  describe('deprecated: level (removed in 0.2.0)', () => {
    it.each([
      [1, 32],
      [2, 24],
      [3, 18],
      [4, 16],
      [5, 14],
      [6, 14],
    ] as const)('level={%i} keeps its old tag and look, and warns once to use as with size={%i}', (level, px) => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      render(
        <>
          <Heading level={level}>a</Heading>
          <Heading level={level}>b</Heading>
        </>,
      );
      const heading = screen.getByRole('heading', { name: 'a' });
      expect(heading.tagName).toBe(`H${level}`);
      expect(heading).toHaveAttribute('data-level', String(level));
      expect(heading).not.toHaveAttribute('data-size');
      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn).toHaveBeenCalledWith(
        `[bit] Heading level={${level}} is deprecated: use as="h${level}" size={${px}}, which keeps this look. It will be removed in 0.2.0.`,
      );
    });

    it('level with a px size takes the size as its look', () => {
      vi.spyOn(console, 'warn').mockImplementation(() => {});
      render(
        <Heading level={2} size={18}>
          Title
        </Heading>,
      );
      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading).toHaveAttribute('data-size', '18');
      expect(heading).not.toHaveAttribute('data-level');
    });

    it('as wins over level for the tag', () => {
      vi.spyOn(console, 'warn').mockImplementation(() => {});
      render(
        <Heading as="h3" level={2}>
          Title
        </Heading>,
      );
      expect(screen.getByRole('heading', { level: 3 })).toHaveAttribute('data-size', '24');
    });

    it('a number-like string level from an untyped caller works the same', () => {
      vi.spyOn(console, 'warn').mockImplementation(() => {});
      render(<Heading level={'4' as never}>Title</Heading>);
      expect(screen.getByRole('heading', { level: 4 })).toHaveAttribute('data-level', '4');
    });

    it('an unknown level warns and falls back to the h2 default', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      // @ts-expect-error 7 is not a heading level
      render(<Heading level={7}>Title</Heading>);
      expect(screen.getByRole('heading', { level: 2 })).toHaveAttribute('data-size', '32');
      expect(warn.mock.calls[0]?.[0]).toContain('level="7"');
    });
  });

  describe('deprecated: size={1..6}, a level (removed in 0.2.0)', () => {
    it.each([
      [1, 32],
      [2, 24],
      [3, 18],
      [4, 16],
      [5, 14],
      [6, 14],
    ] as const)('size={%i} keeps that level look and warns once to use size={%i}', (old, px) => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      render(
        <>
          <Heading as="h2" size={old}>
            a
          </Heading>
          <Heading as="h2" size={old}>
            b
          </Heading>
        </>,
      );
      const heading = screen.getByRole('heading', { name: 'a' });
      expect(heading.tagName).toBe('H2');
      expect(heading).toHaveAttribute('data-level', String(old));
      expect(heading).not.toHaveAttribute('data-size');
      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn).toHaveBeenCalledWith(
        `[bit] Heading size={${old}} is deprecated: size is now in px (14, 16, 18, 24, 32, 40). Use size={${px}}. It will be removed in 0.2.0.`,
      );
    });
  });

  it('puts the ref, className (last) and rest props on the heading', () => {
    const ref = createRef<HTMLHeadingElement>();
    render(
      <Heading ref={ref} as="h1" className="extra" id="top" tabIndex={-1}>
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
      <Heading color="danger">Title</Heading>,
    );
    expect(screen.getByRole('heading')).not.toHaveAttribute('color');
  });

  it('has no accessibility violations at any tag', async () => {
    const { container } = render(
      <>
        {TAGS.map((tag) => (
          <Heading key={tag} as={tag}>
            {tag}
          </Heading>
        ))}
      </>,
    );
    expect(screen.getAllByRole('heading')).toHaveLength(6);
    await expectNoA11yViolations(container);
  });
});
