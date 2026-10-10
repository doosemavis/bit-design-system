import { createRef } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { IconButton } from './IconButton';
import { iconDelete } from '../../icons/icons.generated';
import { COLORS, SIZES, VARIANTS } from '../../system/axes';
import { expectNoA11yViolations } from '../../test/a11y';

describe('IconButton', () => {
  it('is a type="button" named by its label, square neutral outline md by default, with a decorative icon', () => {
    render(<IconButton icon={iconDelete} label="Delete" />);
    const button = screen.getByRole('button', { name: 'Delete' });
    expect(button).toHaveAttribute('type', 'button');
    expect(button).toHaveClass('bit-iconButton', 'bit-button', 'bit-neutral', 'bit-outline', 'bit-md');
    const svg = button.querySelector('svg')!;
    expect(svg).toHaveClass('bit-icon', 'bit-icon-delete');
    expect(svg).toHaveAttribute('aria-hidden', 'true');
  });
  it.each(SIZES)('size %s puts the size class on the button; icon-button.css sizes the icon from it', (size) => {
    render(<IconButton icon={iconDelete} label="Delete" size={size} />);
    expect(screen.getByRole('button')).toHaveClass(`bit-${size}`);
    expect(screen.getByRole('button').querySelector('svg')).toBeInTheDocument();
  });
  it('className="bit-lg" puts bit-lg on the button, the condition of the lg icon rule', () => {
    render(<IconButton icon={iconDelete} label="Delete" className="bit-lg" />);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('bit-iconButton', 'bit-lg');
    expect(button.querySelector(':scope > .bit-icon')).not.toBeNull();
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
  it('keeps the same focused button when tooltip toggles between unset and set', () => {
    const { rerender } = render(<IconButton icon={iconDelete} label="Copy" />);
    const button = screen.getByRole('button');
    button.focus();
    expect(document.activeElement).toBe(button);
    rerender(<IconButton icon={iconDelete} label="Copy" tooltip="Copied" />);
    expect(screen.getByRole('button')).toBe(button);
    expect(document.activeElement).toBe(button);
    expect(screen.getByRole('tooltip')).toHaveTextContent('Copied');
    rerender(<IconButton icon={iconDelete} label="Copy" />);
    expect(screen.getByRole('button')).toBe(button);
    expect(document.activeElement).toBe(button);
    expect(screen.queryByRole('tooltip', { hidden: true })).toBeNull();
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

  it('has no accessibility violations, at rest or showing its tooltip', async () => {
    const { container } = render(<IconButton icon={iconDelete} label="Delete" tooltip="Delete" color="danger" variant="solid" />);
    await expectNoA11yViolations(container);
    fireEvent.pointerEnter(screen.getByRole('button', { name: 'Delete' }));
    expect(screen.getByRole('tooltip', { hidden: true })).toBeVisible();
    await expectNoA11yViolations(container);
  });
});
