import { createRef } from 'react';
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { Icon } from './Icon';
import { Button } from '../Button/Button';
import { iconDelete, iconFavorite } from '../../icons/icons.generated';
import { COLORS, SIZES } from '../../system/axes';

const svg = (container: HTMLElement) => container.querySelector('svg')!;

describe('Icon', () => {
  it('draws the icon path on the 960 grid, decorative and unfocusable by default', () => {
    const { container } = render(<Icon icon={iconFavorite} />);
    const el = svg(container);
    expect(el).toHaveAttribute('viewBox', '0 -960 960 960');
    expect(el.querySelector('path')).toHaveAttribute('d', iconFavorite.path);
    expect(el).toHaveAttribute('aria-hidden', 'true');
    expect(el).toHaveAttribute('focusable', 'false');
    expect(el).not.toHaveAttribute('role');
  });

  it('carries bit-icon, bit-icon-{name} and bit-md, and no colour class by default', () => {
    const { container } = render(<Icon icon={iconFavorite} />);
    expect(svg(container)).toHaveClass('bit-icon', 'bit-icon-favorite', 'bit-md');
    for (const color of COLORS) expect(svg(container)).not.toHaveClass(`bit-${color}`);
  });

  it.each(SIZES)('size %s sets bit-%s', (size) => {
    const { container } = render(<Icon icon={iconFavorite} size={size} />);
    expect(svg(container)).toHaveClass(`bit-${size}`);
  });

  it.each(COLORS)('color %s sets bit-%s', (color) => {
    const { container } = render(<Icon icon={iconFavorite} color={color} />);
    expect(svg(container)).toHaveClass(`bit-${color}`);
  });

  it('a label names it for screen readers: role img, aria-label, not hidden', () => {
    const { getByRole } = render(<Icon icon={iconDelete} label="Delete" />);
    expect(getByRole('img', { name: 'Delete' })).not.toHaveAttribute('aria-hidden');
  });

  it('an empty label stays decorative', () => {
    const { container } = render(<Icon icon={iconDelete} label="" />);
    expect(svg(container)).toHaveAttribute('aria-hidden', 'true');
    expect(svg(container)).not.toHaveAttribute('role');
  });

  it('forwards the ref, merges className last, and passes other svg props through', () => {
    const ref = createRef<SVGSVGElement>();
    const { container } = render(<Icon ref={ref} icon={iconFavorite} className="extra" data-testid="i" />);
    expect(ref.current).toBe(svg(container));
    expect(svg(container).getAttribute('class')!.split(' ').at(-1)).toBe('extra');
    expect(svg(container)).toHaveAttribute('data-testid', 'i');
  });

  it('className="bit-danger" wins over the color prop, as on every component', () => {
    const { container } = render(<Icon icon={iconFavorite} color="primary" className="bit-danger" />);
    expect(svg(container)).toHaveClass('bit-danger');
    expect(svg(container)).not.toHaveClass('bit-primary');
  });

  it('inside a coloured Button an icon without its own colour carries no colour class (it inherits the text colour)', () => {
    const { container } = render(
      <Button color="primary">
        <Icon icon={iconFavorite} /> Like
      </Button>,
    );
    expect(svg(container).getAttribute('class')).toBe('bit-icon bit-md bit-icon-favorite');
  });
});
