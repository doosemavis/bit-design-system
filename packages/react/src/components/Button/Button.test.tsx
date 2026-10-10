import { describe, expect, it, vi } from 'vitest';
import { Fragment, createRef } from 'react';
import type { MouseEvent } from 'react';
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

  it('loading sets data-loading, aria-busy and aria-disabled, but not the disabled attribute', () => {
    render(<Button loading>Saving</Button>);
    const btn = screen.getByRole('button');
    expect(btn).toHaveAttribute('data-loading');
    expect(btn).toHaveAttribute('aria-busy', 'true');
    expect(btn).toHaveAttribute('aria-disabled', 'true');
    expect(btn).not.toBeDisabled();
  });

  it('a focused button that starts loading keeps focus, and stays in the Tab order', async () => {
    const user = userEvent.setup();
    const ui = (loading: boolean) => (
      <>
        <Button loading={loading}>Save</Button>
        <Button>Next</Button>
      </>
    );
    const { rerender } = render(ui(false));
    await user.tab();
    const save = screen.getByRole('button', { name: 'Save' });
    expect(save).toHaveFocus();
    rerender(ui(true));
    expect(save).toHaveFocus();
    await user.tab();
    await user.tab({ shift: true });
    expect(save).toHaveFocus();
  });

  it('loading blocks click, Enter and Space, and form submission', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    const onSubmit = vi.fn((event: { preventDefault: () => void }) => event.preventDefault());
    render(
      <form onSubmit={onSubmit}>
        <Button type="submit" loading onClick={onClick}>Pay</Button>
      </form>,
    );
    const btn = screen.getByRole('button', { name: 'Pay' });
    await user.click(btn);
    btn.focus();
    await user.keyboard('{Enter}');
    await user.keyboard(' ');
    expect(onClick).not.toHaveBeenCalled();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('other keys still reach a loading button', async () => {
    const user = userEvent.setup();
    const onKeyDown = vi.fn();
    render(<Button loading onKeyDown={onKeyDown}>Pay</Button>);
    screen.getByRole('button').focus();
    await user.keyboard('{Escape}');
    expect(onKeyDown).toHaveBeenCalledTimes(1);
  });

  it('when loading ends, clicks work again', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    const { rerender } = render(<Button loading onClick={onClick}>Pay</Button>);
    rerender(<Button onClick={onClick}>Pay</Button>);
    const btn = screen.getByRole('button');
    expect(btn).not.toHaveAttribute('aria-disabled');
    await user.click(btn);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('disabled and loading together: the native disabled attribute, still busy', () => {
    render(<Button disabled loading>Pay</Button>);
    const btn = screen.getByRole('button');
    expect(btn).toBeDisabled();
    expect(btn).toHaveAttribute('aria-busy', 'true');
    expect(btn).not.toHaveAttribute('aria-disabled');
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

    it('still runs its own onClick after the child handler prevents the default (as Radix Slot did)', async () => {
      const calls: string[] = [];
      render(
        <Button asChild onClick={() => calls.push('button')}>
          <a
            href="#docs"
            onClick={(event: MouseEvent) => {
              event.preventDefault();
              calls.push('child');
            }}
          >
            Docs
          </a>
        </Button>,
      );
      await userEvent.click(screen.getByRole('link'));
      expect(calls).toEqual(['child', 'button']);
    });

    it.each([
      ['no children', undefined],
      ['null', null],
      ['false', false],
    ])('renders nothing with %s (as Radix Slot did)', (_name, children) => {
      const { container } = render(<Button asChild>{children}</Button>);
      expect(container).toBeEmptyDOMElement();
    });

    it('gives a Fragment child no ref, so the Button ref stays null (as Radix Slot did)', () => {
      const ref = createRef<HTMLButtonElement>();
      vi.spyOn(console, 'error').mockImplementation(() => {});
      render(
        <Button asChild ref={ref}>
          <Fragment>
            <a href="/docs">Docs</a>
          </Fragment>
        </Button>,
      );
      vi.restoreAllMocks();
      expect(screen.getByRole('link')).toHaveAttribute('href', '/docs');
      expect(ref.current).toBeNull();
    });

    it('can go from no child to a child and back', () => {
      const ref = createRef<HTMLButtonElement>();
      const ui = (show: boolean) => (
        <Button asChild ref={ref}>
          {show && <a href="/docs">Docs</a>}
        </Button>
      );
      const { container, rerender } = render(ui(false));
      rerender(ui(true));
      expect(ref.current).toBe(screen.getByRole('link'));
      rerender(ui(false));
      expect(container).toBeEmptyDOMElement();
      expect(ref.current).toBeNull();
    });

    it.each([
      ['two children', [<a key="1" href="/a">A</a>, <a key="2" href="/b">B</a>]],
      ['a text child', 'Docs'],
      ['the number 0', 0],
    ])('throws a Button error with %s', (_name, children) => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
      expect(() => render(<Button asChild>{children}</Button>)).toThrow('[bit] Button asChild needs exactly one child element.');
      vi.restoreAllMocks();
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

    it.each([
      ['disabled', { disabled: true }],
      ['loading', { loading: true }],
    ])('%s: a click, Enter or Space never reaches the link or its handlers', async (_name, props) => {
      const user = userEvent.setup();
      const onClick = vi.fn();
      const childClick = vi.fn();
      const before = window.location.href;
      render(
        <Button asChild onClick={onClick} {...props}>
          <a href="#blocked" onClick={childClick}>
            Docs
          </a>
        </Button>,
      );
      const link = screen.getByRole('link');
      await user.click(link);
      link.focus();
      await user.keyboard('{Enter}');
      await user.keyboard(' ');
      expect(onClick).not.toHaveBeenCalled();
      expect(childClick).not.toHaveBeenCalled();
      expect(window.location.href).toBe(before);
    });

    it('disabled keeps the link in the Tab order', async () => {
      const user = userEvent.setup();
      render(
        <Button asChild disabled>
          <a href="/docs">Docs</a>
        </Button>,
      );
      await user.tab();
      expect(screen.getByRole('link')).toHaveFocus();
    });

    it('without disabled or loading, Enter follows the link handlers as usual', async () => {
      const user = userEvent.setup();
      const childClick = vi.fn((event: MouseEvent) => event.preventDefault());
      render(
        <Button asChild>
          <a href="#docs" onClick={childClick}>
            Docs
          </a>
        </Button>,
      );
      screen.getByRole('link').focus();
      await user.keyboard('{Enter}');
      expect(childClick).toHaveBeenCalledTimes(1);
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

  it('a loading button has no accessibility violations', async () => {
    const { container } = render(<Button loading>Saving</Button>);
    await expectNoA11yViolations(container);
  });

  const combos = COLORS.flatMap((color) => VARIANTS.map((variant) => [color, variant] as const));
  it.each(combos)('color=%s variant=%s has no accessibility violations', async (color, variant) => {
    const { container } = render(<Button color={color} variant={variant}>Go</Button>);
    await expectNoA11yViolations(container);
  });
});
