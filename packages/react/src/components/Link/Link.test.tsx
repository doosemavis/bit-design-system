import { describe, expect, it, vi } from 'vitest';
import { createRef, forwardRef } from 'react';
import type { AnchorHTMLAttributes } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Link } from './Link';
import { expectNoA11yViolations } from '../../test/a11y';

/** Stands in for a router's link: takes `to`, renders an `<a>`, forwards the ref. */
const RouterLink = forwardRef<HTMLAnchorElement, AnchorHTMLAttributes<HTMLAnchorElement> & { to: string }>(
  function RouterLink({ to, ...rest }, ref) {
    return <a ref={ref} href={to} data-router="" {...rest} />;
  },
);

describe('Link', () => {
  it('renders an <a> with the primary color by default', () => {
    render(<Link href="/docs">Docs</Link>);
    const link = screen.getByRole('link', { name: 'Docs' });
    expect(link.tagName).toBe('A');
    expect(link.className).toBe('bit-link bit-primary');
    expect(link).toHaveAttribute('href', '/docs');
  });

  it('color="neutral" maps to bit-neutral', () => {
    render(
      <Link href="/docs" color="neutral">
        Docs
      </Link>,
    );
    expect(screen.getByRole('link').className).toBe('bit-link bit-neutral');
  });

  it('drops a color outside primary and neutral, with a warning', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(
      // @ts-expect-error danger is not a Link color
      <Link href="/docs" color="danger">
        Docs
      </Link>,
    );
    expect(screen.getByRole('link').className).toBe('bit-link');
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it('appends className last, forwards the ref, and passes rest props to the <a>', () => {
    const ref = createRef<HTMLAnchorElement>();
    render(
      <Link ref={ref} href="/docs" className="extra" target="_blank" rel="noreferrer">
        Docs
      </Link>,
    );
    const link = screen.getByRole('link');
    expect(link.className).toBe('bit-link bit-primary extra');
    expect(ref.current).toBe(link);
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noreferrer');
  });

  it('asChild renders the child instead of an <a>, with the classes merged (Link first)', () => {
    const { container } = render(
      <Link asChild color="neutral">
        <RouterLink to="/tokens" className="active">
          Tokens
        </RouterLink>
      </Link>,
    );
    const link = screen.getByRole('link', { name: 'Tokens' });
    expect(container.querySelectorAll('a')).toHaveLength(1);
    expect(link).toHaveAttribute('data-router');
    expect(link).toHaveAttribute('href', '/tokens');
    expect(link.className).toBe('bit-link bit-neutral active');
  });

  it('asChild merges style (the child wins), chains handlers (child first) and composes refs', async () => {
    const calls: string[] = [];
    const linkRef = createRef<HTMLAnchorElement>();
    const childRef = createRef<HTMLAnchorElement>();
    render(
      <Link
        asChild
        ref={linkRef}
        style={{ color: 'red', marginTop: 4 }}
        onClick={(event) => {
          event.preventDefault();
          calls.push('link');
        }}
      >
        <RouterLink to="/tokens" ref={childRef} style={{ color: 'blue' }} onClick={() => calls.push('child')}>
          Tokens
        </RouterLink>
      </Link>,
    );
    const link = screen.getByRole('link');
    expect(link.style.color).toBe('blue');
    expect(link.style.marginTop).toBe('4px');
    await userEvent.click(link);
    expect(calls).toEqual(['child', 'link']);
    expect(linkRef.current).toBe(link);
    expect(childRef.current).toBe(link);
  });

  it('asChild throws with no child, and with two children', () => {
    const message = '[bit] Link asChild needs exactly one child element.';
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<Link asChild />)).toThrow(message);
    expect(() =>
      render(
        <Link asChild>
          <a href="/a">A</a>
          <a href="/b">B</a>
        </Link>,
      ),
    ).toThrow(message);
    vi.restoreAllMocks();
  });

  it.each(['primary', 'neutral'] as const)('has no accessibility violations (%s, plain and asChild)', async (color) => {
    const { container } = render(
      <p>
        Read the{' '}
        <Link href="/install" color={color}>
          install guide
        </Link>{' '}
        or the{' '}
        <Link asChild color={color}>
          <RouterLink to="/tokens">tokens</RouterLink>
        </Link>
        .
      </p>,
    );
    await expectNoA11yViolations(container);
  });
});
