import { describe, expect, it, vi } from 'vitest';
import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from './Button';
import { COLORS, VARIANTS } from '../../system/axes';
import { expectNoA11yViolations } from '../../test/a11y';

describe('Button', () => {
  it('renders a <button type="button"> with the default decorators', () => {
    render(<Button>Save</Button>);
    const btn = screen.getByRole('button', { name: 'Save' });
    expect(btn).toHaveAttribute('type', 'button');
    expect(btn.className).toBe('bit-button bit-primary bit-solid bit-md');
  });

  it('maps color, variant, and size to decorator classes', () => {
    render(<Button color="danger" variant="outline" size="lg">Delete</Button>);
    expect(screen.getByRole('button').className).toBe('bit-button bit-danger bit-outline bit-lg');
  });

  it('appends className last so it can override a decorator', () => {
    render(<Button className="bit-danger">X</Button>);
    expect(screen.getByRole('button').className).toBe('bit-button bit-solid bit-md bit-danger');
  });

  it('a color decorator in className overrides the color prop', () => {
    render(<Button color="danger" className="bit-primary">X</Button>);
    expect(screen.getByRole('button').className).toBe('bit-button bit-solid bit-md bit-primary');
  });

  it('forwards the ref and spreads unknown props onto the button', () => {
    const ref = createRef<HTMLButtonElement>();
    render(<Button ref={ref} data-testid="save">Save</Button>);
    expect(ref.current).toBe(screen.getByTestId('save'));
  });

  it('loading sets data-loading and aria-busy and disables the button', () => {
    render(<Button loading>Saving</Button>);
    const btn = screen.getByRole('button');
    expect(btn).toHaveAttribute('data-loading');
    expect(btn).toHaveAttribute('aria-busy', 'true');
    expect(btn).toBeDisabled();
  });

  it('does not fire onClick when disabled', async () => {
    const onClick = vi.fn();
    render(<Button disabled onClick={onClick}>Nope</Button>);
    await userEvent.click(screen.getByRole('button'));
    expect(onClick).not.toHaveBeenCalled();
  });

  it('asChild renders the child element with Button classes and no type attribute', () => {
    render(
      <Button asChild color="neutral">
        <a href="/docs">Docs</a>
      </Button>,
    );
    const link = screen.getByRole('link', { name: 'Docs' });
    expect(link.className).toBe('bit-button bit-neutral bit-solid bit-md');
    expect(link).not.toHaveAttribute('type');
  });

  it('asChild + loading renders an inert link: aria-disabled, aria-busy, data-loading, no disabled attribute', () => {
    render(
      <Button asChild loading>
        <a href="/pay">Pay</a>
      </Button>,
    );
    const link = screen.getByRole('link', { name: 'Pay' });
    expect(link).toHaveAttribute('aria-disabled', 'true');
    expect(link).toHaveAttribute('aria-busy', 'true');
    expect(link).toHaveAttribute('data-loading');
    expect(link).not.toHaveAttribute('disabled');
  });

  describe('asChild', () => {
    it('renders only the child element, keeping its own attributes', () => {
      const { container } = render(
        <Button asChild>
          <a href="/docs">Docs</a>
        </Button>,
      );
      expect(container.innerHTML).toBe('<a href="/docs" class="bit-button bit-primary bit-solid bit-md">Docs</a>');
    });

    it('joins the bit classes (with className last) before the child className', () => {
      render(
        <Button asChild size="sm" className="extra">
          <a href="/docs" className="router-active">
            Docs
          </a>
        </Button>,
      );
      expect(screen.getByRole('link').className).toBe('bit-button bit-primary bit-solid bit-sm extra router-active');
    });

    it('merges style with the child winning a clash', () => {
      render(
        <Button asChild style={{ color: 'red', marginTop: 4 }}>
          <a href="/docs" style={{ color: 'blue' }}>
            Docs
          </a>
        </Button>,
      );
      const link = screen.getByRole('link');
      expect(link.style.color).toBe('blue');
      expect(link.style.marginTop).toBe('4px');
    });

    it('runs both onClick handlers, the child first', async () => {
      const calls: string[] = [];
      render(
        <Button asChild onClick={() => calls.push('button')}>
          <a href="#docs" onClick={() => calls.push('child')}>
            Docs
          </a>
        </Button>,
      );
      await userEvent.click(screen.getByRole('link'));
      expect(calls).toEqual(['child', 'button']);
    });

    it('forwards the ref to the child and still feeds the child ref', () => {
      const ref = createRef<HTMLButtonElement>();
      const childRef = vi.fn();
      render(
        <Button asChild ref={ref}>
          <a href="/docs" ref={childRef}>
            Docs
          </a>
        </Button>,
      );
      const link = screen.getByRole('link');
      expect(ref.current).toBe(link);
      expect(childRef).toHaveBeenCalledWith(link);
    });

    it('keeps the child callback ref stable across re-renders', () => {
      const ref = createRef<HTMLButtonElement>();
      const childRef = vi.fn();
      const ui = (label: string) => (
        <Button asChild ref={ref}>
          <a href="/docs" ref={childRef}>
            {label}
          </a>
        </Button>
      );
      const { rerender } = render(ui('Docs'));
      rerender(ui('Docs again'));
      expect(childRef).toHaveBeenCalledTimes(1);
    });

    it('runs a cleanup the child callback ref returns (React 19) instead of calling it with null', () => {
      const ref = createRef<HTMLButtonElement>();
      const cleanup = vi.fn();
      const childRef = vi.fn(() => cleanup);
      const { unmount } = render(
        <Button asChild ref={ref}>
          <a href="/docs" ref={childRef}>
            Docs
          </a>
        </Button>,
      );
      unmount();
      expect(cleanup).toHaveBeenCalledTimes(1);
      expect(childRef).not.toHaveBeenCalledWith(null);
      expect(ref.current).toBeNull();
    });

    it('passes data and aria attributes through, the child winning a clash', () => {
      render(
        <Button asChild data-testid="docs" aria-label="from button" aria-describedby="hint">
          <a href="/docs" aria-label="from child">
            Docs
          </a>
        </Button>,
      );
      const link = screen.getByTestId('docs');
      expect(link).toHaveAttribute('aria-label', 'from child');
      expect(link).toHaveAttribute('aria-describedby', 'hint');
    });

    it('disabled renders aria-disabled on the child, never a disabled attribute', () => {
      render(
        <Button asChild disabled>
          <a href="/docs">Docs</a>
        </Button>,
      );
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('aria-disabled', 'true');
      expect(link).not.toHaveAttribute('disabled');
      expect(link).not.toHaveAttribute('data-loading');
      expect(link).not.toHaveAttribute('aria-busy');
    });
  });

  const combos = COLORS.flatMap((color) => VARIANTS.map((variant) => [color, variant] as const));
  it.each(combos)('color=%s variant=%s has no accessibility violations', async (color, variant) => {
    const { container } = render(<Button color={color} variant={variant}>Go</Button>);
    await expectNoA11yViolations(container);
  });
});
