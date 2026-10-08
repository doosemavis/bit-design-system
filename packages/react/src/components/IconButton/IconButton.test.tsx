import { createRef } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { IconButton } from './IconButton';
import { iconDelete } from '../../icons/icons.generated';
import { COLORS, SIZES, VARIANTS } from '../../system/axes';

describe('IconButton', () => {
  it('is a type="button" named by its label, square neutral outline md by default, with a decorative icon', () => {
    render(<IconButton icon={iconDelete} label="Delete" />);
    const button = screen.getByRole('button', { name: 'Delete' });
    expect(button).toHaveAttribute('type', 'button');
    expect(button).toHaveClass('bit-iconButton', 'bit-button', 'bit-neutral', 'bit-outline', 'bit-md');
    const svg = button.querySelector('svg')!;
    expect(svg).toHaveClass('bit-icon', 'bit-icon-delete', 'bit-md');
    expect(svg).toHaveAttribute('aria-hidden', 'true');
  });
  it.each(SIZES)('size %s sizes the button and its icon', (size) => {
    render(<IconButton icon={iconDelete} label="Delete" size={size} />);
    expect(screen.getByRole('button')).toHaveClass(`bit-${size}`);
    expect(screen.getByRole('button').querySelector('svg')).toHaveClass(`bit-${size}`);
  });
  it.each(COLORS)('color %s', (color) => {
    render(<IconButton icon={iconDelete} label="Delete" color={color} />);
    expect(screen.getByRole('button')).toHaveClass(`bit-${color}`);
  });
  it.each(VARIANTS)('variant %s', (variant) => {
    render(<IconButton icon={iconDelete} label="Delete" variant={variant} />);
    expect(screen.getByRole('button')).toHaveClass(`bit-${variant}`);
  });
  it('iconFilled draws the filled icon', () => {
    render(<IconButton icon={iconDelete} label="Delete" iconFilled />);
    expect(screen.getByRole('button').querySelector('path')).toHaveAttribute('d', iconDelete.fillPath);
  });
  it('has no tooltip by default, nor with tooltip=""', () => {
    const { rerender } = render(<IconButton icon={iconDelete} label="Delete" />);
    expect(screen.queryByRole('tooltip', { hidden: true })).toBeNull();
    rerender(<IconButton icon={iconDelete} label="Delete" tooltip="" />);
    expect(screen.queryByRole('tooltip', { hidden: true })).toBeNull();
  });
  it('tooltip shows on hover, and does not describe the button (the label already names it)', () => {
    render(<IconButton icon={iconDelete} label="Delete" tooltip="Delete" />);
    fireEvent.pointerEnter(screen.getByRole('button'));
    expect(screen.getByRole('tooltip')).toHaveTextContent('Delete');
    expect(screen.getByRole('button')).not.toHaveAttribute('aria-describedby');
  });
  it('forwards the ref and passes button props through', () => {
    const ref = createRef<HTMLButtonElement>();
    const onClick = vi.fn();
    render(<IconButton ref={ref} icon={iconDelete} label="Delete" onClick={onClick} disabled={false} className="extra" />);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(ref.current).toBe(screen.getByRole('button'));
    expect(screen.getByRole('button')).toHaveClass('extra');
  });
});
