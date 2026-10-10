import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import { Heading } from './Heading';
import { Text } from '../Text/Text';
import { expectNoA11yViolations } from '../../test/a11y';
import { resetDeprecationWarnings } from '../../system/warnDeprecated';

/** Every size and the tag it renders: 40 and up h1, 32 to 38 h2, 26 to 30 h3, 24 h4, 22 h5, 20 h6. */
const SIZE_TAG = [
  [20, 6],
  [22, 5],
  [24, 4],
  [26, 3],
  [28, 3],
  [30, 3],
  [32, 2],
  [34, 2],
  [36, 2],
  [38, 2],
  [40, 1],
  [42, 1],
  [44, 1],
] as const;

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

  it.each(SIZE_TAG)('size={%i} renders an h%i at that size, with no warning', (size, level) => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(<Heading size={size}>Title</Heading>);
    const heading = screen.getByRole('heading', { level, name: 'Title' });
    expect(heading.tagName).toBe(`H${level}`);
    expect(heading).toHaveAttribute('data-size', String(size));
    expect(warn).not.toHaveBeenCalled();
  });

  it.each([14, 16, 18, 46, 21])('drops size={%i}, outside 20 to 44 or odd, with a warning and renders the 32px h2', (size) => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(<Heading size={size as never}>Title</Heading>);
    expect(screen.getByRole('heading', { level: 2 })).toHaveAttribute('data-size', '32');
    expect(warn.mock.calls[0]?.[0]).toContain(`size="${size}"`);
  });

  it('drops an unknown size string with a warning', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    // @ts-expect-error "lg" is not a heading size
    render(<Heading size="lg">Title</Heading>);
    expect(screen.getByRole('heading', { level: 2 })).toHaveAttribute('data-size', '32');
    expect(warn.mock.calls[0]?.[0]).toContain('size="lg"');
  });

  it('a number-like string size from an untyped caller works the same', () => {
    render(<Heading size={'40' as never}>Title</Heading>);
    expect(screen.getByRole('heading', { level: 1 })).toHaveAttribute('data-size', '40');
  });

  it('a Text inside it renders a span, so the heading holds no paragraph', () => {
    render(
      <Heading>
        Release notes <Text color="neutral">v0.1.8</Text>
      </Heading>,
    );
    expect(screen.getByText('v0.1.8').tagName).toBe('SPAN');
  });

  describe('deprecated: level (removed in 0.2.0)', () => {
    it.each([
      [1, 40],
      [2, 32],
      [3, 26],
      [4, 24],
      [5, 22],
      [6, 20],
    ] as const)('level={%i} keeps its old tag and look, and warns once to use size={%i}', (level, px) => {
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
        `[bit] Heading level={${level}} is deprecated: the size picks the tag now. Use size={${px}}, which renders an h${level}. It will be removed in 0.2.0.`,
      );
    });

    it('level with a px size keeps the level tag and takes the size as its look', () => {
      vi.spyOn(console, 'warn').mockImplementation(() => {});
      render(
        <Heading level={2} size={24}>
          Title
        </Heading>,
      );
      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading).toHaveAttribute('data-size', '24');
      expect(heading).not.toHaveAttribute('data-level');
    });

    it('a number-like string level from an untyped caller works the same', () => {
      vi.spyOn(console, 'warn').mockImplementation(() => {});
      render(<Heading level={'4' as never}>Title</Heading>);
      expect(screen.getByRole('heading', { level: 4 })).toHaveAttribute('data-level', '4');
    });

    it('an unknown level warns and falls back to the 32px h2', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      // @ts-expect-error 7 is not a heading level
      render(<Heading level={7}>Title</Heading>);
      expect(screen.getByRole('heading', { level: 2 })).toHaveAttribute('data-size', '32');
      expect(warn.mock.calls[0]?.[0]).toContain('level="7"');
    });
  });

  describe('deprecated: size={1..6}, a level (removed in 0.2.0)', () => {
    it.each([
      [1, 40],
      [2, 32],
      [3, 26],
      [4, 24],
      [5, 22],
      [6, 20],
    ] as const)('size={%i} keeps that level look and warns once to use size={%i}', (old, px) => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      render(
        <>
          <Heading size={old}>a</Heading>
          <Heading size={old}>b</Heading>
        </>,
      );
      const heading = screen.getByRole('heading', { name: 'a' });
      expect(heading.tagName).toBe('H2');
      expect(heading).toHaveAttribute('data-level', String(old));
      expect(heading).not.toHaveAttribute('data-size');
      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn).toHaveBeenCalledWith(
        `[bit] Heading size={${old}} is deprecated: size is now in px, every 2px from 20 to 44, and it picks the tag. Use size={${px}}, which renders an h${old}. It will be removed in 0.2.0.`,
      );
    });

    it('with level, the old size keeps the level tag (the 0.1.7 form)', () => {
      vi.spyOn(console, 'warn').mockImplementation(() => {});
      render(
        <Heading level={2} size={3}>
          Title
        </Heading>,
      );
      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading).toHaveAttribute('data-level', '3');
    });
  });

  it('puts the ref, className (last) and rest props on the heading', () => {
    const ref = createRef<HTMLHeadingElement>();
    render(
      <Heading ref={ref} size={40} className="extra" id="top" tabIndex={-1}>
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

  it('has no accessibility violations at any size', async () => {
    const { container } = render(
      <>
        {SIZE_TAG.map(([size]) => (
          <Heading key={size} size={size}>
            {`Size ${size}`}
          </Heading>
        ))}
      </>,
    );
    expect(screen.getAllByRole('heading')).toHaveLength(13);
    await expectNoA11yViolations(container);
  });
});
