import { forwardRef } from 'react';
import type { HTMLAttributes, ReactNode } from 'react';
import { element, toClasses } from '../../system/toClasses';
import { iconMenu } from '../../icons/icons.generated';
import { Button } from '../Button/Button';
import { Icon } from '../Icon/Icon';
import { Menu } from '../Menu/Menu';
import { NavbarContext } from './NavbarContext';

const variants = ['pill', 'bar'] as const;
const sizes = ['sm', 'md'] as const;

export interface NavbarProps extends Omit<HTMLAttributes<HTMLDivElement>, 'color' | 'children'> {
  /**
   * `pill`: a surface bar with the links in one outlined pill, the current one filled primary. `bar`: the whole
   * bar in primary, links in the pixel font, the current one a raised chip. Both are exactly the same height.
   * Class: `bit-{variant}`.
   */
  variant?: (typeof variants)[number];
  /** Bar height: sm 62px, md 70px, the same for both variants. Class: `bit-{size}`. */
  size?: (typeof sizes)[number];
  /** The start of the bar: your logo or name, often a link home. */
  brand?: ReactNode;
  /** The end of the bar: a Button, an IconButton, a ModeToggle. They stay visible when the links fold. */
  actions?: ReactNode;
  /** Names the links' <nav> landmark, so screen readers can tell it from other navigation. Default: 'Main'. */
  label?: string;
  /** The text on the button the links fold into, and the title of the Menu it opens. Default: 'Menu'. */
  menuLabel?: string;
  /**
   * When the links fold into a Menu: `auto` when the Navbar is narrower than 40rem (a container query, so it
   * follows the Navbar's own width, not the window's), `always`, or `never`. Rendered as `data-collapse`.
   * Default: 'auto'.
   */
  collapse?: 'auto' | 'always' | 'never';
  /** The links: NavbarLink, one per page. */
  children: ReactNode;
}

/**
 * An app's top bar: the brand, a <nav> landmark of links (the current page marked), and actions at the end.
 * Narrow, the links fold into a Menu opened by a Menu button, and the brand and actions stay. The root is a
 * <div>, so it can sit in your page's own <header> (a header can't hold another); that wrapper is also where
 * `position: sticky` goes. Class: `bit-navbar` on the root.
 */
export const Navbar = forwardRef<HTMLDivElement, NavbarProps>(function Navbar(
  { variant = 'pill', size = 'md', brand, actions, label = 'Main', menuLabel = 'Menu', collapse = 'auto', className, children, ...rest },
  ref,
) {
  const classes = toClasses(
    'navbar',
    [
      { name: 'variant', allowed: variants, value: variant },
      { name: 'size', allowed: sizes, value: size },
    ],
    className,
  );
  // `auto` renders both forms and navbar.css shows one; the others render only the one they show.
  const row = collapse !== 'always';
  const folded = collapse !== 'never';
  return (
    <div ref={ref} className={classes} data-collapse={collapse} {...rest}>
      {brand ? <div className={element('navbar', 'brand')}>{brand}</div> : null}
      <nav aria-label={label} className={element('navbar', 'nav')}>
        {row ? (
          <ul className={element('navbar', 'links')}>
            <NavbarContext.Provider value="row">{children}</NavbarContext.Provider>
          </ul>
        ) : null}
        {folded ? (
          <div className={element('navbar', 'menu')}>
            <Menu
              title={menuLabel}
              size={size === 'sm' ? 'sm' : 'md'}
              trigger={
                <Button variant="outline" color="neutral" size={size === 'sm' ? 'sm' : 'md'} className={element('navbar', 'toggle')}>
                  <Icon icon={iconMenu} size={size === 'sm' ? 'sm' : 'md'} />
                  {/* Hidden from sight (not from screen readers) when the Navbar is very narrow: the button is then its icon. */}
                  <span className={element('navbar', 'toggle-label')}>{menuLabel}</span>
                </Button>
              }
            >
              <NavbarContext.Provider value="menu">{children}</NavbarContext.Provider>
            </Menu>
          </div>
        ) : null}
      </nav>
      {actions ? <div className={element('navbar', 'actions')}>{actions}</div> : null}
    </div>
  );
});
