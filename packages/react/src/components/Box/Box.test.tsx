import { afterEach, describe, expect, it, vi } from 'vitest';
import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import { Box } from './Box';
import type { BoxProps } from './Box';
import { SPACE_STEPS } from '../../system/axes';
import { expectNoA11yViolations } from '../../test/a11y';

/** Spec §2: each spacing prop and the attribute it renders. */
const ATTRIBUTES = [
  ['padding', 'data-p'],
  ['paddingX', 'data-px'],
  ['paddingY', 'data-py'],
  ['paddingTop', 'data-pt'],
  ['paddingRight', 'data-pr'],
  ['paddingBottom', 'data-pb'],
  ['paddingLeft', 'data-pl'],
  ['margin', 'data-m'],
  ['marginX', 'data-mx'],
  ['marginY', 'data-my'],
  ['marginTop', 'data-mt'],
  ['marginRight', 'data-mr'],
  ['marginBottom', 'data-mb'],
  ['marginLeft', 'data-ml'],
] as const;

/** 0, then the space scale: the nine values every spacing prop takes. */
const SPACES = [0, ...SPACE_STEPS] as const;

describe('Box', () => {
  afterEach(() => vi.restoreAllMocks());

  it('renders a plain div.bit-box with no spacing attributes by default', () => {
    render(<Box data-testid="b">x</Box>);
    const box = screen.getByTestId('b');
    expect(box.tagName).toBe('DIV');
    expect(box.className).toBe('bit-box');
    expect([...box.attributes].map((a) => a.name).sort()).toEqual(['class', 'data-testid']);
  });

  it.each(ATTRIBUTES)('%s renders %s with the px number', (prop, attribute) => {
    render(<Box {...({ [prop]: 24 } as BoxProps)} data-testid="b" />);
    expect(screen.getByTestId('b')).toHaveAttribute(attribute, '24');
  });

  it.each(SPACES)('padding={%i} renders data-p with the same number', (n) => {
    render(<Box padding={n} data-testid="b" />);
    expect(screen.getByTestId('b')).toHaveAttribute('data-p', String(n));
  });

  it('every prop at once renders all fourteen attributes', () => {
    const all = Object.fromEntries(ATTRIBUTES.map(([prop], i) => [prop, SPACES[i % SPACES.length]])) as BoxProps;
    render(<Box {...all} data-testid="b" />);
    const box = screen.getByTestId('b');
    ATTRIBUTES.forEach(([, attribute], i) => expect(box).toHaveAttribute(attribute, String(SPACES[i % SPACES.length])));
  });

  it('drops an off-scale value from an untyped caller and warns in development', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    // @ts-expect-error 10 is not on the space scale
    render(<Box paddingTop={10} marginX={8} data-testid="b" />);
    const box = screen.getByTestId('b');
    expect(box).not.toHaveAttribute('data-pt');
    expect(box).toHaveAttribute('data-mx', '8');
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0]?.[0]).toContain('paddingTop="10"');
  });

  it('accepts a number-like string from an untyped caller without warning', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(<Box margin={'0' as never} data-testid="b" />);
    expect(screen.getByTestId('b')).toHaveAttribute('data-m', '0');
    expect(warn).not.toHaveBeenCalled();
  });

  it('as changes the element', () => {
    render(
      <Box as="section" aria-label="Stats" padding={16}>
        x
      </Box>,
    );
    const region = screen.getByRole('region', { name: 'Stats' });
    expect(region.tagName).toBe('SECTION');
    expect(region).toHaveAttribute('data-p', '16');
  });

  it('an unknown as from an untyped caller falls back to a div, with a warning', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    // @ts-expect-error button is not a Box element; use Button
    render(<Box as="button" data-testid="b" />);
    expect(screen.getByTestId('b').tagName).toBe('DIV');
    expect(warn.mock.calls[0]?.[0]).toContain('as="button"');
  });

  it('puts the ref, className (last) and rest props on the element, and never passes spacing props to the DOM', () => {
    const ref = createRef<HTMLElement>();
    render(<Box ref={ref} as="span" className="extra" id="pad" paddingX={8} data-testid="b" />);
    const box = screen.getByTestId('b');
    expect(box.tagName).toBe('SPAN');
    expect(box.className).toBe('bit-box extra');
    expect(ref.current).toBe(box);
    expect(box).toHaveAttribute('id', 'pad');
    expect(box).not.toHaveAttribute('paddingX');
    expect(box).not.toHaveAttribute('paddingx');
  });

  it('rejects the legacy DOM color attribute and does not render it', () => {
    // @ts-expect-error color is not part of BoxProps
    render(<Box color="danger" data-testid="b" />);
    expect(screen.getByTestId('b')).not.toHaveAttribute('color');
  });

  it('has no accessibility violations', async () => {
    const { container } = render(
      <Box as="article" padding={16} marginTop={24}>
        <p>A padded article.</p>
      </Box>,
    );
    await expectNoA11yViolations(container);
  });
});
