import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef, forwardRef } from 'react';
import type { AnchorHTMLAttributes, ReactNode, Ref } from 'react';
import { Navbar } from './Navbar';
import type { NavbarProps } from './Navbar';
import { NavbarLink } from './NavbarLink';
import { Button } from '../Button/Button';
import { expectNoA11yViolations } from '../../test/a11y';

/** A stand-in for a router's link: it renders an <a> and navigates on click without a page load. */
const RouterLink = forwardRef<HTMLAnchorElement, AnchorHTMLAttributes<HTMLAnchorElement> & { to: string; onNavigate?: (to: string) => void }>(
  function RouterLink({ to, onNavigate, onClick, ...rest }, ref) {
    return (
      <a
        ref={ref}
        href={to}
        {...rest}
        onClick={(event) => {
          onClick?.(event);
          event.preventDefault();
          onNavigate?.(to);
        }}
      />
    );
  },
);

function Arcade(props: Partial<NavbarProps> & { ref?: Ref<HTMLDivElement>; extra?: ReactNode }) {
  const { extra, ...rest } = props;
  return (
    <Navbar brand="Arcade" actions={<Button size="sm">Sign in</Button>} {...rest}>
      <NavbarLink href="#games" current>
        Games
      </NavbarLink>
      <NavbarLink href="#scores">Scores</NavbarLink>
      <NavbarLink href="#shop">Shop</NavbarLink>
      {extra}
    </Navbar>
  );
}

const root = () => document.querySelector<HTMLElement>('.bit-navbar')!;

describe('Navbar', () => {
  it('is a div holding the brand, a named nav landmark of links, and the actions; no banner of its own', () => {
    render(<Arcade collapse="never" />);
    expect(screen.queryByRole('banner')).toBeNull();
    const header = root();
    expect(header.tagName).toBe('DIV');
    expect(header.className).toBe('bit-navbar bit-pill bit-md');
    expect(header.querySelector('.bit-navbar__brand')).toHaveTextContent('Arcade');
    const nav = within(header).getByRole('navigation', { name: 'Main' });
    expect(within(nav).getByRole('list').className).toBe('bit-navbar__links');
    expect(within(nav).getAllByRole('link').map((link) => link.textContent)).toEqual(['Games', 'Scores', 'Shop']);
    expect(header.querySelector('.bit-navbar__actions')).toContainElement(screen.getByRole('button', { name: 'Sign in' }));
  });

  it('the current link carries aria-current="page"; the others none', () => {
    render(<Arcade collapse="never" />);
    expect(screen.getByRole('link', { name: 'Games' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Scores' })).not.toHaveAttribute('aria-current');
    expect(screen.getByRole('link', { name: 'Games' }).className).toBe('bit-navbar__link');
  });

  it('variant and size are decorators; className goes last and a decorator in it wins', () => {
    const { rerender } = render(<Arcade variant="bar" size="sm" className="extra" />);
    expect(root().className).toBe('bit-navbar bit-bar bit-sm extra');
    rerender(<Arcade variant="bar" className="bit-pill" />);
    expect(root().className).toBe('bit-navbar bit-md bit-pill');
  });

  it('label names the nav landmark', () => {
    render(<Arcade label="Arcade sections" collapse="never" />);
    expect(screen.getByRole('navigation', { name: 'Arcade sections' })).toBeInTheDocument();
  });

  it('forwards the ref to the root and spreads other props onto it', () => {
    const ref = createRef<HTMLDivElement>();
    render(<Arcade ref={ref} data-testid="top" />);
    expect(ref.current).toBe(screen.getByTestId('top'));
  });

  it('brand and actions are optional', () => {
    render(
      <Navbar collapse="never">
        <NavbarLink href="#a">A</NavbarLink>
      </Navbar>,
    );
    expect(root().querySelector('.bit-navbar__brand')).toBeNull();
    expect(root().querySelector('.bit-navbar__actions')).toBeNull();
  });

  it('a router link works with asChild: classes and aria-current merge onto it, and its own click runs', async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();
    render(
      <Navbar collapse="never">
        <NavbarLink asChild current>
          <RouterLink to="/games" onNavigate={onNavigate}>
            Games
          </RouterLink>
        </NavbarLink>
      </Navbar>,
    );
    const link = screen.getByRole('link', { name: 'Games' });
    expect(link).toHaveAttribute('href', '/games');
    expect(link).toHaveAttribute('aria-current', 'page');
    expect(link).toHaveClass('bit-navbar__link');
    await user.click(link);
    expect(onNavigate).toHaveBeenCalledWith('/games');
  });

  it('throws a clear error for a NavbarLink outside a Navbar, and for asChild without one element', () => {
    const quiet = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<NavbarLink href="#a">A</NavbarLink>)).toThrow('<NavbarLink> must be inside a <Navbar>');
    expect(() =>
      render(
        <Navbar collapse="always">
          <NavbarLink asChild>text</NavbarLink>
        </Navbar>,
      ),
    ).toThrow('NavbarLink asChild needs exactly one child element');
    quiet.mockRestore();
  });

  it('sits in a page header without nesting one: the app’s <header> stays the only banner', () => {
    render(
      <header>
        <Arcade collapse="never" />
      </header>,
    );
    expect(screen.getAllByRole('banner')).toHaveLength(1);
    expect(within(screen.getByRole('banner')).getByRole('navigation', { name: 'Main' })).toBeInTheDocument();
  });

  it('has no accessibility violations in either variant, row or folded', async () => {
    const { container, rerender } = render(<Arcade collapse="never" />);
    await expectNoA11yViolations(container);
    rerender(<Arcade collapse="always" variant="bar" />);
    await expectNoA11yViolations(container);
  });
});

describe('Navbar folding into a Menu', () => {
  const toggle = () => screen.getByRole('button', { name: 'Menu' });

  it('collapse="auto" (the default) renders both the row and the Menu button; navbar.css shows one by width', () => {
    render(<Arcade />);
    expect(root()).toHaveAttribute('data-collapse', 'auto');
    expect(root().querySelector('.bit-navbar__links')).not.toBeNull();
    expect(root().querySelector('.bit-navbar__menu')).toContainElement(toggle());
  });

  it('collapse="never" renders only the row; "always" only the Menu', () => {
    const { rerender } = render(<Arcade collapse="never" />);
    expect(screen.queryByRole('button', { name: 'Menu' })).toBeNull();
    rerender(<Arcade collapse="always" />);
    expect(root().querySelector('.bit-navbar__links')).toBeNull();
    expect(toggle()).toHaveAttribute('aria-haspopup', 'menu');
  });

  it('folded, the button opens a Menu titled like it, with the links as items, the current one marked', async () => {
    const user = userEvent.setup();
    render(<Arcade collapse="always" />);
    expect(toggle().className).toContain('bit-navbar__toggle');
    // Its words stay in the name even when navbar.css hides them from sight on a very narrow bar.
    expect(toggle().querySelector('.bit-navbar__toggle-label')).toHaveTextContent('Menu');
    await user.click(toggle());
    const menu = screen.getByRole('menu', { name: 'Menu' });
    const items = within(menu).getAllByRole('menuitem');
    expect(items.map((item) => item.textContent)).toEqual(['Games', 'Scores', 'Shop']);
    expect(items[0]!.tagName).toBe('A');
    expect(items[0]).toHaveAttribute('href', '#games');
    expect(items[0]).toHaveAttribute('aria-current', 'page');
    expect(items[0]).toHaveFocus();
    // The brand and actions stay outside the Menu.
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeVisible();
    expect(within(screen.getByRole('navigation', { name: 'Main' })).getByRole('menu')).toBe(menu);
  });

  it('menuLabel renames the button and the Menu; size sm makes them sm', async () => {
    const user = userEvent.setup();
    render(<Arcade collapse="always" menuLabel="Pages" size="sm" />);
    const button = screen.getByRole('button', { name: 'Pages' });
    expect(button).toHaveClass('bit-sm');
    await user.click(button);
    expect(screen.getByRole('menu', { name: 'Pages' }).closest('.bit-menu')).toHaveClass('bit-sm');
  });

  it('a router link in the folded Menu navigates by its own click, and the Menu closes', async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();
    render(
      <Navbar collapse="always">
        <NavbarLink asChild>
          <RouterLink to="/scores" onNavigate={onNavigate} className="mine">
            Scores
          </RouterLink>
        </NavbarLink>
      </Navbar>,
    );
    await user.click(toggle());
    const item = screen.getByRole('menuitem', { name: 'Scores' });
    expect(item).toHaveClass('bit-menu__item', 'mine');
    await user.keyboard('{Enter}');
    expect(onNavigate).toHaveBeenCalledWith('/scores');
    expect(toggle()).toHaveAttribute('aria-expanded', 'false');
    expect(toggle()).toHaveFocus();
  });

  it("NavbarLink's className reaches the folded item too", async () => {
    const user = userEvent.setup();
    render(
      <Navbar collapse="always">
        <NavbarLink href="#a" className="mine">
          A
        </NavbarLink>
      </Navbar>,
    );
    await user.click(toggle());
    expect(screen.getByRole('menuitem', { name: 'A' })).toHaveClass('bit-menu__item', 'mine');
  });

  it('a ref on a NavbarLink reaches the link, in the row and folded', async () => {
    const user = userEvent.setup();
    const rowRef = createRef<HTMLAnchorElement>();
    const { unmount } = render(
      <Navbar collapse="never">
        <NavbarLink ref={rowRef} href="#a">
          A
        </NavbarLink>
      </Navbar>,
    );
    expect(rowRef.current).toBe(screen.getByRole('link', { name: 'A' }));
    unmount();
    const menuRef = createRef<HTMLAnchorElement>();
    render(
      <Navbar collapse="always">
        <NavbarLink ref={menuRef} href="#a">
          A
        </NavbarLink>
      </Navbar>,
    );
    await user.click(toggle());
    expect(menuRef.current).toBe(screen.getByRole('menuitem', { name: 'A' }));
  });
});
